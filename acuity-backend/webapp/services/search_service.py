from sqlalchemy.orm import selectinload
from acuity.recommendation import RecommendationEngine  # type: ignore
from acuity.config import AcuityConfig  # type: ignore
from webapp.models import db, BusinessProfile, BusinessStat
from webapp.services.business_service import expire_old_permits

config = AcuityConfig()

_engine_instance = None
_last_verified_count = -1

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

def select_valid_profiles():
    """Return profile dicts that are eligible for recommendation.

    Mirrors the exact filter the production search applies: verified, active,
    not Restricted, and under the flag threshold. Returns a list of dicts
    in the same order ``RecommendationEngine.set_profiles`` consumes them.
    """
    # Filter to only vectorize verified profiles visible on the user side.
    verified_profiles = get_base_query().filter(
        (BusinessProfile.is_verified == True) | (BusinessProfile.status == 'Verified')
    ).filter(BusinessProfile.is_active == True).all()

    # Exclude businesses that are Restricted or have been flagged past threshold
    valid_profiles = []
    for p in verified_profiles:
        if p.flag_status == 'Restricted':
            continue
        active_flags = [f for f in p.flags if not getattr(f, 'is_archived', False)]
        if len(active_flags) < config.max_flags_threshold:
            valid_profiles.append(p)

    return [p.to_dict() for p in valid_profiles]

def get_engine():
    """Return the shared, cached RecommendationEngine used by production search.

    The engine is rebuilt only when the number of eligible profiles changes,
    so the live expert trace reads the exact same TF-IDF state as ``/api/search``.
    """
    global _engine_instance, _last_verified_count

    profiles_dict = select_valid_profiles()
    if not profiles_dict:
        return None

    if _engine_instance is None or len(profiles_dict) != _last_verified_count:
        _engine_instance = RecommendationEngine()
        _engine_instance.set_profiles(profiles_dict)
        _last_verified_count = len(profiles_dict)

    return _engine_instance

def search_businesses(query, user_lat=None, user_lon=None, simulate=False):
    global _engine_instance, _last_verified_count
    
    expire_old_permits()

    _engine_instance = get_engine()

    if _engine_instance is None:
        return []

    results = _engine_instance.recommend(query=query, user_lat=user_lat, user_lon=user_lon, top_k=50)
    
    res_data = [{
        "name": r.get("name") or r.get("business_name"), 
        "relevance_score": r.get("relevance_score"), 
        "proximity_score": r.get("proximity_score"),
        "distance_km": r.get("distance_km"),
        "final_score": r.get("final_score")
    } for r in results if (r.get("name") or r.get("business_name")) and (not query or r.get("relevance_score", 0) > 0)]
    
    # Ensure results are always ranked by final score, especially when query is empty
    res_data.sort(key=lambda x: x.get("final_score", 0) or 0, reverse=True)
    
    returned_names = [r["name"] for r in res_data]
    if returned_names and query and not simulate:
        # Update impressions stat in DB - eager load stats to avoid N+1
        profiles_to_update = BusinessProfile.query.options(selectinload(BusinessProfile.stats)).filter(BusinessProfile.business_name.in_(returned_names)).all()  # type: ignore
        for p in profiles_to_update:
            if p.stats:
                p.stats.impressions += 1
            else:
                db.session.add(BusinessStat(business_id=p.id, impressions=1))  # type: ignore
        db.session.commit()

    return res_data

def track_interaction_event(event_type, biz_name):
    # If click, update business stats
    if event_type in ["click", "inquiry"] and biz_name:
        profile = BusinessProfile.query.options(selectinload(BusinessProfile.stats)).filter_by(business_name=biz_name).first()  # type: ignore
        if profile:
            if profile.stats:
                if event_type == "click":
                    profile.stats.clicks += 1
                elif event_type == "inquiry":
                    profile.stats.inquiries += 1
            else:
                clicks_val = 1 if event_type == "click" else 0
                inquiries_val = 1 if event_type == "inquiry" else 0
                db.session.add(BusinessStat(business_id=profile.id, clicks=clicks_val, inquiries=inquiries_val))  # type: ignore

    db.session.commit()
    return {"status": "success", "message": "Event tracked"}
