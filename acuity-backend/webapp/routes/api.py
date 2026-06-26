"""
ACUITY — API Routes
Serves data extracted by the pipeline to the frontend from the SQLite database.
"""
from flask import Blueprint, jsonify, request  # type: ignore

from webapp.services import (
    get_business_by_id,
    get_all_businesses,
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

api_bp = Blueprint("api", __name__)

@api_bp.route("/businesses/<int:id>", methods=["GET"])
def get_business(id):
    """Return a specific business profile by ID."""
    try:
        profile = get_business_by_id(id)
        if not profile:
            return jsonify({"error": "Business not found"}), 404
        return jsonify(profile)
    except Exception as e:
        print(f"Error reading database: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses", methods=["GET"])
def get_businesses():
    """Return all business profiles from the database."""
    try:
        profiles = get_all_businesses()
        return jsonify(profiles)
    except Exception as e:
        print(f"Error reading database: {e}")
        return jsonify({"error": "Failed to load business profiles"}), 500

@api_bp.route("/businesses", methods=["POST"])
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
            return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        print(f"Error writing to database: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@api_bp.route("/businesses/flag", methods=["POST"])
def flag_business():
    """Dynamically increment flag counts for a specific business."""
    payload = request.json
    name_to_flag = payload.get("name")
    reason = payload.get("reason", "Community Flag")

    if not name_to_flag:
        return jsonify({"error": "Missing business name"}), 400

    try:
        result = flag_business_service(name_to_flag, reason)
        return jsonify({"message": result["message"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/search", methods=["GET"])
def search_route():
    """Process a search query using TF-IDF cosine similarity."""
    query = request.args.get("q", "").strip()
    user_lat = request.args.get("lat", type=float)
    user_lon = request.args.get("lon", type=float)

    try:
        results = search_businesses(query, user_lat, user_lon)
        return jsonify(results)
    except Exception as e:
        print(f"Search error: {e}")
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
    filename = file.filename
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
def get_queue():
    try:
        queue = get_bplo_queue()
        return jsonify(queue)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/bplo/queue/<int:id>/approve", methods=["POST"])
def approve_bplo_route(id):
    try:
        result = approve_bplo_match(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_bp.route("/bplo/queue/<int:id>/reject", methods=["POST"])
def reject_bplo_route(id):
    try:
        result = reject_bplo_match(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/held-edits", methods=["GET"])
def held_edits_route():
    """Return all pending held edits."""
    try:
        queue = get_held_edits()
        return jsonify(queue)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/held-edits/<int:id>/approve", methods=["POST"])
def approve_held_edit_route(id):
    """Approve a held edit and apply changes to the business profile."""
    try:
        result = approve_held_edit(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/held-edits/<int:id>/reject", methods=["POST"])
def reject_held_edit_route(id):
    """Reject a held edit."""
    try:
        result = reject_held_edit(id)
        if result["status"] == "error":
            return jsonify({"error": result["message"]}), result.get("code", 500)
        return jsonify({"message": result["message"]}), result.get("code", 200)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
