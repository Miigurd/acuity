"""
ACUITY — WSGI Entry Point for Production
Used by Gunicorn.
"""
from webapp.app import create_app
from webapp.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(app)
