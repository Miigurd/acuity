"""
ACUITY — API Routes
Serves data extracted by the pipeline to the frontend from the SQLite database.
"""
from flask import Blueprint, jsonify, request, stream_with_context, Response, send_file  # type: ignore
import logging
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
    unverify_business,
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
    if request.args.get("crash") == "true":
        raise Exception("Sentry integration test error!")
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
@jwt_required()
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
                    if profile.status == "Restricted":
                        profile.status = "Verified"
                        profile.is_verified = True
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
                admin_id=get_jwt_identity() or "unknown_admin"
            )
            db.session.add(history_log)
            
            from webapp.models import AdminActionLog
            action_log = AdminActionLog(
                admin_id=get_jwt_identity() or "unknown_admin",
                action_type=f"changed_flag_status_to_{new_status}",
                target_id=str(profile.id)
            )
            db.session.add(action_log)
            
            db.session.commit()
            
            
        return jsonify({"message": f"Flag status updated to {new_status}"}), 200
    except Exception as e:
        logger.error(f"Error updating flag status: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@api_bp.route("/businesses/<int:id>/claim/request-otp", methods=["POST"])
@limiter.limit("3 per minute")
def request_claim_otp(id):
    """Generate and send an OTP for claiming a business."""
    try:
        profile_obj = BusinessProfile.query.get(id)
        if profile_obj is None:
            return jsonify({"error": "Business not found"}), 404
        if profile_obj.pin_locked:
            return jsonify({"error": "Profile is already claimed."}), 400
            
        if not profile_obj.phones:
            return jsonify({"error": "No phone number on record to send the OTP to."}), 400
            
        import random
        import os
        import requests
        from datetime import datetime, timedelta
        from werkzeug.security import generate_password_hash
        
        new_otp = str(random.randint(100000, 999999))
        profile_obj.claim_otp_hash = generate_password_hash(new_otp)
        # Expires in 10 minutes
        profile_obj.claim_otp_expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        db.session.commit()
        
        target_phone = profile_obj.phones[0].phone
        message = f"Your ACUITY claim OTP for {profile_obj.business_name} is: {new_otp}. It expires in 10 minutes."
        
        iprog_token = os.environ.get("IPROG_API_TOKEN")
        if iprog_token:
            try:
                requests.post("https://www.iprogsms.com/api/v1/sms_messages", json={
                    "api_token": iprog_token,
                    "phone_number": target_phone,
                    "message": message
                }, timeout=5)
            except Exception as e:
                logger.error(f"IPROG SMS Error: {e}")
                
        logger.info(f"MOCK SMS to {target_phone}: {message}")
        
        return jsonify({"message": f"OTP sent to {target_phone}."}), 200
    except Exception as e:
        logger.error(f"Error requesting OTP: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses/<int:id>/claim/verify-otp", methods=["POST"])
@limiter.limit("10 per minute")
def verify_claim_otp(id):
    """Verify the OTP without claiming yet."""
    payload = request.json or {}
    otp = payload.get("otp")
    if not otp:
        return jsonify({"error": "OTP is required"}), 400
        
    try:
        profile_obj = BusinessProfile.query.get(id)
        if profile_obj is None:
            return jsonify({"error": "Business not found"}), 404
            
        if not profile_obj.claim_otp_hash:
            return jsonify({"error": "No OTP requested."}), 400
            
        from datetime import datetime
        if profile_obj.claim_otp_expires_at and datetime.utcnow() > datetime.fromisoformat(profile_obj.claim_otp_expires_at):
            return jsonify({"error": "OTP has expired. Please request a new one."}), 400
            
        from werkzeug.security import check_password_hash
        if not check_password_hash(profile_obj.claim_otp_hash, str(otp)):
            return jsonify({"error": "Invalid OTP."}), 400
            
        return jsonify({"message": "OTP is valid.", "valid": True}), 200
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses/<int:id>/claim/finalize", methods=["POST"])
@limiter.limit("10 per minute")
def finalize_claim(id):
    """Finalize claim by verifying OTP again and setting the new PIN."""
    payload = request.json or {}
    otp = payload.get("otp")
    new_pin = str(payload.get("new_pin", ""))
    
    if not otp or not new_pin:
        return jsonify({"error": "OTP and New PIN are required"}), 400
        
    if len(new_pin) != 6 or not new_pin.isdigit():
        return jsonify({"error": "PIN must be exactly 6 numeric digits."}), 400
        
    try:
        profile_obj = BusinessProfile.query.get(id)
        if profile_obj is None:
            return jsonify({"error": "Business not found"}), 404
            
        if not profile_obj.claim_otp_hash:
            return jsonify({"error": "No OTP requested."}), 400
            
        from datetime import datetime
        if profile_obj.claim_otp_expires_at and datetime.utcnow() > datetime.fromisoformat(profile_obj.claim_otp_expires_at):
            return jsonify({"error": "OTP has expired. Please request a new one."}), 400
            
        from werkzeug.security import check_password_hash, generate_password_hash
        if not check_password_hash(profile_obj.claim_otp_hash, str(otp)):
            return jsonify({"error": "Invalid OTP."}), 400
            
        # Success! Clear OTP and set PIN
        profile_obj.owner_pin = generate_password_hash(str(new_pin))
        profile_obj.pin_locked = True
        profile_obj.claim_otp_hash = None
        profile_obj.claim_otp_expires_at = None
        db.session.commit()
        
        return jsonify({"message": "Profile claimed successfully!"}), 200
    except Exception as e:
        logger.error(f"Error finalizing claim: {e}", exc_info=True)
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
        elif result["status"] == "conflict":
            return jsonify({"error": result["message"]}), result.get("code", 409)
        elif result["status"] == "held":
            return jsonify({"message": result["message"]}), result.get("code", 202)
        else:
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
        from flask import make_response
        response = make_response(jsonify(results))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
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
        
        import json
        def generate():
            try:
                for event in upload_bplo_csv(records, fieldnames):
                    yield f"data: {json.dumps(event)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        
        return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
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
        result = approve_bplo_match(id, get_jwt_identity() or "unknown_admin")
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        
        log_admin_action("approve_bplo_match", id)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_bp.route("/bplo/queue/<int:id>/reject", methods=["POST"])
@jwt_required()
def reject_bplo_route(id):
    try:
        result = reject_bplo_match(id, get_jwt_identity() or "unknown_admin")
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        
        log_admin_action("reject_bplo_match", id)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/businesses/<int:id>/unverify", methods=["POST"])
@jwt_required()
def unverify_route(id):
    try:
        result = unverify_business(id, get_jwt_identity() or "unknown_admin")
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        
        log_admin_action("unverify_business", id)
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


@api_bp.route("/bplo/audit-report", methods=["GET"])
@jwt_required()
def download_bplo_audit_report():
    import os
    audit_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "processed", "bplo_audit_trail.csv")
    if not os.path.exists(audit_file_path):
        return jsonify({"error": "No audit report found. Please run a BPLO upload first."}), 404
    return send_file(audit_file_path, as_attachment=True, download_name="Match_Audit_Report.csv", mimetype="text/csv")
