from datetime import datetime
from .base import db

class EditHistoryLog(db.Model):
    __tablename__ = 'edit_history_logs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    timestamp = db.Column(db.String(50), nullable=False)
    previous_data = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    is_rolled_back = db.Column(db.Boolean, default=False)

class HeldEdit(db.Model):
    __tablename__ = 'held_edits'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    proposed_data = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending')
