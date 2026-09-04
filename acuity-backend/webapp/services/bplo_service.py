from datetime import datetime
from sqlalchemy.orm import selectinload
from webapp.models import db, BPLORegistry, VerificationMatch, BusinessProfile, BusinessStatusHistory
import re
import difflib
from webapp.extensions import socketio
from acuity.utils import token_sort_ratio, levenshtein_details, levenshtein_ratio
from acuity.config import AcuityConfig  # type: ignore

config = AcuityConfig()




def _fast_levenshtein_ratio(s1: str, s2: str, threshold: float) -> float:
    if not s1 or not s2: return 0.0
    rows = len(s1) + 1
    cols = len(s2) + 1
    max_len = max(len(s1), len(s2))
    max_allowed_edits = int((1.0 - threshold) * max_len)
    
    prev = list(range(cols))
    curr = [0] * cols
    
    for row in range(1, rows):
        curr[0] = row
        min_in_row = row
        char_s1 = s1[row - 1]
        for col in range(1, cols):
            cost = 0 if char_s1 == s2[col - 1] else 1
            val = min(
                curr[col - 1] + 1,
                prev[col] + 1,
                prev[col - 1] + cost
            )
            curr[col] = val
            if val < min_in_row: min_in_row = val
        if min_in_row > max_allowed_edits: return 0.0
        prev, curr = curr, prev
        
    return 1.0 - (prev[-1] / max_len)

def _pre_tokenize_sort(s: str) -> str:
    t = re.findall(r'\w+', str(s).lower())
    t.sort()
    return ' '.join(t)

