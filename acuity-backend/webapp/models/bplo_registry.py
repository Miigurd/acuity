from .base import db

class BPLORegistry(db.Model):
    __tablename__ = 'bplo_registry'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=True)

class VerificationMatch(db.Model):
    __tablename__ = 'verification_matches'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    bplo_id = db.Column(db.Integer, db.ForeignKey('bplo_registry.id'), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)

    business = db.relationship('BusinessProfile', backref=db.backref('verification_matches', cascade="all, delete-orphan"))
    bplo = db.relationship('BPLORegistry')
