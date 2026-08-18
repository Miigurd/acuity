"""
ACUITY — API Routes
Serves data extracted by the pipeline to the frontend from the SQLite database.
"""
from flask import Blueprint, jsonify, request  # type: ignore
import logging
from webapp.extensions import socketio
from webapp.services import (
    get_business_by_id,
    get_all_businesses,
    get_paginated_businesses,
    update_businesses,
    flag_business as flag_business_service,
    rollback_business as rollback_business_service,
    upload_bplo_csv,
    get_bplo_queue,
    approve_bplo_match,
    reject_bplo_match,
    get_held_edits,
    approve_held_edit,
    reject_held_edit,
    search_businesses,
    track_interaction_event
)

import os
from acuity.extraction.ner_crf import extract_entities_crf, load_crf_model
from flask_jwt_extended import jwt_required, get_jwt_identity  # type: ignore
from webapp.extensions import limiter
from webapp.models import db, AdminActionLog, BusinessProfile

logger = logging.getLogger(__name__)
api_bp = Blueprint("api", __name__)

_CRF_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../crf_model.pkl"))
_crf_model = load_crf_model(_CRF_MODEL_PATH) if os.path.exists(_CRF_MODEL_PATH) else None

@api_bp.route("/health", methods=["GET"])
def health_check():
    """Simple health check endpoint for monitoring."""
    return jsonify({"status": "ok", "message": "Acuity API is running"}), 200

def log_admin_action(action_type, target_id):
    try:
        admin_id = get_jwt_identity() or "unknown_admin"
        log = AdminActionLog(admin_id=admin_id, action_type=action_type, target_id=str(target_id))
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        logger.error(f"Failed to log admin action: {e}", exc_info=True)

@api_bp.route("/extract", methods=["POST"])
def extract_route():
    """Live extraction endpoint for the IT Expert module."""
    payload = request.json
    if not payload or "text" not in payload:
        return jsonify({"error": "Missing text payload"}), 400
    try:
        results = extract_entities_crf(payload["text"], _crf_model)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/businesses/<int:id>", methods=["GET"])
def get_business(id):
    """Return a specific business profile by ID."""
    try:
        profile = get_business_by_id(id)
        if not profile:
            return jsonify({"error": "Business not found"}), 404
        return jsonify(profile)
    except Exception as e:
        logger.error(f"Error reading database: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses/<int:id>/claim", methods=["POST"])
def claim_business(id):
    """Claim a business profile and receive an SMS PIN."""
    try:
        profile = get_business_by_id(id)
        if not profile:
            return jsonify({"error": "Business not found"}), 404
            
        profile_obj = BusinessProfile.query.get(id)
        if profile_obj is None:
            return jsonify({"error": "Business not found"}), 404
        if profile_obj.pin_locked:
            return jsonify({"error": "Profile is already claimed."}), 400
            
        if not profile_obj.phones:
            return jsonify({"error": "No phone number on record to send the PIN to."}), 400
            
        import random
        new_pin = str(random.randint(100000, 999999))
        profile_obj.owner_pin = new_pin
        profile_obj.pin_locked = True
        db.session.commit()
        
        target_phone = profile_obj.phones[0].phone
        logger.info(f"MOCK SMS to {target_phone}: Your ACUITY Business PIN for {profile_obj.business_name} is: {new_pin}")
        
        return jsonify({"message": f"Profile claimed successfully! PIN sent to {target_phone}."}), 200
    except Exception as e:
        logger.error(f"Error claiming business: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses", methods=["GET"])
def get_businesses():
    """Return all business profiles from the database."""
    try:
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 500, type=int)
        profiles = get_paginated_businesses(page, limit)
        return jsonify(profiles)
    except Exception as e:
        logger.error(f"Error reading database: {e}", exc_info=True)
        return jsonify({"error": "Failed to load business profiles"}), 500

@api_bp.route("/businesses", methods=["POST"])
@limiter.limit("10 per minute")
def update_businesses_route():
    """Save the updated list of business profiles from the frontend."""
    data = request.json
    if data is None:
        return jsonify({"error": "Failed to parse JSON body"}), 400

    ip_address = request.remote_addr
    
    try:
        result = update_businesses(data, ip_address)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        elif result["status"] == "held":
            return jsonify({"message": result["message"]}), result.get("code", 202)
        else:
            socketio.emit("business_updated", {"type": "update"})
            return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        logger.error(f"Error writing to database: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses/flag", methods=["POST"])
