"""
ACUITY — Search Routes
Handles the main search / recommendation interface for residents.
"""
from flask import Blueprint, render_template, request  # type: ignore

search_bp = Blueprint("search", __name__)


@search_bp.route("/", methods=["GET"])
def index():
    """Landing page with search bar."""
    return render_template("index.html")


@search_bp.route("/search", methods=["GET"])
def search():
    """Process a search query and return ranked results."""
    query = request.args.get("q", "").strip()
    # TODO: Hook up RecommendationEngine and return results
    results = []
    return render_template("results.html", query=query, results=results)
