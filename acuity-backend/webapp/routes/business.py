"""
ACUITY — Business Profile Routes
CRUD operations for business profiles (primarily for business owners).
"""
from flask import Blueprint, render_template  # type: ignore

business_bp = Blueprint("business", __name__)


@business_bp.route("/<int:business_id>")
def profile(business_id: int):
    """Display a single business profile."""
    # TODO: Fetch business from database
    business = None
    return render_template("profile.html", business=business)
