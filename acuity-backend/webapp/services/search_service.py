import sys
import os
from sqlalchemy.orm import selectinload
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from acuity.recommendation.engine import RecommendationEngine  # type: ignore
from webapp.models import db, BusinessProfile, BusinessStat

_engine_instance = None
_last_verified_count = -1

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

def search_businesses(query, user_lat=None, user_lon=None):
    global _engine_instance, _last_verified_count

    # Filter to only vectorize verified profiles visible on the user side.
    verified_profiles = get_base_query().filter(
        (BusinessProfile.is_verified == True) | (BusinessProfile.status == 'Verified')
    ).filter(BusinessProfile.is_active == True).all()

    # Exclude businesses that have been flagged 3 or more times
    valid_profiles = [p for p in verified_profiles if len(p.flags) < 3]

    if not valid_profiles:
        return []

    # Rebuild TF-IDF cache only if the number of valid profiles changes
    if _engine_instance is None or len(valid_profiles) != _last_verified_count:
        profiles_dict = [p.to_dict() for p in valid_profiles]
        _engine_instance = RecommendationEngine()
        _engine_instance.set_profiles(profiles_dict)
        _last_verified_count = len(valid_profiles)
    
    results = _engine_instance.recommend(query=query, user_lat=user_lat, user_lon=user_lon, top_k=50)
    
    res_data = [{
        "name": r.get("name") or r.get("business_name"), 
        "relevance_score": r.get("relevance_score"), 
        "proximity_score": r.get("proximity_score"),
        "distance_km": r.get("distance_km"),
        "final_score": r.get("final_score")
    } for r in results if (r.get("name") or r.get("business_name")) and (not query or r.get("relevance_score", 0) > 0)]
    
    returned_names = [r["name"] for r in res_data]
    if returned_names:
        # Update impressions stat in DB - eager load stats to avoid N+1
        profiles_to_update = BusinessProfile.query.options(selectinload(BusinessProfile.stats)).filter(BusinessProfile.business_name.in_(returned_names)).all()
        for p in profiles_to_update:
            if p.stats:
                p.stats.impressions += 1
            else:
                db.session.add(BusinessStat(business_id=p.id, impressions=1))
        db.session.commit()

    return res_data

def track_interaction_event(event_type, biz_name):
    # If click, update business stats
    if event_type == "click" and biz_name:
        profile = BusinessProfile.query.options(selectinload(BusinessProfile.stats)).filter_by(business_name=biz_name).first()
        if profile:
            if profile.stats:
                profile.stats.clicks += 1
            else:
                db.session.add(BusinessStat(business_id=profile.id, clicks=1))

    db.session.commit()
    return {"status": "success", "message": "Event tracked"}
