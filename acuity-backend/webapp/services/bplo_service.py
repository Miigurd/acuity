import csv
import re
from webapp.models import db, BPLORegistry, VerificationMatch, BusinessProfile
from sqlalchemy.orm import selectinload
from webapp.utils import levenshtein_ratio, levenshtein_details
from datetime import datetime
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from acuity.config import default_config


def upload_bplo_csv(records, fieldnames):
    name_col = None
    for col in fieldnames or []:
        if "name" in str(col).lower() or "business" in str(col).lower():
            name_col = col
            break
    
    if not name_col:
        return {"status": "error", "message": "Could not identify business name column"}
        
    BPLORegistry.query.delete()
    VerificationMatch.query.delete()
    
    bplo_entries = []
    bplo_name_map = {}
    
    for row in records:
        b_name = row.get(name_col)
        if not b_name: continue
        
        address_col = next((c for c in fieldnames if "address" in str(c).lower() or "location" in str(c).lower()), None)
        address = row.get(address_col) if address_col else None
        
        bplo_entry = BPLORegistry(name=str(b_name).strip(), address=str(address).strip() if address else None)
        db.session.add(bplo_entry)
        bplo_entries.append(bplo_entry)
        
    db.session.flush()
    
    for bplo in bplo_entries:
        bplo_name_map[bplo.name.lower()] = bplo
        
    bplo_lower_names = list(bplo_name_map.keys())
    
    unverified_profiles = BusinessProfile.query.filter_by(is_verified=False).all()
    
    auto_verified = 0
    queued = 0
    
    for profile in unverified_profiles:
        # Reset any previous pending statuses
        profile.status = "Unverified"
        
        profile_name = (profile.business_name or "").lower()
        if not profile_name: continue
        
        # Fast Path: O(1) Exact match
        if profile_name in bplo_name_map:
            profile.is_verified = True
            profile.status = "Verified"
            profile.last_verified_year = datetime.utcnow().year
            auto_verified += 1
            
            match_entry = VerificationMatch(
                business_id=profile.id,
                bplo_id=bplo_name_map[profile_name].id,
                confidence_score=1.0
            )
            db.session.add(match_entry)
            continue
            
        # Fuzzy Path: Levenshtein Distance
        matches_above_threshold = []
        
        for bplo_name in bplo_lower_names:
            score = levenshtein_ratio(profile_name, bplo_name)
            if score >= default_config.fuzzy_match_threshold_pending:
                matches_above_threshold.append((bplo_name, score))
        
        if matches_above_threshold:
            matches_above_threshold.sort(key=lambda x: x[1], reverse=True)
            best_score = matches_above_threshold[0][1]
            
            if best_score >= default_config.fuzzy_match_threshold_verified:
                profile.is_verified = True
                profile.status = "Verified"
                profile.last_verified_year = datetime.utcnow().year
                auto_verified += 1
                
                best_match = bplo_name_map[matches_above_threshold[0][0]]
                match_entry = VerificationMatch(
                    business_id=profile.id,
                    bplo_id=best_match.id,
                    confidence_score=round(best_score, 2)
                )
                db.session.add(match_entry)
            else:
                for bplo_name, score in matches_above_threshold:
                    best_match = bplo_name_map[bplo_name]
                    match_entry = VerificationMatch(
                        business_id=profile.id,
                        bplo_id=best_match.id,
                        confidence_score=round(score, 2)
                    )
                    db.session.add(match_entry)
                profile.status = "Pending Verification"
                queued += 1
    # raise Exception("Simulated Database Crash!") # <-- ADD THIS LINE
                
    db.session.commit()
    return {
        "status": "success",
        "message": "BPLO data processed successfully",
        "auto_verified": auto_verified,
        "queued": queued,
        "bplo_count": len(bplo_entries)
    }

def get_bplo_queue():
    # Eager load the business and its locations to avoid N+1 queries during queue rendering
    matches = VerificationMatch.query.join(BusinessProfile).filter(
        BusinessProfile.is_verified == False
    ).options(
        selectinload(VerificationMatch.business).selectinload(BusinessProfile.locations),
        selectinload(VerificationMatch.bplo)
    ).all()
    
    grouped_queue = {}
    
    for m in matches:
        extracted = m.business
        bplo = m.bplo
        address = extracted.locations[0].location if extracted.locations else extracted.address
        
        extracted_name = extracted.business_name or ""
        bplo_name = bplo.name or ""
        details = levenshtein_details(extracted_name.lower(), bplo_name.lower())
        
        if extracted.id not in grouped_queue:
            grouped_queue[extracted.id] = {
                "business_id": extracted.id,
                "extracted": {
                    "name": extracted_name,
                    "address": address or "Unknown"
                },
                "matches": []
            }
            
        grouped_queue[extracted.id]["matches"].append({
            "match_id": m.id,
            "registry": {
                "name": bplo_name,
                "address": bplo.address or "Unknown"
            },
            "score": f"{int(m.confidence_score * 100)}%",
            "score_val": m.confidence_score,
            "edits": details["edits"],
            "max_len": details["max_len"]
        })
        
    for b_id in grouped_queue:
        grouped_queue[b_id]["matches"].sort(key=lambda x: x["score_val"], reverse=True)
        
    return list(grouped_queue.values())

def approve_bplo_match(match_id):
    match = VerificationMatch.query.options(selectinload(VerificationMatch.business)).get(match_id)
    if not match:
        return {"status": "error", "message": "Queue item not found", "code": 404}
        
    profile = match.business
    profile.is_verified = True
    profile.status = "Verified"
    profile.last_verified_year = datetime.utcnow().year
    
    VerificationMatch.query.filter(VerificationMatch.business_id == profile.id, VerificationMatch.id != match_id).delete()
    db.session.commit()
    return {"status": "success", "message": "Approved and verified", "code": 200}
    
def reject_bplo_match(match_id):
    match = VerificationMatch.query.get(match_id)
    if not match:
        return {"status": "error", "message": "Queue item not found", "code": 404}
        
    business = match.business
    if business:
        db.session.delete(business)
        
    db.session.delete(match)
    db.session.commit()
    return {"status": "success", "message": "Rejected match and deleted business profile", "code": 200}