def upload_bplo_csv(records, fieldnames):
    name_col = None
    for col in fieldnames or []:
        if "name" in str(col).lower() or "business" in str(col).lower():
            name_col = col
            break
    
    if not name_col:
        return {"status": "error", "message": "Could not identify business name column"}
        
    VerificationMatch.query.delete()
    BPLORegistry.query.delete()
    
    bplo_entries = []
    bplo_name_map = {}
    
    for row in records:
        b_name = row.get(name_col)
        if not b_name: continue
        
        address_col = next((c for c in fieldnames if "address" in str(c).lower() or "location" in str(c).lower()), None)
        address = row.get(address_col) if address_col else None
        
        bplo_entry = BPLORegistry(name=str(b_name).strip(), address=str(address).strip() if address else None)  # type: ignore
        db.session.add(bplo_entry)
        bplo_entries.append(bplo_entry)
        
    db.session.flush()
    
    for bplo in bplo_entries:
        bplo_name_map[bplo.name.lower()] = bplo
        
    bplo_lower_names = list(bplo_name_map.keys())
    
    all_profiles = BusinessProfile.query.all()
    
    auto_verified = 0
    queued = 0
    
    bplo_sorted_map = {bplo_name: _pre_tokenize_sort(bplo_name) for bplo_name in bplo_lower_names}
    
    total_profiles = len(all_profiles)
    
    for i, profile in enumerate(all_profiles):
        # Emit progress via SocketIO so the frontend doesn't hang
        if i % max(1, total_profiles // 100) == 0 or i == total_profiles - 1:
            socketio.emit("bplo_upload_progress", {
                "current": i + 1,
                "total": total_profiles,
                "percentage": int(((i + 1) / total_profiles) * 100)
            })
            socketio.sleep(0)  # Yield to event loop to push packet immediately
            
        old_status = profile.status
        new_status = "Unverified"
        new_is_verified = False
        match_entries = []
        
        profile_name = (profile.business_name or "").lower()
        if not profile_name:
            pass # remains Unverified
        elif profile_name in bplo_name_map:
            new_status = "Verified"
            new_is_verified = True
            auto_verified += 1
            profile.last_verified_year = datetime.utcnow().year
            match_entries.append(VerificationMatch(business_id=profile.id, bplo_id=bplo_name_map[profile_name].id, confidence_score=1.0))
        else:
            profile_sorted = _pre_tokenize_sort(profile_name)
            matches_above_threshold = []
            
            len_p = len(profile_sorted)
            for bplo_name in bplo_lower_names:
                bplo_sorted = bplo_sorted_map[bplo_name]
                len_b = len(bplo_sorted)
                
                max_len = max(len_p, len_b)
                if max_len > 0:
                    max_possible_score = 1.0 - (abs(len_p - len_b) / max_len)
                    if max_possible_score < config.fuzzy_match_threshold_pending:
                        continue
                        
                # Fast heuristic pruning using C-optimized SequenceMatcher
                fast_heuristic = difflib.SequenceMatcher(None, profile_sorted, bplo_sorted).ratio()
                if fast_heuristic < config.fuzzy_match_threshold_pending - 0.15:
                    continue
                        
                score = _fast_levenshtein_ratio(profile_sorted, bplo_sorted, config.fuzzy_match_threshold_pending)
                if score >= config.fuzzy_match_threshold_pending:
                    matches_above_threshold.append((bplo_name, score))
            
            if matches_above_threshold:
                matches_above_threshold.sort(key=lambda x: x[1], reverse=True)
                best_score = matches_above_threshold[0][1]
                if best_score >= config.fuzzy_match_threshold_verified:
                    new_status = "Verified"
                    new_is_verified = True
                    auto_verified += 1
                    profile.last_verified_year = datetime.utcnow().year
                    best_match = bplo_name_map[matches_above_threshold[0][0]]
                    match_entries.append(VerificationMatch(business_id=profile.id, bplo_id=best_match.id, confidence_score=round(best_score, 2)))
                else:
                    new_status = "Pending Verification"
                    queued += 1
                    for bplo_name, score in matches_above_threshold:
                        best_match = bplo_name_map[bplo_name]
                        match_entries.append(VerificationMatch(business_id=profile.id, bplo_id=best_match.id, confidence_score=round(score, 2)))
                        
        if old_status != new_status:
            history = BusinessStatusHistory(
                business_id=profile.id,
                admin_id="System (BPLO Auto-Sync)",
                previous_status=old_status,
                new_status=new_status
            )
            db.session.add(history)
            
        profile.status = new_status
        profile.is_verified = new_is_verified
        for me in match_entries:
            db.session.add(me)
                
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
        selectinload(VerificationMatch.business).selectinload(BusinessProfile.locations),  # type: ignore
        selectinload(VerificationMatch.bplo)  # type: ignore
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
    match = VerificationMatch.query.options(selectinload(VerificationMatch.business)).filter_by(id=match_id).first()  # type: ignore
    if not match:
        return {"status": "error", "message": "Queue item not found", "code": 404}
        
    profile = match.business
    
    if profile.status != "Verified":
        history = BusinessStatusHistory(
            business_id=profile.id,
            admin_id="Admin (Manual Queue Approval)",
            previous_status=profile.status,
            new_status="Verified"
        )
        db.session.add(history)
        
    profile.is_verified = True
    profile.status = "Verified"
    profile.last_verified_year = datetime.utcnow().year
    
    VerificationMatch.query.filter(VerificationMatch.business_id == profile.id, VerificationMatch.id != match_id).delete()
    db.session.commit()
    return {"status": "success", "message": "Approved and verified", "code": 200}
    
def reject_bplo_match(match_id):
    match = VerificationMatch.query.filter_by(id=match_id).first()
    if not match:
        return {"status": "error", "message": "Queue item not found", "code": 404}
        
    business = match.business
    if business:
        if business.status != "Unverified":
            history = BusinessStatusHistory(
                business_id=business.id,
                admin_id="Admin (Manual Queue Rejection)",
                previous_status=business.status,
                new_status="Unverified"
            )
            db.session.add(history)
            
        business.is_verified = False
        business.status = "Unverified"
        
    db.session.delete(match)
    db.session.commit()
    return {"status": "success", "message": "Rejected match and marked business as Unverified", "code": 200}

def unverify_business(business_id):
    business = BusinessProfile.query.get(business_id)
    if not business:
        return {"status": "error", "message": "Business not found", "code": 404}
        
    match = VerificationMatch.query.filter_by(business_id=business_id).first()
    if match:
        db.session.delete(match)
        
    if business.status != "Unverified":
        history = BusinessStatusHistory(
            business_id=business.id,
            admin_id="Admin (Manual Unverify Override)",
            previous_status=business.status,
            new_status="Unverified"
        )
        db.session.add(history)
        business.status = "Unverified"
        business.is_verified = False
        
    db.session.commit()
    return {"status": "success", "message": "Business manually unverified", "code": 200}
