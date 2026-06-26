import json
from datetime import datetime
from webapp.models import db, HeldEdit, BusinessProfile, EditHistoryLog, BusinessCategory, BusinessService, BusinessLocation, BusinessPrice, BusinessHour, BusinessPhone

def get_held_edits():
    edits = HeldEdit.query.filter_by(status='Pending').all()
    queue = []
    for edit in edits:
        profile = BusinessProfile.query.get(edit.business_id)
        if profile:
            queue.append({
                "id": edit.id,
                "business_id": edit.business_id,
                "business_name": profile.business_name,
                "ip_address": edit.ip_address,
                "timestamp": edit.timestamp,
                "proposed_data": json.loads(edit.proposed_data)
            })
    return queue

def approve_held_edit(edit_id):
    edit = HeldEdit.query.get(edit_id)
    if not edit or edit.status != 'Pending':
        return {"status": "error", "message": "Held edit not found or already processed", "code": 404}

    profile = BusinessProfile.query.get(edit.business_id)
    if not profile:
        return {"status": "error", "message": "Business not found", "code": 404}

    # Save current state to history log before applying changes
    old_state = json.dumps(profile.to_dict())
    history_log = EditHistoryLog(
        business_id=profile.id,
        timestamp=datetime.utcnow().isoformat(),
        previous_data=old_state,
        ip_address=edit.ip_address
    )
    db.session.add(history_log)

    # Apply changes
    b = json.loads(edit.proposed_data)
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
        model.query.filter_by(business_id=profile.id).delete()
        for item in items_list:
            db.session.add(model(business_id=profile.id, **{field_name: item}))

    if "categories" in b: update_relation(BusinessCategory, "category", b["categories"])
    if "services" in b: update_relation(BusinessService, "service", b["services"])
    if "locations" in b: update_relation(BusinessLocation, "location", b["locations"])
    if "prices" in b: update_relation(BusinessPrice, "price_info", b["prices"])
    if "hours" in b: update_relation(BusinessHour, "hour_schedule", b["hours"])
    if "phones" in b: update_relation(BusinessPhone, "phone", b["phones"])

    edit.status = 'Approved'
    db.session.commit()
    return {"status": "success", "message": "Edit approved successfully", "code": 200}

def reject_held_edit(edit_id):
    edit = HeldEdit.query.get(edit_id)
    if not edit or edit.status != 'Pending':
        return {"status": "error", "message": "Held edit not found or already processed", "code": 404}

    edit.status = 'Rejected'
    db.session.commit()
    return {"status": "success", "message": "Edit rejected successfully", "code": 200}
