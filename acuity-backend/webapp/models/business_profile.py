import json
from datetime import datetime
from .base import db

class BusinessProfile(db.Model):
    __tablename__ = 'businesses'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_name = db.Column(db.String(255), index=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    is_verified = db.Column(db.Boolean, index=True, default=False)
    status = db.Column(db.String(50), index=True, default='Pending')
    flag_status = db.Column(db.String(50), nullable=True)
    published_at = db.Column(db.String(50), nullable=True)
    last_verified_year = db.Column(db.Integer, nullable=True)
    
    address = db.Column(db.String(255), nullable=True)
    contact_info = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.String(50), nullable=True)
    landmark_id = db.Column(db.String(50), nullable=True)
    
    # Layer 1 Edit Protection
    pin_locked = db.Column(db.Boolean, default=False)
    owner_pin = db.Column(db.String(100), nullable=True)
    
    # 3NF Relationships
    categories = db.relationship('BusinessCategory', backref='business', lazy=True, cascade="all, delete-orphan")
    services = db.relationship('BusinessService', backref='business', lazy=True, cascade="all, delete-orphan")
    phones = db.relationship('BusinessPhone', backref='business', lazy=True, cascade="all, delete-orphan")
    hours = db.relationship('BusinessHour', backref='business', lazy=True, cascade="all, delete-orphan")
    locations = db.relationship('BusinessLocation', backref='business', lazy=True, cascade="all, delete-orphan")
    prices = db.relationship('BusinessPrice', backref='business', lazy=True, cascade="all, delete-orphan")
    stats = db.relationship('BusinessStat', backref='business', uselist=False, lazy=True, cascade="all, delete-orphan")
    flags = db.relationship('FlagLog', backref='business', lazy=True, cascade="all, delete-orphan")
    history_logs = db.relationship('EditHistoryLog', backref='business', lazy=True, cascade="all, delete-orphan")
    held_edits = db.relationship('HeldEdit', backref='business', lazy=True, cascade="all, delete-orphan")
    status_history = db.relationship('BusinessStatusHistory', backref='business', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        stats_dict = {
            "impressions": self.stats.impressions if self.stats else 0,
            "clicks": self.stats.clicks if self.stats else 0,
            "inquiries": self.stats.inquiries if self.stats else 0,
            "created": self.stats.created_at if self.stats else ""
        }
            
        # Fetch lat/lon from constants if landmark exists
        from webapp.constants import LANDMARKS
        landmark_data = LANDMARKS.get(self.landmark_id, {})
        lat = landmark_data.get('lat')
        lon = landmark_data.get('lon')

        bplo_match_info = None
        if self.verification_matches:
            # We can take the first match or highest confidence. Assuming the first one since it's verified.
            match = self.verification_matches[0]
            if match.bplo:
                bplo_match_info = {
                    "bplo_id": match.bplo_id,
                    "name": match.bplo.name,
                    "address": match.bplo.address,
                    "confidence_score": match.confidence_score
                }

        active_flags = [f for f in self.flags if not f.is_archived] if self.flags else []
        return {
            "id": self.id,
            "business_name": self.business_name,
            "name": self.business_name, 
            "status": self.status,
            "published_at": self.published_at,
            "last_verified_year": self.last_verified_year,
            "categoryId": self.category_id,
            "landmarkId": self.landmark_id,
            "latitude": lat,
            "longitude": lon,
            "description": self.description,
            "categories": [c.category for c in self.categories],
            "hours": [h.hour_schedule for h in self.hours],
            "locations": [l.location for l in self.locations],
            "phones": [p.phone for p in self.phones],
            "prices": [p.price_info for p in self.prices],
            "isVerified": self.is_verified,
            "is_verified": self.is_verified,
            "status": self.status,
            "flag_status": self.flag_status,
            "stats": stats_dict,
            "bplo_match": bplo_match_info,
            "pin_locked": self.pin_locked,
            
            # Frontend required
            "services": [s.service for s in self.services],
            "address": self.address if self.address else (self.locations[0].location if self.locations else "Address not extracted"),
            "contact_info": self.contact_info if self.contact_info else (self.phones[0].phone if self.phones else ""),
            "isActive": self.is_active,
            "flagCount": len(active_flags),
            "allFlagCount": len(self.flags) if self.flags else 0,
            "flagReasons": [f.reason for f in active_flags],
            "history": [{"timestamp": h.timestamp, "previous_data": json.loads(h.previous_data)} for h in sorted(self.history_logs, key=lambda x: x.timestamp, reverse=True) if not h.is_rolled_back],
            "status_history": [{"timestamp": h.timestamp, "admin_id": h.admin_id, "previous_status": h.previous_status, "new_status": h.new_status} for h in sorted(self.status_history, key=lambda x: x.timestamp, reverse=True)]
        }

    def to_dict_light(self):
        # A lighter version for list views
        from webapp.constants import LANDMARKS
        landmark_data = LANDMARKS.get(self.landmark_id, {})
        
        active_flags = [f for f in self.flags if not f.is_archived] if self.flags else []
        return {
            "id": self.id,
            "business_name": self.business_name,
            "name": self.business_name, 
            "status": self.status,
            "flag_status": self.flag_status,
            "published_at": self.published_at,
            "categoryId": self.category_id,
            "latitude": landmark_data.get('lat'),
            "longitude": landmark_data.get('lon'),
            "address": self.address,
            "isVerified": self.is_verified,
            "is_verified": self.is_verified,
            "flagCount": len(active_flags),
            "allFlagCount": len(self.flags) if self.flags else 0,
            "flagReasons": [f.reason for f in active_flags],
            "pin_locked": self.pin_locked,
            "categories": [c.category for c in self.categories] if self.categories else []
        }

class BusinessCategory(db.Model):
    __tablename__ = 'business_categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    category = db.Column(db.String(255), nullable=False)

class BusinessService(db.Model):
    __tablename__ = 'business_services'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    service = db.Column(db.String(255), nullable=False)

class BusinessPhone(db.Model):
    __tablename__ = 'business_phones'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    phone = db.Column(db.String(255), nullable=False)

class BusinessHour(db.Model):
    __tablename__ = 'business_hours'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    hour_schedule = db.Column(db.String(255), nullable=False)

class BusinessLocation(db.Model):
    __tablename__ = 'business_locations'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    location = db.Column(db.String(255), nullable=False)

class BusinessPrice(db.Model):
    __tablename__ = 'business_prices'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    price_info = db.Column(db.String(255), nullable=False)

class BusinessStat(db.Model):
    __tablename__ = 'business_stats'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), unique=True, nullable=False)
    impressions = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    inquiries = db.Column(db.Integer, default=0)
    created_at = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat()[:10])

class FlagLog(db.Model):
    __tablename__ = 'flag_logs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    ip_address = db.Column(db.String(45), nullable=True)
    is_archived = db.Column(db.Boolean, default=False)

class BusinessStatusHistory(db.Model):
    __tablename__ = 'business_status_history'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    admin_id = db.Column(db.String(255), nullable=True)
    previous_status = db.Column(db.String(50), nullable=True)
    new_status = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())

class AdminActionLog(db.Model):
    __tablename__ = 'admin_action_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    admin_id = db.Column(db.String(255), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())
