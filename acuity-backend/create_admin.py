
import sys
from webapp.app import create_app
from webapp.models import db, AdminUser
from werkzeug.security import generate_password_hash

def main():
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <username> <password>")
        sys.exit(1)
        
    username = sys.argv[1]
    password = sys.argv[2]
    
    app = create_app()
    with app.app_context():
        # Ensure table exists
        AdminUser.__table__.create(db.engine, checkfirst=True)
        
        existing = AdminUser.query.filter_by(username=username).first()
        if existing:
            print(f"Error: Admin user {username} already exists.")
            sys.exit(1)
            
        new_admin = AdminUser(
            username=username,
            password_hash=generate_password_hash(password),
            role="Admin"
        )
        db.session.add(new_admin)
        db.session.commit()
        print(f"Success! Admin account {username} created.")

if __name__ == "__main__":
    main()

