import os
import json
from datetime import datetime
from webapp.app import create_app
from webapp.models import (
    db, BusinessProfile, FlagLog, BusinessCategory, BusinessService, 
    BusinessPhone, BusinessHour, BusinessLocation, BusinessPrice, 
    BusinessStat, EditHistoryLog, BPLORegistry, VerificationMatch, 
    BusinessStatusHistory, HeldEdit
)
from acuity.utils import token_sort_ratio
from acuity.config import AcuityConfig

def update_database():
    app = create_app()
    with app.app_context():
        print("Starting safe pipeline database update...")
        
        # 1. Delete ONLY Unverified businesses
        unverified_query = db.session.query(BusinessProfile.id).filter_by(status='Unverified')
        unverified_ids = unverified_query
        
        print("Cleaning up existing unverified businesses...")
        BusinessStat.query.filter(BusinessStat.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessPrice.query.filter(BusinessPrice.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessLocation.query.filter(BusinessLocation.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessHour.query.filter(BusinessHour.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessPhone.query.filter(BusinessPhone.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessService.query.filter(BusinessService.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessCategory.query.filter(BusinessCategory.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        FlagLog.query.filter(FlagLog.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        BusinessStatusHistory.query.filter(BusinessStatusHistory.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        HeldEdit.query.filter(HeldEdit.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        EditHistoryLog.query.filter(EditHistoryLog.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        VerificationMatch.query.filter(VerificationMatch.business_id.in_(unverified_ids)).delete(synchronize_session=False)
        
        deleted_count = BusinessProfile.query.filter_by(status='Unverified').delete(synchronize_session=False)
        db.session.commit()
        print(f"Removed {deleted_count} unverified businesses.")
        
        # 2. Prepare BPLO Registry data for matching
        bplo_records = BPLORegistry.query.all()
        bplo_name_map = {r.name.lower(): r for r in bplo_records if r.name}
        bplo_lower_names = list(bplo_name_map.keys())
        config = AcuityConfig()
        
        # 3. Load newly scraped businesses
        frontend_path = os.path.join(os.path.dirname(__file__), "data", "processed", "frontend_businesses_fixed.json")
        if not os.path.exists(frontend_path):
            print(f"Error: Could not find {frontend_path}")
            return
            
        with open(frontend_path, "r", encoding="utf-8") as f:
            businesses = json.load(f)
            
        print(f"Processing {len(businesses)} scraped businesses...")
        
        added_count = 0
        skipped_count = 0
        
        for b in businesses:
            name = b.get("name") or b.get("business_name")
            if not name: 
                continue
                
            # Skip if business already exists in the database (since we preserved Verified/Pending)
            existing = BusinessProfile.query.filter_by(business_name=name).first()
            if existing:
                skipped_count += 1
                continue
                
            # 4. BPLO Cross-Check
            profile_name = str(name).strip().lower()
            matches_above_threshold = []
            
            for bplo_name in bplo_lower_names:
                score = token_sort_ratio(profile_name, bplo_name)
                if score >= config.fuzzy_match_threshold_pending:
                    matches_above_threshold.append((bplo_name, score))
            
            final_status = "Unverified"
            is_verified = False
            best_match_id = None
            best_score = 0.0
            
            if matches_above_threshold:
                matches_above_threshold.sort(key=lambda x: x[1], reverse=True)
                best_score = matches_above_threshold[0][1]
                best_match = bplo_name_map[matches_above_threshold[0][0]]
                best_match_id = best_match.id
                
                if best_score >= config.fuzzy_match_threshold_verified:
                    final_status = "Verified"
                    is_verified = True
                else:
                    final_status = "Pending Verification"
            
            # 5. Insert Business
            profile = BusinessProfile(
                business_name=name,
                description=b.get("description"),
                address=b.get("address"),
                contact_info=b.get("contact_info"),
                is_active=b.get("isActive", True),
                is_verified=is_verified,
                status=final_status,
                category_id=b.get("categoryId"),
                landmark_id=b.get("landmarkId")
            )
            
            db.session.add(profile)
            db.session.flush() # Get the auto-incremented ID
            
            # Insert VerificationMatch if applicable
            if best_match_id:
                vmatch = VerificationMatch(
                    business_id=profile.id,
                    bplo_id=best_match_id,
                    confidence_score=round(best_score, 2)
                )
                db.session.add(vmatch)
                
                # Also log the status history
                history = BusinessStatusHistory(
                    business_id=profile.id,
                    admin_id="System (Auto-Pipeline)",
                    previous_status="Unverified",
                    new_status=final_status
                )
                db.session.add(history)
            
            # Insert Sub-entities (safely truncating to 255 chars to prevent database crashes)
            for c in set(b.get("categories", [])): db.session.add(BusinessCategory(business_id=profile.id, category=c[:255] if c else c))
            for s in set(b.get("services", [])): db.session.add(BusinessService(business_id=profile.id, service=s[:255] if s else s))
            for p in set(b.get("phones", [])): db.session.add(BusinessPhone(business_id=profile.id, phone=p[:50] if p else p))
            for h in set(b.get("hours", [])): db.session.add(BusinessHour(business_id=profile.id, hour_schedule=h[:255] if h else h))
            for l in set(b.get("locations", [])): db.session.add(BusinessLocation(business_id=profile.id, location=l[:255] if l else l))
            for pr in set(b.get("prices", [])): db.session.add(BusinessPrice(business_id=profile.id, price_info=pr[:255] if pr else pr))
            
            stats_obj = b.get("stats", {})
            db.session.add(BusinessStat(
                business_id=profile.id,
                impressions=stats_obj.get("impressions", 0),
                clicks=stats_obj.get("clicks", 0),
                inquiries=stats_obj.get("inquiries", 0),
                created_at=stats_obj.get("created", datetime.utcnow().isoformat()[:10])
            ))
            
            # Insert Flags
            reasons = b.get("flagReasons", [])
            count = b.get("flagCount", 0)
            if count > 0 and not reasons:
                reasons = ["Community Flag"] * count
            elif count > len(reasons):
                reasons.extend(["Community Flag"] * (count - len(reasons)))
                
            for r in reasons:
                flag = FlagLog(business_id=profile.id, reason=r)
                db.session.add(flag)
                
            added_count += 1
            
        db.session.commit()
        print(f"Update complete! Added {added_count} new businesses (skipped {skipped_count} existing).")

if __name__ == "__main__":
    update_database()
