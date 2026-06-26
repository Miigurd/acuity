import os
import sys

from webapp.app import create_app
from webapp.models import db, BusinessProfile
from webapp.constants import LANDMARKS

def _assign_landmark(address: str) -> str | None:
    if not address or address == "Address not extracted":
        return None
    address_lower = address.lower()
    for landmark_id, data in LANDMARKS.items():
        name_lower = data["name"].lower()
        simplified_name = name_lower.replace("brgy.", "").replace("brgy", "").strip()
        if simplified_name in address_lower:
            return landmark_id
    return None

app = create_app()
with app.app_context():
    businesses = BusinessProfile.query.all()
    count = 0
    for b in businesses:
        if not b.landmark_id:
            assigned = _assign_landmark(b.address)
            if assigned:
                b.landmark_id = assigned
                count += 1
    
    db.session.commit()
    print(f"Successfully backfilled landmark_id for {count} existing business profiles!")
