from __future__ import annotations

import json
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from .base import db, Base

if TYPE_CHECKING:
    from .bplo_registry import VerificationMatch
    from .edit_history import EditHistoryLog, HeldEdit


class BusinessProfile(Base):
    __tablename__ = 'businesses'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_name: Mapped[str] = db.mapped_column(db.String(255), index=True, nullable=False)
    description: Mapped[str | None] = db.mapped_column(db.Text, nullable=True)

    is_verified: Mapped[bool | None] = db.mapped_column(db.Boolean, index=True, default=False)
    status: Mapped[str | None] = db.mapped_column(db.String(50), index=True, default='Pending')
    flag_status: Mapped[str | None] = db.mapped_column(db.String(50), nullable=True)
    published_at: Mapped[str | None] = db.mapped_column(db.String(50), nullable=True)
    last_verified_year: Mapped[int | None] = db.mapped_column(db.Integer, nullable=True)

    address: Mapped[str | None] = db.mapped_column(db.String(255), nullable=True)
    contact_info: Mapped[str | None] = db.mapped_column(db.String(255), nullable=True)
    is_active: Mapped[bool | None] = db.mapped_column(db.Boolean, default=True)
    category_id: Mapped[str | None] = db.mapped_column(db.String(50), nullable=True)
    landmark_id: Mapped[str | None] = db.mapped_column(db.String(50), nullable=True)

    # Layer 1 Edit Protection
    pin_locked: Mapped[bool | None] = db.mapped_column(db.Boolean, default=False)
    owner_pin: Mapped[str | None] = db.mapped_column(db.String(100), nullable=True)

    # 3NF Relationships
    categories: Mapped[list[BusinessCategory]] = relationship('BusinessCategory', back_populates='business', lazy=True, cascade="all, delete-orphan")
    services: Mapped[list[BusinessService]] = relationship('BusinessService', back_populates='business', lazy=True, cascade="all, delete-orphan")
    phones: Mapped[list[BusinessPhone]] = relationship('BusinessPhone', back_populates='business', lazy=True, cascade="all, delete-orphan")
    hours: Mapped[list[BusinessHour]] = relationship('BusinessHour', back_populates='business', lazy=True, cascade="all, delete-orphan")
    locations: Mapped[list[BusinessLocation]] = relationship('BusinessLocation', back_populates='business', lazy=True, cascade="all, delete-orphan")
    prices: Mapped[list[BusinessPrice]] = relationship('BusinessPrice', back_populates='business', lazy=True, cascade="all, delete-orphan")
    stats: Mapped[BusinessStat | None] = relationship('BusinessStat', back_populates='business', uselist=False, lazy=True, cascade="all, delete-orphan")
    flags: Mapped[list[FlagLog]] = relationship('FlagLog', back_populates='business', lazy=True, cascade="all, delete-orphan")
    history_logs: Mapped[list[EditHistoryLog]] = relationship('EditHistoryLog', back_populates='business', lazy=True, cascade="all, delete-orphan")
    held_edits: Mapped[list[HeldEdit]] = relationship('HeldEdit', back_populates='business', lazy=True, cascade="all, delete-orphan")
    status_history: Mapped[list[BusinessStatusHistory]] = relationship('BusinessStatusHistory', back_populates='business', lazy=True, cascade="all, delete-orphan")
    verification_matches: Mapped[list[VerificationMatch]] = relationship('VerificationMatch', back_populates='business', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        stats_dict = {
            "impressions": self.stats.impressions if self.stats else 0,
            "clicks": self.stats.clicks if self.stats else 0,
            "inquiries": self.stats.inquiries if self.stats else 0,
            "created": self.stats.created_at if self.stats else ""
        }

        # Fetch lat/lon from constants if landmark exists
        from webapp.constants import LANDMARKS
        landmark_data = LANDMARKS.get(self.landmark_id or "", {})
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
            "status_history": [{"timestamp": h.timestamp, "admin_id": h.admin_id, "previous_status": h.previous_status, "new_status": h.new_status} for h in sorted(self.status_history, key=lambda x: x.timestamp or "", reverse=True)]
        }

    def to_dict_light(self):
        # A lighter version for list views
        from webapp.constants import LANDMARKS
        landmark_data = LANDMARKS.get(self.landmark_id or "", {})

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


class BusinessCategory(Base):
    __tablename__ = 'business_categories'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    category: Mapped[str] = db.mapped_column(db.String(255), nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='categories')


class BusinessService(Base):
    __tablename__ = 'business_services'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    service: Mapped[str] = db.mapped_column(db.String(255), nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='services')


class BusinessPhone(Base):
    __tablename__ = 'business_phones'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    phone: Mapped[str] = db.mapped_column(db.String(255), nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='phones')


class BusinessHour(Base):
    __tablename__ = 'business_hours'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    hour_schedule: Mapped[str] = db.mapped_column(db.String(255), nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='hours')


class BusinessLocation(Base):
    __tablename__ = 'business_locations'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    location: Mapped[str] = db.mapped_column(db.String(255), nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='locations')


class BusinessPrice(Base):
    __tablename__ = 'business_prices'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    price_info: Mapped[str] = db.mapped_column(db.String(255), nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='prices')


class BusinessStat(Base):
    __tablename__ = 'business_stats'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), unique=True, nullable=False)
    impressions: Mapped[int | None] = db.mapped_column(db.Integer, default=0)
    clicks: Mapped[int | None] = db.mapped_column(db.Integer, default=0)
    inquiries: Mapped[int | None] = db.mapped_column(db.Integer, default=0)
    created_at: Mapped[str | None] = db.mapped_column(db.String(50), default=lambda: datetime.utcnow().isoformat()[:10])

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='stats')


class FlagLog(Base):
    __tablename__ = 'flag_logs'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    reason: Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    timestamp: Mapped[str | None] = db.mapped_column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    ip_address: Mapped[str | None] = db.mapped_column(db.String(45), nullable=True)
    is_archived: Mapped[bool | None] = db.mapped_column(db.Boolean, default=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='flags')


class BusinessStatusHistory(Base):
    __tablename__ = 'business_status_history'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    admin_id: Mapped[str | None] = db.mapped_column(db.String(255), nullable=True)
    previous_status: Mapped[str | None] = db.mapped_column(db.String(50), nullable=True)
    new_status: Mapped[str] = db.mapped_column(db.String(50), nullable=False)
    timestamp: Mapped[str | None] = db.mapped_column(db.String(50), default=lambda: datetime.utcnow().isoformat())

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='status_history')


class AdminActionLog(Base):
    __tablename__ = 'admin_action_logs'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    action_type: Mapped[str] = db.mapped_column(db.String(50), nullable=False)
    target_id: Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    timestamp: Mapped[str | None] = db.mapped_column(db.String(50), default=lambda: datetime.utcnow().isoformat())