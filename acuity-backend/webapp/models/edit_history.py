from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from .base import db, Base

if TYPE_CHECKING:
    from .business_profile import BusinessProfile


class EditHistoryLog(Base):
    __tablename__ = 'edit_history_logs'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    timestamp: Mapped[str] = db.mapped_column(db.String(50), nullable=False)
    previous_data: Mapped[str] = db.mapped_column(db.Text, nullable=False)
    ip_address: Mapped[str | None] = db.mapped_column(db.String(45), nullable=True)
    is_rolled_back: Mapped[bool | None] = db.mapped_column(db.Boolean, default=False)
    published_at: Mapped[str | None] = db.mapped_column(db.String(50), nullable=True)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='history_logs')


class HeldEdit(Base):
    __tablename__ = 'held_edits'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    ip_address: Mapped[str] = db.mapped_column(db.String(45), nullable=False)
    timestamp: Mapped[str | None] = db.mapped_column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    proposed_data: Mapped[str] = db.mapped_column(db.Text, nullable=False)
    status: Mapped[str | None] = db.mapped_column(db.String(20), default='Pending')

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='held_edits')