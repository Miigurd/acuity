import os
import json
from webapp.app import create_app
from webapp.models import db, BusinessProfile, FlagLog, BusinessCategory, BusinessService, BusinessPhone, BusinessHour, BusinessLocation, BusinessPrice, BusinessStat, EditHistoryLog, BPLORegistry, VerificationMatch
from datetime import datetime

def migrate():
    app = create_app()
    with app.app_context():
        # Clear existing data just in case
        db.drop_all()
        db.create_all()
        
        frontend_path = os.path.join(os.path.dirname(__file__), "data", "processed", "frontend_businesses.json")
        logs_path = os.path.join(os.path.dirname(__file__), "data", "processed", "interaction_logs.json")
        
        if os.path.exists(frontend_path):
            print("Migrating businesses...")
            with open(frontend_path, "r", encoding="utf-8") as f:
                businesses = json.load(f)
                
            for b in businesses:
                name = b.get("name") or b.get("business_name")
                if not name: continue
                
                # Deduplicate by name on insertion
                if BusinessProfile.query.filter_by(business_name=name).first():
                    continue
                    
                profile = BusinessProfile(
                    business_name=name,
                    description=b.get("description"),
                    address=b.get("address"),
                    contact_info=b.get("contact_info"),
                    is_active=b.get("isActive", True),
                    is_verified=b.get("is_verified") or b.get("isVerified") or False,
                    status=b.get("status", "Pending"),
                    category_id=b.get("categoryId"),
                    landmark_id=b.get("landmarkId")
                )
                
                db.session.add(profile)
                db.session.flush() # Get the auto-incremented ID
                
                for c in b.get("categories", []): db.session.add(BusinessCategory(business_id=profile.id, category=c))
                for s in b.get("services", []): db.session.add(BusinessService(business_id=profile.id, service=s))
                for p in b.get("phones", []): db.session.add(BusinessPhone(business_id=profile.id, phone=p))
                for h in b.get("hours", []): db.session.add(BusinessHour(business_id=profile.id, hour_schedule=h))
                for l in b.get("locations", []): db.session.add(BusinessLocation(business_id=profile.id, location=l))
                for pr in b.get("prices", []): db.session.add(BusinessPrice(business_id=profile.id, price_info=pr))
                
                stats_obj = b.get("stats", {})
                db.session.add(BusinessStat(
                    business_id=profile.id,
                    impressions=stats_obj.get("impressions", 0),
                    clicks=stats_obj.get("clicks", 0),
                    inquiries=stats_obj.get("inquiries", 0),
                    created_at=stats_obj.get("created", datetime.utcnow().isoformat()[:10])
                ))
                
                # Migrate Flags
                reasons = b.get("flagReasons", [])
                count = b.get("flagCount", 0)
                
                if count > 0 and not reasons:
                    reasons = ["Community Flag"] * count
                elif count > len(reasons):
                    reasons.extend(["Community Flag"] * (count - len(reasons)))
                    
                for r in reasons:
                    flag = FlagLog(business_id=profile.id, reason=r)
                    db.session.add(flag)
        

        db.session.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
