import os
from webapp.app import create_app
from webapp.models import db, BusinessProfile

def _assign_category(categories: list) -> str:
    """Map extracted category strings to predefined frontend category IDs."""
    if not categories:
        return "c7"
    
    cat_str = " ".join(categories).lower()
    
    if any(k in cat_str for k in ["food", "beverage", "restaurant", "cafe", "bakery", "snack", "burger", "milk tea", "pizza", "dining"]):
        return "c1"
    if any(k in cat_str for k in ["sari-sari", "convenience", "grocery", "store", "mart", "market", "shop"]):
        return "c2"
    if any(k in cat_str for k in ["clothing", "rtw", "apparel", "boutique", "fashion", "garment", "shoes", "wear"]):
        return "c3"
    if any(k in cat_str for k in ["repair", "mechanic", "vulcanizing", "auto", "motor", "computer", "electronic", "fix", "shop"]):
        return "c4"
    if any(k in cat_str for k in ["salon", "spa", "barber", "hair", "nail", "beauty", "massage", "wellness", "care"]):
        return "c5"
    if any(k in cat_str for k in ["laundry", "wash", "dry clean", "ironing"]):
        return "c6"
    
    return "c7"

def fix_categories():
    app = create_app()
    with app.app_context():
        businesses = BusinessProfile.query.all()
        updated_count = 0
        
        for b in businesses:
            cats = [c.category for c in b.categories]
            new_cat_id = _assign_category(cats)
            
            if b.category_id != new_cat_id:
                b.category_id = new_cat_id
                updated_count += 1
                
        db.session.commit()
        print(f"Categories fixed. Updated {updated_count} business profiles.")

if __name__ == "__main__":
    fix_categories()
