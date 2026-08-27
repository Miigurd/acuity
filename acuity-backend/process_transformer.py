import json
import csv
import re
from acuity.extraction.pipeline import ExtractionPipeline
from acuity.config import AcuityConfig
import os

from webapp.constants import LANDMARKS

# 1. Read frontend_businesses.json
input_path = 'data/processed/frontend_businesses.json'
with open(input_path, 'r', encoding='utf-8') as f:
    entries = json.load(f)

# 1. Extract descriptions to CSV
csv_path = 'data/processed/descriptions.csv'
csv_data = []
for i, entry in enumerate(entries):
    entry_id = entry.get('id') or entry.get('business_name') or entry.get('name') or f'row_{i}'
    raw_desc = entry.get('description', '')
    csv_data.append([entry_id, raw_desc])

with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['entry_id', 'raw_description'])
    writer.writerows(csv_data)

# 2. Clean text
def clean_description(raw_text):
    if not raw_text:
        return ""
    lines = raw_text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        line = re.sub(r'(?i)\bSee less\b', '', line).strip()
        line = re.sub(r'([.?!,;:-])\1+', r'\1', line)
        if line:
            cleaned_lines.append(line)
            
    final_text = ""
    for line in cleaned_lines:
        if not final_text:
            final_text = line
        else:
            if final_text[-1] in ".!?,:;":
                final_text += " " + line
            else:
                final_text += ". " + line
                
    final_text = re.sub(r'\s+', ' ', final_text).strip()
    return final_text

def to_list(val):
    if val is None:
        return []
    if isinstance(val, list):
        return val
    return [str(val)]

def get_first(lst, default=""):
    if lst:
        return lst[0]
    return default

def _assign_category(categories: list) -> str:
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

def _assign_landmark(address: str):
    if not address or address == "Address not extracted":
        return None
    address_lower = address.lower()
    for landmark_id, data in LANDMARKS.items():
        name_lower = data["name"].lower()
        simplified_name = name_lower.replace("brgy.", "").replace("brgy", "").strip()
        if simplified_name in address_lower:
            return landmark_id
    return None

# 3. Run the NLP pipeline
config = AcuityConfig(ner_model_path='best-model', ner_backend='transformer')
pipeline = ExtractionPipeline(config=config)

normalized_entries = []

for i, entry in enumerate(entries):
    raw_desc = entry.get('description', '')
    cleaned_desc = clean_description(raw_desc)
    
    # Run pipeline
    profile = pipeline.extract_single(cleaned_desc, metadata={"source_index": i})
    if not profile:
        profile = {
            "business_name": None,
            "categories": [],
            "locations": [],
            "phones": [],
            "prices": [],
            "hours": [],
        }
        
    # Merge values from entry and profile
    orig_name = entry.get('business_name') or entry.get('name')
    b_name = str(profile.get('business_name') or orig_name or "")
    
    # Categories -> categoryId
    orig_cats = to_list(entry.get('categoryId')) + to_list(entry.get('categories'))
    new_cats = list(set(to_list(profile.get('categories')) + orig_cats))
    # use _assign_category to convert strings to c1..c7
    category_id = _assign_category(new_cats)
        
    # Locations -> address
    orig_locs = to_list(entry.get('locations')) + to_list(entry.get('address'))
    new_locs = list(set(to_list(profile.get('locations')) + orig_locs))
    address = get_first(new_locs, "Address not extracted")
    
    # Landmark mapping from address
    landmark_id = _assign_landmark(address)
    # If not mapped, keep the original if valid
    if not landmark_id and entry.get("landmarkId"):
        landmark_id = entry.get("landmarkId")
    
    # Phones -> contact
    orig_phones = to_list(entry.get('phones')) + to_list(entry.get('contact'))
    new_phones = list(set(to_list(profile.get('phones')) + orig_phones))
    contact = get_first(new_phones, "")
    
    # Prices
    orig_prices = to_list(entry.get('prices'))
    new_prices = list(set(to_list(profile.get('prices')) + orig_prices))
    
    # Hours -> operatingHours
    orig_hours = to_list(entry.get('hours')) + to_list(entry.get('operatingHours'))
    new_hours = list(set(to_list(profile.get('hours')) + orig_hours))
    # Operating hours might be a single string in the schema
    operating_hours = " | ".join(new_hours) if new_hours else ""
    
    # The output schema requested by user:
    out_obj = {
        "id": entry.get("id") or f"api-auto-{i}",
        "name": b_name,
        "address": address,
        "categoryId": category_id,
        "contact": contact,
        "description": cleaned_desc,
        "operatingHours": operating_hours,
        "services": entry.get("services") or [],
        "facebookUrl": entry.get("facebookUrl") or "",
        "flagCount": entry.get("flagCount") or 0,
        "flagReasons": entry.get("flagReasons") or [],
        "isActive": entry.get("isActive") if entry.get("isActive") is not None else True,
        "isOpen": entry.get("isOpen") if entry.get("isOpen") is not None else True,
        "landmarkId": landmark_id,
        "locationType": entry.get("locationType") or "Unknown",
        "ownerId": entry.get("ownerId"),
        "communityEngaged": entry.get("communityEngaged") if entry.get("communityEngaged") is not None else False,
        "verifiedContact": entry.get("verifiedContact") if entry.get("verifiedContact") is not None else False,
        "status": entry.get("status") or "Unverified",
        "is_verified": entry.get("is_verified") if entry.get("is_verified") is not None else False,
        "isVerified": entry.get("isVerified") if entry.get("isVerified") is not None else False,
        "verification_score": entry.get("verification_score") or 0.0,
        "matched_registry_name": entry.get("matched_registry_name"),
        "stats": entry.get("stats") or {
            "created": "2026-07-05",
            "impressions": 0,
            "inquiries": 0
        },
        # ALSO preserve full lists so we don't drop multiple prices, phones, etc.
        "categories": new_cats,
        "locations": new_locs,
        "phones": new_phones,
        "prices": new_prices,
        "hours": new_hours
    }
    normalized_entries.append(out_obj)

out_path = 'data/processed/frontend_businesses_normalized_transformer.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(normalized_entries, f, indent=2, ensure_ascii=False)

print(f"Written to {out_path}")
