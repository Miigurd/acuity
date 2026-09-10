import sys
import os
# Add the project root to sys.path so we can import modules like webapp
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from webapp.app import create_app
from webapp.models import db

def clear_db():
    app = create_app()
    with app.app_context():
        print("Dropping all tables in the database...")
        db.drop_all()
        print("Recreating all tables...")
        db.create_all()
        print("Database cleared and schema recreated.")

if __name__ == "__main__":
    clear_db()
