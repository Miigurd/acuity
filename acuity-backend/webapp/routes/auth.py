"""
ACUITY — Authentication Routes
User registration and login for residents and business owners.
"""
import os
from flask import Blueprint, request, jsonify  # type: ignore
from flask_jwt_extended import create_access_token  # type: ignore

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/admin-login", methods=["POST"])
def admin_login():
    """Admin login endpoint."""
    data = request.json
    if not data or not data.get("password"):
        return jsonify({"error": "Missing password"}), 400

    password = data.get("password")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if password == admin_password:
        access_token = create_access_token(identity="admin")
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
