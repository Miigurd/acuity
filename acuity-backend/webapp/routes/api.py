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
from webapp.services.expert_service import trace_recommendation, trace_extraction

import os
from acuity.extraction.ner_crf import extract_entities_crf, load_crf_model
from flask_jwt_extended import jwt_required, get_jwt_identity  # type: ignore
from webapp.extensions import limiter
from webapp.models import db, AdminActionLog, BusinessProfile

logger = logging.getLogger(__name__)
api_bp = Blueprint("api", __name__)

def _find_crf_model():
    """Locate the trained CRF model across candidate paths.

    Candidates: monorepo root (where train_crf.py also saves), the webapp tree,
    and the backend cwd. Returns the first path that exists, else None.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(here, "../../../crf_model.pkl")),   # acuity/ (monorepo root)
        os.path.abspath(os.path.join(here, "../../crf_model.pkl")),      # acuity-backend/
        os.path.join(here, "crf_model.pkl"),                             # webapp/routes/
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None

_CRF_MODEL_PATH = _find_crf_model()
_crf_model = load_crf_model(_CRF_MODEL_PATH) if _CRF_MODEL_PATH else None

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

@api_bp.route("/expert/recommend-trace", methods=["GET"])
def expert_recommend_trace():
    """Live trace of the actual recommendation pipeline (TF-IDF → cosine → Haversine → rank).

    Uses the same cached engine and corpus as ``/api/search``, so every number
    reflects exactly what the production system computes. Never increments impressions.
    """
    query = request.args.get("q", "").strip()
    user_lat = request.args.get("lat", type=float)
    user_lon = request.args.get("lon", type=float)
    top_k = request.args.get("top_k", 50, type=int)

    try:
        trace = trace_recommendation(query, user_lat, user_lon, top_k=top_k)
        return jsonify(trace)
    except Exception as e:
        logger.error(f"Recommendation trace error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@api_bp.route("/expert/extract-trace", methods=["POST"])
def expert_extract_trace():
    """Live trace of the real extraction pipeline (preprocess → CRF NER → rules → profile)."""
    payload = request.json
    if not payload or "text" not in payload:
        return jsonify({"error": "Missing text payload"}), 400
    try:
        trace = trace_extraction(payload["text"], _crf_model)
        return jsonify(trace)
    except Exception as e:
        logger.error(f"Extraction trace error: {e}", exc_info=True)
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

@api_bp.route("/businesses/<int:id>/flag-status", methods=["PATCH"])
def update_flag_status(id):
    """Directly update a business profile's flag status (Admin only)."""
    payload = request.json
    if not payload or "flag_status" not in payload:
        return jsonify({"error": "Missing flag_status"}), 400
        
    try:
        from webapp.models import BusinessProfile, db, BusinessStatusHistory
        profile = BusinessProfile.query.get(id)
        if not profile:
            return jsonify({"error": "Business not found"}), 404
            
        old_status = profile.flag_status
        new_status = payload["flag_status"]
        
        if old_status != new_status:
            logged_status = new_status
            if new_status in ["Archived", "Safe", "Restricted"]:
                if new_status in ["Archived", "Safe"]:
                    profile.flag_status = "None"
                else:
                    profile.flag_status = "Restricted"
                    profile.status = "Restricted"
                
                archived_count = 0
                reasons = []
                for flag in profile.flags:
                    if not flag.is_archived:
                        flag.is_archived = True
                        archived_count += 1
                        reasons.append(flag.reason)
                
                common_reason = "Community Feedback"
                if reasons:
                    from collections import Counter
                    common_reason = Counter(reasons).most_common(1)[0][0]
                    
                logged_status = f"{new_status}|{archived_count}|{common_reason}"
            else:
                profile.flag_status = new_status
            
            history_log = BusinessStatusHistory(
                business_id=profile.id,
                previous_status=old_status,
                new_status=logged_status,
                admin_id="Admin Dashboard"
            )
            db.session.add(history_log)
            db.session.commit()
            
            socketio.emit("business_updated", {"id": id, "type": "flag_status_change"})
            
        return jsonify({"message": f"Flag status updated to {new_status}"}), 200
    except Exception as e:
        logger.error(f"Error updating flag status: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

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
        from werkzeug.security import generate_password_hash
        new_pin = str(random.randint(100000, 999999))
        profile_obj.owner_pin = generate_password_hash(new_pin)
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
        return jsonify({"error": f"Failed to load business profiles: {str(e)}"}), 500

@api_bp.route("/businesses", methods=["POST"])
@limiter.limit("10 per minute")
def update_businesses_route():
    """Save the updated list of business profiles from the frontend."""
    data = request.json
    if data is None:
        return jsonify({"error": "Failed to parse JSON body"}), 400
    forwarded = request.headers.get("X-Forwarded-For")
    ip_address = forwarded.split(',')[0].strip() if forwarded else request.remote_addr
    
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
        forwarded = request.headers.get("X-Forwarded-For")
        ip_address = forwarded.split(',')[0].strip() if forwarded else request.remote_addr
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

@api_bp.route("/log-event", methods=["POST"])
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
@jwt_required()
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
