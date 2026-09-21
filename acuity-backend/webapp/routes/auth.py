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
    if not data or not data.get("password") or not data.get("username"):
        return jsonify({"error": "Missing username or password"}), 400

    password = data.get("password")
    username = data.get("username")

    from webapp.models import AdminUser
    from werkzeug.security import check_password_hash
    admin = AdminUser.query.filter_by(username=username).first()
    if admin and check_password_hash(admin.password_hash, password):
        access_token = create_access_token(identity=admin.username)
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