@limiter.limit("10 per minute")
def flag_business():
    """Dynamically increment flag counts for a specific business."""
    payload = request.json
    name_to_flag = payload.get("name")
    reason = payload.get("reason", "Community Flag")

    if not name_to_flag:
        return jsonify({"error": "Missing business name"}), 400

    try:
        ip_address = request.remote_addr
        result = flag_business_service(name_to_flag, reason, ip_address)
        socketio.emit("business_flagged", {"name": name_to_flag})
        return jsonify({"message": result["message"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/search", methods=["GET"])
def search_route():
    """Process a search query using TF-IDF cosine similarity."""
    query = request.args.get("q", "").strip()
    user_lat = request.args.get("lat", type=float)
    user_lon = request.args.get("lon", type=float)
    simulate = request.args.get("simulate", "false").lower() == "true"

    try:
        results = search_businesses(query, user_lat, user_lon, simulate=simulate)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        return jsonify([]), 500

@api_bp.route("/track", methods=["POST"])
def track_event():
    """Track user interactions (clicks, searches) and update stats."""
    payload = request.json
    if not payload:
        return jsonify({"error": "No payload"}), 400
        
    event_type = payload.get("eventType")
    biz_name = payload.get("businessName")
    
    try:
        result = track_interaction_event(event_type, biz_name)
        socketio.emit("analytics_updated", {"businessName": biz_name, "event": event_type})
        return jsonify({"message": result["message"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/businesses/<int:id>/rollback", methods=["POST"])
def rollback_business(id):
    """Rollback a business profile to a previous state."""
    payload = request.json
    if not payload or "timestamp" not in payload:
        return jsonify({"error": "Missing timestamp"}), 400
        
    timestamp = payload["timestamp"]
    
    try:
        result = rollback_business_service(id, timestamp)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/bplo/upload", methods=["POST"])
def upload_bplo():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    filename = file.filename or ""
    if filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        import pandas as pd
        if filename.endswith('.csv'):
            df = pd.read_csv(file.stream)
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file.stream)
        else:
            return jsonify({"error": "Unsupported file format. Please upload CSV or XLSX"}), 400
            
        # Convert nan floats to None so it parses correctly
        df = df.where(pd.notnull(df), None)
        records = df.to_dict('records')
        fieldnames = df.columns.tolist()
        
        result = upload_bplo_csv(records, fieldnames)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), 400
        return jsonify({
            "message": result["message"],
            "auto_verified": result.get("auto_verified"),
            "queued": result.get("queued"),
            "bplo_count": result.get("bplo_count")
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/bplo/queue", methods=["GET"])
@jwt_required()
def get_queue():
    try:
        queue = get_bplo_queue()
        return jsonify(queue)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/bplo/queue/<int:id>/approve", methods=["POST"])
@jwt_required()
def approve_bplo_route(id):
    try:
        result = approve_bplo_match(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        
        log_admin_action("approve_bplo_match", id)
        socketio.emit("business_updated", {"type": "bplo_approval"})
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_bp.route("/bplo/queue/<int:id>/reject", methods=["POST"])
@jwt_required()
def reject_bplo_route(id):
    try:
        result = reject_bplo_match(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        
        log_admin_action("reject_bplo_match", id)
        socketio.emit("business_updated", {"type": "bplo_rejection"})
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/held-edits", methods=["GET"])
@jwt_required()
def held_edits_route():
    """Return all pending held edits."""
    try:
        queue = get_held_edits()
        return jsonify(queue)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/held-edits/<int:id>/approve", methods=["POST"])
@jwt_required()
def approve_held_edit_route(id):
    """Approve a held edit and apply changes to the business profile."""
    try:
        result = approve_held_edit(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
            
        log_admin_action("approve_held_edit", id)
        socketio.emit("business_updated", {"type": "held_edit_approval"})
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/held-edits/<int:id>/reject", methods=["POST"])
@jwt_required()
def reject_held_edit_route(id):
    """Reject a held edit."""
    try:
        result = reject_held_edit(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
            
        log_admin_action("reject_held_edit", id)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
