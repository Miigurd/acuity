import csv
import difflib
from webapp.models import db, BPLORegistry, VerificationMatch, BusinessProfile
from sqlalchemy.orm import selectinload

def upload_bplo_csv(records, fieldnames):
    name_col = None
    for col in fieldnames or []:
        if "name" in str(col).lower() or "business" in str(col).lower():
            name_col = col
            break
    
    if not name_col:
        name_col = fieldnames[0] if fieldnames else None
        
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
        profile_name = (profile.business_name or "").lower()
        if not profile_name: continue
        
        # Fast Path: O(1) Exact match
        if profile_name in bplo_name_map:
            profile.is_verified = True
            profile.status = "Verified"
            auto_verified += 1
            continue
            
        # Fuzzy Path: Use optimized get_close_matches instead of O(N*M) nested loops
        close_matches = difflib.get_close_matches(profile_name, bplo_lower_names, n=1, cutoff=0.6)
        
        if close_matches:
            best_bplo_name = close_matches[0]
            best_match = bplo_name_map[best_bplo_name]
            best_score = difflib.SequenceMatcher(None, profile_name, best_bplo_name).ratio()
            
            if best_score >= 0.8:
                profile.is_verified = True
                profile.status = "Verified"
                auto_verified += 1
            elif best_score >= 0.6:
                match_entry = VerificationMatch(
                    business_id=profile.id,
                    bplo_id=best_match.id,
                    confidence_score=round(best_score, 2)
                )
                db.session.add(match_entry)
                profile.status = "Pending Verification"
                queued += 1
                
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
    matches = VerificationMatch.query.options(
        selectinload(VerificationMatch.business).selectinload(BusinessProfile.locations),
        selectinload(VerificationMatch.bplo)
    ).all()
    
    queue = []
    for m in matches:
        extracted = m.business
        bplo = m.bplo
        address = extracted.locations[0].location if extracted.locations else extracted.address
        
        queue.append({
            "id": m.id,
            "extracted": {
                "name": extracted.business_name,
                "address": address or "Unknown"
            },
            "registry": {
                "name": bplo.name,
                "address": bplo.address or "Unknown"
            },
            "score": f"{int(m.confidence_score * 100)}%"
        })
    return queue

def approve_bplo_match(match_id):
    match = VerificationMatch.query.options(selectinload(VerificationMatch.business)).get(match_id)
    if not match:
        return {"status": "error", "message": "Queue item not found", "code": 404}
        
    profile = match.business
    profile.is_verified = True
    profile.status = "Verified"
    
    db.session.delete(match)
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
