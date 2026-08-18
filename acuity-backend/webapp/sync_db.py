"""
ACUITY Web App — Database Sync Script
Reads the output from the ACUITY framework extraction pipeline
and upserts the data into the Flask SQLite database.
"""
import os
import json
import difflib
from datetime import datetime

# Import the Flask app and models
from webapp.app import create_app
from webapp.models import ( # type: ignore
    db, BusinessProfile, BusinessCategory, BusinessService, 
    BusinessPhone, BusinessHour, BusinessLocation, 
    BusinessPrice, BusinessStat, BPLORegistry, VerificationMatch
)

def sync_profiles(filepath: str):
    """Reads JSON from filepath and upserts to the database."""
    if not os.path.exists(filepath):
        print(f"Error: Could not find {filepath}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        businesses = json.load(f)

    app = create_app()
    with app.app_context():
        inserted_count = 0
        updated_count = 0
        for b in businesses:
            name = b.get("name") or b.get("business_name")
            if not name: continue
            
            profile = BusinessProfile.query.filter_by(business_name=name).first()
            if not profile:
                profile = BusinessProfile(business_name=name)
                db.session.add(profile)
                db.session.flush()
                inserted_count += 1
            else:
                updated_count += 1
                
            profile.description = b.get("description", profile.description)
            profile.address = b.get("address", profile.address)
            profile.contact_info = b.get("contact_info", profile.contact_info)
            profile.status = b.get("status", profile.status)
            profile.is_verified = b.get("is_verified") or b.get("isVerified") or profile.is_verified
            profile.is_active = b.get("isActive", profile.is_active)
            
            def update_relation(model, field_name, items_list, business_id):
                model.query.filter_by(business_id=business_id).delete()
                for item in items_list:
                    db.session.add(model(business_id=business_id, **{field_name: item}))

            if "categories" in b: update_relation(BusinessCategory, "category", b["categories"], profile.id)
            if "services" in b: update_relation(BusinessService, "service", b["services"], profile.id)
            if "locations" in b: update_relation(BusinessLocation, "location", b["locations"], profile.id)
            if "prices" in b: update_relation(BusinessPrice, "price_info", b["prices"], profile.id)
            if "hours" in b: update_relation(BusinessHour, "hour_schedule", b["hours"], profile.id)
            if "phones" in b: update_relation(BusinessPhone, "phone", b["phones"], profile.id)
            
            if "stats" in b:
                stats_obj = b["stats"]
                stats = profile.stats
                if stats is None:
                    stats = BusinessStat(business_id=profile.id)
                    db.session.add(stats)
                    profile.stats = stats
                
                stats.impressions = stats_obj.get("impressions", stats.impressions or 0)
                stats.clicks = stats_obj.get("clicks", stats.clicks or 0)
                stats.inquiries = stats_obj.get("inquiries", stats.inquiries or 0)
                
        db.session.commit()
        print(f"Synced to SQLite DB! Inserted: {inserted_count}, Updated: {updated_count}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Sync ACUITY profiles to SQLite")
    parser.add_argument("--file", type=str, default="../data/processed/frontend_businesses.json", help="Path to JSON output from pipeline")
    args = parser.parse_args()
    
    sync_path = os.path.abspath(args.file)
    print(f"Syncing from: {sync_path}")
    sync_profiles(sync_path)
