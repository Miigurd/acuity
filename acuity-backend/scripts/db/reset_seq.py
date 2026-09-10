import sys
import os
# Add the project root to sys.path so we can import modules like webapp
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from webapp.app import create_app
from webapp.models import db

def reset_sequences():
    app = create_app()
    with app.app_context():
        tables = [
            'businesses', 'business_categories', 'business_services', 
            'business_locations', 'business_prices', 'business_hours', 
            'business_phones', 'business_stats', 'bplo_registry', 
            'verification_matches', 'flag_logs', 'edit_history_logs', 
            'business_status_history', 'held_edits'
        ]
        
        for table in tables:
            try:
                # Find the sequence name. Usually it's table_id_seq
                seq_name = f"{table}_id_seq"
                
                # Check if the table is empty
                res = db.session.execute(db.text(f"SELECT COALESCE(MAX(id), 1) FROM {table}")).fetchone()
                max_id = res[0] if res else 1
                
                db.session.execute(db.text(f"SELECT setval('{seq_name}', {max_id})"))
                print(f"Reset {table} sequence to {max_id}")
            except Exception as e:
                db.session.rollback()
                print(f"Skipped {table}: {e}")
                
        db.session.commit()
        print("Done resetting all sequences.")

if __name__ == '__main__':
    reset_sequences()
