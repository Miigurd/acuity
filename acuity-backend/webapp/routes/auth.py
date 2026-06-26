"""
ACUITY — Authentication Routes
User registration and login for residents and business owners.
"""
from flask import Blueprint  # type: ignore

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login")
def login():
    """Login page."""
    # TODO: Implement login form and authentication logic
    return "Login page — coming soon."


@auth_bp.route("/register")
def register():
    """Registration page."""
    # TODO: Implement registration form
    return "Register page — coming soon."
