"""
ACUITY — Flask Application Entry Point

Usage:
    python -m webapp.app
"""
import os

from flask import Flask  # type: ignore
from flask_cors import CORS  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()


def create_app() -> Flask:
    """Application factory for the ACUITY web app."""
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )

    CORS(app)  # Enable CORS for all routes

    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, "..", "data", "acuity.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", f"sqlite:///{db_path}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    from .models import db # type: ignore
    db.init_app(app)
    
    with app.app_context():
        # Ensure database tables are created
        db.create_all()

    # Register blueprints
    from .routes.api import api_bp  # type: ignore
    from .routes.search import search_bp  # type: ignore
    from .routes.business import business_bp  # type: ignore
    from .routes.auth import auth_bp  # type: ignore

    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(search_bp)
    app.register_blueprint(business_bp, url_prefix="/business")
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=os.getenv("FLASK_HOST", "0.0.0.0"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "true").lower() == "true",
    )
