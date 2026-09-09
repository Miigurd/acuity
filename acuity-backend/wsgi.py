"""
ACUITY — WSGI Entry Point for Production
Used by Gunicorn.
"""
from webapp.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
