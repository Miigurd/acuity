import json
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
from webapp.extensions import socketio
from webapp.models import db, BusinessProfile, EditHistoryLog, HeldEdit, BusinessCategory, BusinessService, BusinessLocation, BusinessPrice, BusinessHour, BusinessPhone, BusinessStat, FlagLog, BusinessStatusHistory

def format_business_name(name: str) -> str:
    if not name: return name
    cleaned = re.sub(r'[#.,!_]', ' ', name)
    cleaned = re.sub(r'([a-z])([A-Z])', r'\1 \2', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    import string
    return string.capwords(cleaned)

def get_base_query():
    return BusinessProfile.query.options(
        selectinload(BusinessProfile.categories),  # type: ignore
        selectinload(BusinessProfile.services),  # type: ignore
        selectinload(BusinessProfile.phones),  # type: ignore
        selectinload(BusinessProfile.hours),  # type: ignore
        selectinload(BusinessProfile.locations),  # type: ignore
        selectinload(BusinessProfile.prices),  # type: ignore
        selectinload(BusinessProfile.stats),  # type: ignore
        selectinload(BusinessProfile.flags),  # type: ignore
        selectinload(BusinessProfile.history_logs),  # type: ignore
        selectinload(BusinessProfile.held_edits),  # type: ignore
        selectinload(BusinessProfile.verification_matches),  # type: ignore
        selectinload(BusinessProfile.status_history)  # type: ignore
    )

def expire_old_permits():
    current_year = datetime.utcnow().year
    expired_profiles = BusinessProfile.query.filter(
        (BusinessProfile.is_verified == True) | (BusinessProfile.status == 'Verified')
    ).filter(
        BusinessProfile.last_verified_year < current_year
    ).all()
    
    count = 0
    for profile in expired_profiles:
        profile.is_verified = False
        profile.status = "Unverified"
        count += 1
        
    if count > 0:
        db.session.commit()
    return count

def get_business_by_id(business_id):
    profile = get_base_query().get(business_id)
    return profile.to_dict() if profile else None

def get_all_businesses():
    expire_old_permits()
    profiles = get_base_query().all()
    return [p.to_dict() for p in profiles]

def get_paginated_businesses(page=1, limit=50):
    expire_old_permits()
    pagination = get_base_query().paginate(page=page, per_page=limit, error_out=False)
    return {
        "data": [p.to_dict() for p in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": pagination.page
    }

def update_businesses(data, ip_address):
    # Pre-flight check for Layer 1 PIN and Hijacking
    for b in data:
        raw_name = b.get("name") or b.get("business_name")
        if not raw_name: continue
        name = format_business_name(raw_name)
        biz_id = b.get("id")
        profile = BusinessProfile.query.get(biz_id) if biz_id else BusinessProfile.query.filter_by(business_name=name).first()
        
        if profile:
            sensitive_changed = False
            if name.lower() != profile.business_name.lower():
                sensitive_changed = True
            if "phones" in b and set(b["phones"]) != set(p.phone for p in profile.phones):
                sensitive_changed = True
            if "categories" in b and set(b["categories"]) != set(c.category for c in profile.categories):
                sensitive_changed = True
            if "services" in b and set(b["services"]) != set(s.service for s in profile.services):
                sensitive_changed = True
            if "categoryId" in b and b["categoryId"] and str(b["categoryId"]) != str(profile.category_id):
                sensitive_changed = True
                
            if sensitive_changed:
                if profile.pin_locked:
                    provided_pin = b.get("pin") or b.get("owner_pin")
                    is_valid = False
                    if provided_pin:
                        from werkzeug.security import check_password_hash
                        try:
                            is_valid = check_password_hash(str(profile.owner_pin), str(provided_pin))
                        except ValueError:
                            # Not a valid hash, fallback to plaintext for existing db records
                            pass
                        
                        if not is_valid:
                            is_valid = str(profile.owner_pin) == str(provided_pin)

                    if not is_valid:
                        return {"status": "error", "message": f"Invalid PIN for {name}. Sensitive edits rejected.", "code": 403}
                else:
                    held_edit = HeldEdit(
                        business_id=profile.id,
                        ip_address=ip_address,
                        proposed_data=json.dumps(b)
                    )
                    db.session.add(held_edit)
                    db.session.commit()
                    socketio.emit("business_updated", {"business_id": profile.id, "event": "held_edit"})
                    return {"status": "held", "message": f"Sensitive edits to unclaimed profile {name} held for admin review.", "code": 202}
    
    time_threshold = (datetime.utcnow() - timedelta(minutes=15)).isoformat()
    twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    
    # Check if the IP is currently serving a 24-hour penalty block
    blocked_count = HeldEdit.query.filter(
        HeldEdit.ip_address == ip_address, 
        HeldEdit.timestamp >= twenty_four_hours_ago,
        HeldEdit.status != 'Approved'
    ).count()
    
    if blocked_count >= 3:
        return {"status": "error", "message": "You have been temporarily blocked from editing for 24 hours due to suspicious activity.", "code": 429}
        
    # Normal 15-minute rate limit check
    history_count = EditHistoryLog.query.filter(
        EditHistoryLog.ip_address == ip_address, 
        EditHistoryLog.timestamp >= time_threshold
    ).count()
    
    if history_count >= 3:
        # Divert to HeldEdit
        for b in data:
            raw_name = b.get("name") or b.get("business_name")
            if not raw_name: continue
            name = format_business_name(raw_name)
            biz_id = b.get("id")
            profile = BusinessProfile.query.get(biz_id) if biz_id else BusinessProfile.query.filter_by(business_name=name).first()
            if profile:
                held_edit = HeldEdit(
                    business_id=profile.id,
                    ip_address=ip_address,
                    proposed_data=json.dumps(b)
                )
                db.session.add(held_edit)
        db.session.commit()
        socketio.emit("business_updated", {"event": "held_edit_batch"})
        return {"status": "held", "message": "Rate limit exceeded. Edits held for administrative review.", "code": 202}

    # Apply changes
    for b in data:
        raw_name = b.get("name") or b.get("business_name")
        if not raw_name:
            continue
            
        name = format_business_name(raw_name)
        biz_id = b.get("id")
        profile = get_base_query().get(biz_id) if biz_id else get_base_query().filter_by(business_name=name).first()
            
        if not profile:
            profile = BusinessProfile(business_name=name)
            db.session.add(profile)
            db.session.flush()
            
        old_dict = profile.to_dict()
            
        profile.business_name = name
        profile.description = b.get("description", profile.description)
        profile.address = b.get("address", profile.address)
        profile.contact_info = b.get("contact_info", profile.contact_info)
        
        if "facebookUrl" in b: profile.facebook_url = b["facebookUrl"]
        if "locationType" in b: profile.location_type = b["locationType"]
        if "verifiedContact" in b: profile.verified_contact = b["verifiedContact"]
        if "communityEngaged" in b: profile.community_engaged = b["communityEngaged"]

        profile.status = b.get("status", profile.status)
        
        previous_flag_status = profile.flag_status
        new_flag_status = b.get("flag_status", profile.flag_status)
        
        if new_flag_status != previous_flag_status:
            history_entry = BusinessStatusHistory(
                business_id=profile.id,
                admin_id="Admin",
                previous_status=previous_flag_status,
                new_status=new_flag_status,
                timestamp=datetime.utcnow().isoformat()
            )
            db.session.add(history_entry)
            
            if new_flag_status == "Archived":
                flags = FlagLog.query.filter_by(business_id=profile.id).all()
                for f in flags:
                    f.is_archived = True
                
        profile.flag_status = new_flag_status
        profile.is_verified = b.get("is_verified") or b.get("isVerified") or profile.is_verified
        profile.is_active = b.get("isActive", profile.is_active)
        profile.category_id = b.get("categoryId", profile.category_id)
        profile.landmark_id = b.get("landmarkId", profile.landmark_id)
        
        def update_relation(model, field_name, items_list, business_id):
            existing = model.query.filter_by(business_id=business_id).all()
            existing_values = [getattr(e, field_name) for e in existing]
            if set(existing_values) == set(items_list) and len(existing_values) == len(items_list):
                return
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
            
        # Check if actual changes were made before creating a history log
        new_dict = profile.to_dict()
        if old_dict != new_dict:
            current_time = datetime.utcnow().isoformat()
            profile.published_at = current_time
            
            # Check if this was an authoritative owner edit
            is_owner_edit = False
            if profile.pin_locked:
                provided_pin = b.get("pin") or b.get("owner_pin")
                if provided_pin and str(provided_pin) == str(profile.owner_pin):
                    is_owner_edit = True
                    
            # Only log crowdsourced edits to the public history
            if not is_owner_edit:
                history_log = EditHistoryLog(
                    business_id=profile.id,
                    timestamp=current_time,
                    previous_data=json.dumps(old_dict),
                    ip_address=ip_address,
                    published_at=current_time
                )
                db.session.add(history_log)
        
    db.session.commit()
    return {"status": "success", "message": "Business profiles successfully updated", "code": 200}

def flag_business(name_to_flag, reason="Community Flag", ip_address=None):
    name_to_flag = format_business_name(name_to_flag)
    profile = BusinessProfile.query.filter_by(business_name=name_to_flag).first()
    if not profile:
        profile = BusinessProfile(
            business_name=name_to_flag,
            status="Under Review"
        )
        db.session.add(profile)
        db.session.flush()
        
    new_flag = FlagLog(business_id=profile.id, reason=reason, ip_address=ip_address)
    db.session.add(new_flag)
    db.session.flush()

    active_flags = [f for f in profile.flags if not f.is_archived]
    if len(active_flags) >= 3 and profile.flag_status not in ["Flagged", "Investigating", "Restricted"]:
        profile.flag_status = "Flagged"
        
    db.session.commit()
    return {"status": "success", "message": "Successfully flagged business"}

def rollback_business(business_id, timestamp):
    profile = BusinessProfile.query.get(business_id)
    if not profile:
        return {"status": "error", "message": "Business not found", "code": 404}
        
    log = EditHistoryLog.query.filter_by(business_id=business_id, timestamp=timestamp).first()
    if not log:
        return {"status": "error", "message": "History log not found", "code": 404}
        
    b = json.loads(log.previous_data)
    
    profile.business_name = b.get("name") or b.get("business_name") or profile.business_name
    profile.description = b.get("description", profile.description)
    profile.address = b.get("address", profile.address)
    profile.contact_info = b.get("contact_info", profile.contact_info)
    
    if "facebookUrl" in b: profile.facebook_url = b["facebookUrl"]
    if "locationType" in b: profile.location_type = b["locationType"]
    if "verifiedContact" in b: profile.verified_contact = b["verifiedContact"]
    if "communityEngaged" in b: profile.community_engaged = b["communityEngaged"]

    profile.status = b.get("status", profile.status)
    profile.is_verified = b.get("is_verified") or b.get("isVerified") or profile.is_verified
    profile.is_active = b.get("isActive", profile.is_active)
    profile.category_id = b.get("categoryId", profile.category_id)
    profile.landmark_id = b.get("landmarkId", profile.landmark_id)
    
    def update_relation(model, field_name, items_list, business_id):
        existing = model.query.filter_by(business_id=business_id).all()
        existing_values = [getattr(e, field_name) for e in existing]
        if set(existing_values) == set(items_list) and len(existing_values) == len(items_list):
            return
        model.query.filter_by(business_id=business_id).delete()
        for item in items_list:
            db.session.add(model(business_id=business_id, **{field_name: item}))

    if "categories" in b: update_relation(BusinessCategory, "category", b["categories"], profile.id)
    if "services" in b: update_relation(BusinessService, "service", b["services"], profile.id)
    if "locations" in b: update_relation(BusinessLocation, "location", b["locations"], profile.id)
    if "prices" in b: update_relation(BusinessPrice, "price_info", b["prices"], profile.id)
    if "hours" in b: update_relation(BusinessHour, "hour_schedule", b["hours"], profile.id)
    if "phones" in b: update_relation(BusinessPhone, "phone", b["phones"], profile.id)
    
    EditHistoryLog.query.filter(EditHistoryLog.business_id == business_id, EditHistoryLog.timestamp >= timestamp).update({"is_rolled_back": True})
    db.session.commit()
    
    return {"status": "success", "message": "Successfully rolled back", "code": 200}
