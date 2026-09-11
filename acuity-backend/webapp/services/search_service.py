from sqlalchemy.orm import selectinload
from acuity.recommendation import RecommendationEngine  # type: ignore
from acuity.config import AcuityConfig  # type: ignore
from webapp.models import db, BusinessProfile, BusinessStat
from webapp.services.business_service import expire_old_permits
import threading
import time
import logging
from collections import defaultdict
from flask import current_app

config = AcuityConfig()

_impression_buffer = defaultdict(int)
_buffer_lock = threading.Lock()
_flusher_started = False

def _flush_impressions_loop(app):
    while True:
        time.sleep(10)
        
        with _buffer_lock:
            if not _impression_buffer:
                continue
            to_flush = dict(_impression_buffer)
            _impression_buffer.clear()
        
        try:
            with app.app_context():
                business_names = list(to_flush.keys())
                profiles_to_update = BusinessProfile.query.options(
                    selectinload(BusinessProfile.stats)
                ).filter(BusinessProfile.business_name.in_(business_names)).all()
                
                for p in profiles_to_update:
                    count = to_flush.get(p.business_name, 0)
                    if count > 0:
                        if p.stats:
                            p.stats.impressions += count
                        else:
                            db.session.add(BusinessStat(business_id=p.id, impressions=count))
                
                db.session.commit()
                
        except Exception as e:
            logging.error(f"Error flushing impressions to DB: {e}")

_engine_instance = None
_last_verified_count = -1

def select_valid_profiles():
    """Return profile dicts that are eligible for recommendation."""
    from webapp.services.business_service import get_base_query
    
    verified_profiles = get_base_query().filter(
        (BusinessProfile.is_verified == True) | (BusinessProfile.status == 'Verified')
    ).filter(BusinessProfile.is_active == True).all()

    valid_profiles = []
    for p in verified_profiles:
        if p.flag_status == 'Restricted':
            continue
        active_flags = [f for f in p.flags if not getattr(f, 'is_archived', False)]
        if len(active_flags) < config.max_flags_threshold:
            valid_profiles.append(p)

    return [p.to_dict() for p in valid_profiles]

def get_engine():
    global _engine_instance, _last_verified_count

    # Fast SQL count check
    current_count = BusinessProfile.query.filter(
        (BusinessProfile.is_verified == True) | (BusinessProfile.status == 'Verified')
    ).filter(BusinessProfile.is_active == True).count()
    
    # If the count hasn't changed, return the cached engine immediately without fetching profiles
    if _engine_instance is not None and current_count == getattr(get_engine, "_fast_count", -1):
        return _engine_instance
        
    get_engine._fast_count = current_count

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
    
    _engine_instance = get_engine()

    if _engine_instance is None:
        return []

    results = _engine_instance.recommend(query=query, user_lat=user_lat, user_lon=user_lon, top_k=50)
    
    res_data = [{
        "id": r.get("id"),
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
        global _flusher_started
        if not _flusher_started:
            with _buffer_lock:
                if not _flusher_started:
                    app = current_app._get_current_object()
                    t = threading.Thread(target=_flush_impressions_loop, args=(app,), daemon=True)
                    t.start()
                    _flusher_started = True

        with _buffer_lock:
            for name in returned_names:
                _impression_buffer[name] += 1

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
