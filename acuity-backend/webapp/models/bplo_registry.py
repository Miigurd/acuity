from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from .base import db, Base

if TYPE_CHECKING:
    from .business_profile import BusinessProfile


class BPLORegistry(Base):
    __tablename__ = 'bplo_registry'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    address: Mapped[str | None] = db.mapped_column(db.String(255), nullable=True)


class VerificationMatch(Base):
    __tablename__ = 'verification_matches'

    id: Mapped[int] = db.mapped_column(db.Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    bplo_id: Mapped[int] = db.mapped_column(db.Integer, db.ForeignKey('bplo_registry.id'), nullable=False)
    confidence_score: Mapped[float] = db.mapped_column(db.Float, nullable=False)

    business: Mapped[BusinessProfile] = relationship('BusinessProfile', back_populates='verification_matches')
    bplo: Mapped[BPLORegistry] = relationship('BPLORegistry')