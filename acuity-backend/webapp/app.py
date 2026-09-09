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
    import sentry_sdk
    sentry_dsn = os.getenv("SENTRY_DSN")
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            # Set traces_sample_rate to 1.0 to capture 100%
            # of transactions for performance monitoring.
            traces_sample_rate=1.0,
            # Set profiles_sample_rate to 1.0 to profile 100%
            # of sampled transactions.
            profiles_sample_rate=1.0,
        )

    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )

    import time
    from flask import request, g
    import logging
    
    # Force Flask logger to output INFO level messages to the console
    logging.basicConfig(level=logging.INFO)
    app.logger.setLevel(logging.INFO)

    @app.before_request
    def start_timer():
        g.start = time.time()

    @app.after_request
    def log_request(response):
        if hasattr(g, 'start'):
            duration = (time.time() - g.start) * 1000
            app.logger.info(
                f"{request.method} {request.path} {response.status_code} "
                f"[{duration:.2f}ms]"
            )
        return response

    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    CORS(app)  # Enable CORS for all routes

    from datetime import timedelta
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    # app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=1)
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, "..", "data", "acuity.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", f"sqlite:///{db_path}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "connect_args": {"timeout": 10}
        }
    else:
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {}

    from .models import db # type: ignore
    db.init_app(app)
    
    with app.app_context():
        # Ensure database tables are created
        db.create_all()

    from .extensions import limiter # type: ignore
    
    limiter.init_app(app)

    from flask_jwt_extended import JWTManager # type: ignore
    jwt = JWTManager(app)

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
    is_debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=is_debug
    )
