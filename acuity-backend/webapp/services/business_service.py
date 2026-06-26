import json
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
from webapp.models import db, BusinessProfile, EditHistoryLog, HeldEdit, BusinessCategory, BusinessService, BusinessLocation, BusinessPrice, BusinessHour, BusinessPhone, BusinessStat, FlagLog

def get_base_query():
    return BusinessProfile.query.options(
        selectinload(BusinessProfile.categories),
        selectinload(BusinessProfile.services),
        selectinload(BusinessProfile.phones),
        selectinload(BusinessProfile.hours),
        selectinload(BusinessProfile.locations),
        selectinload(BusinessProfile.prices),
        selectinload(BusinessProfile.stats),
        selectinload(BusinessProfile.flags),
        selectinload(BusinessProfile.history_logs),
        selectinload(BusinessProfile.held_edits)
    )

def get_business_by_id(business_id):
    profile = get_base_query().get(business_id)
    return profile.to_dict() if profile else None

def get_all_businesses():
    profiles = get_base_query().all()
    return [p.to_dict() for p in profiles]

def update_businesses(data, ip_address):
    time_threshold = (datetime.utcnow() - timedelta(minutes=15)).isoformat()
    twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    
    # Check if the IP is currently serving a 24-hour penalty block
    blocked_count = HeldEdit.query.filter(
        HeldEdit.ip_address == ip_address, 
        HeldEdit.timestamp >= twenty_four_hours_ago,
        HeldEdit.status != 'Approved'
    ).count()
    
    if blocked_count > 0:
        return {"status": "error", "message": "You have been temporarily blocked from editing for 24 hours due to suspicious activity.", "code": 429}
        
    # Normal 15-minute rate limit check
    history_count = EditHistoryLog.query.filter(
        EditHistoryLog.ip_address == ip_address, 
        EditHistoryLog.timestamp >= time_threshold
    ).count()
    
    if history_count >= 3:
        # Divert to HeldEdit
        for b in data:
            name = b.get("name") or b.get("business_name")
            if not name: continue
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
        return {"status": "held", "message": "Rate limit exceeded. Edits held for administrative review.", "code": 202}

    # Apply changes
    for b in data:
        name = b.get("name") or b.get("business_name")
        if not name:
            continue
            
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
        profile.status = b.get("status", profile.status)
        profile.is_verified = b.get("is_verified") or b.get("isVerified") or profile.is_verified
        profile.is_active = b.get("isActive", profile.is_active)
        profile.category_id = b.get("categoryId", profile.category_id)
        profile.landmark_id = b.get("landmarkId", profile.landmark_id)
        
        def update_relation(model, field_name, items_list):
            existing = model.query.filter_by(business_id=profile.id).all()
            existing_values = [getattr(e, field_name) for e in existing]
            if set(existing_values) == set(items_list) and len(existing_values) == len(items_list):
                return
            model.query.filter_by(business_id=profile.id).delete()
            for item in items_list:
                db.session.add(model(business_id=profile.id, **{field_name: item}))

        if "categories" in b: update_relation(BusinessCategory, "category", b["categories"])
        if "services" in b: update_relation(BusinessService, "service", b["services"])
        if "locations" in b: update_relation(BusinessLocation, "location", b["locations"])
        if "prices" in b: update_relation(BusinessPrice, "price_info", b["prices"])
        if "hours" in b: update_relation(BusinessHour, "hour_schedule", b["hours"])
        if "phones" in b: update_relation(BusinessPhone, "phone", b["phones"])
        
        if "flagCount" in b and b["flagCount"] == 0:
            FlagLog.query.filter_by(business_id=profile.id).delete()
            
        if "stats" in b:
            stats_obj = b["stats"]
            if not profile.stats:
                stat = BusinessStat(business_id=profile.id)
                db.session.add(stat)
                profile.stats = stat
            
            profile.stats.impressions = stats_obj.get("impressions", profile.stats.impressions or 0)
            profile.stats.clicks = stats_obj.get("clicks", profile.stats.clicks or 0)
            profile.stats.inquiries = stats_obj.get("inquiries", profile.stats.inquiries or 0)
            
        # Check if actual changes were made before creating a history log
        new_dict = profile.to_dict()
        if old_dict != new_dict:
            history_log = EditHistoryLog(
                business_id=profile.id,
                timestamp=datetime.utcnow().isoformat(),
                previous_data=json.dumps(old_dict),
                ip_address=ip_address
            )
            db.session.add(history_log)
        
    db.session.commit()
    return {"status": "success", "message": "Business profiles successfully updated", "code": 200}

def flag_business(name_to_flag, reason="Community Flag"):
    profile = BusinessProfile.query.filter_by(business_name=name_to_flag).first()
    if not profile:
        profile = BusinessProfile(
            business_name=name_to_flag,
            status="Under Review"
        )
        db.session.add(profile)
        db.session.flush()
        
    new_flag = FlagLog(business_id=profile.id, reason=reason)
    db.session.add(new_flag)
        
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
    profile.status = b.get("status", profile.status)
    profile.is_verified = b.get("is_verified") or b.get("isVerified") or profile.is_verified
    profile.is_active = b.get("isActive", profile.is_active)
    profile.category_id = b.get("categoryId", profile.category_id)
    profile.landmark_id = b.get("landmarkId", profile.landmark_id)
    
    def update_relation(model, field_name, items_list):
        existing = model.query.filter_by(business_id=profile.id).all()
        existing_values = [getattr(e, field_name) for e in existing]
        if set(existing_values) == set(items_list) and len(existing_values) == len(items_list):
            return
        model.query.filter_by(business_id=profile.id).delete()
        for item in items_list:
            db.session.add(model(business_id=profile.id, **{field_name: item}))

    if "categories" in b: update_relation(BusinessCategory, "category", b["categories"])
    if "services" in b: update_relation(BusinessService, "service", b["services"])
    if "locations" in b: update_relation(BusinessLocation, "location", b["locations"])
    if "prices" in b: update_relation(BusinessPrice, "price_info", b["prices"])
    if "hours" in b: update_relation(BusinessHour, "hour_schedule", b["hours"])
    if "phones" in b: update_relation(BusinessPhone, "phone", b["phones"])
    
    EditHistoryLog.query.filter(EditHistoryLog.business_id == business_id, EditHistoryLog.timestamp >= timestamp).update({"is_rolled_back": True})
    db.session.commit()
    
    return {"status": "success", "message": "Successfully rolled back", "code": 200}
