import json
import csv
import re
import os
import uuid
from datetime import datetime
from acuity.extraction.pipeline import ExtractionPipeline
from acuity.config import AcuityConfig
from webapp.constants import LANDMARKS

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

def main():
    csv_path = 'data/raw/posts.csv'
    json_path = 'data/processed/frontend_businesses_normalized.json'
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Please run the scraper first.")
        return

    # Load existing businesses to append to
    normalized_entries = []
    existing_names = set()
    
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            normalized_entries = json.load(f)
            
    # Pre-populate the existing names set (case-insensitive, stripped)
    for entry in normalized_entries:
        if entry.get("name"):
            existing_names.add(str(entry["name"]).strip().lower())
            
    print(f"Loaded {len(normalized_entries)} existing businesses.")

    # Run the NLP pipeline
    print("Initializing NLP Pipeline...")
    config = AcuityConfig(ner_model_path='crf_model.pkl', ner_backend='crf')
    pipeline = ExtractionPipeline(config=config)

    new_entries_count = 0
    today_str = datetime.now().strftime("%Y-%m-%d")

    print(f"Reading from {csv_path}...")
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            raw_desc = row.get('text', '')
            poster = row.get('poster', '')
            source_url = row.get('source_url', '')
            
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
                
            # If no business name extracted, fallback to the poster name
            b_name = profile.get('business_name')
            if not b_name:
                b_name = poster if poster else f"Unknown Business {uuid.uuid4().hex[:6]}"
                
            # Filter out Facebook UI artifacts scraped as the poster/business name
            if b_name and "Online status indicatorActive" in str(b_name):
                continue
                
            new_cats = to_list(profile.get('categories'))
            category_id = _assign_category(new_cats)
                
            new_locs = to_list(profile.get('locations'))
            address = get_first(new_locs, "Address not extracted")
            
            landmark_id = _assign_landmark(address)
            
            raw_phones = to_list(profile.get('phones'))
            cleaned_phones = []
            for p in raw_phones:
                if p:
                    parts = [x.strip() for x in p.split(',')]
                    for part in parts:
                        if part and part not in cleaned_phones:
                            cleaned_phones.append(part)
            new_phones = cleaned_phones
            contact = get_first(new_phones, "")
            
            new_prices = to_list(profile.get('prices'))
            
            new_hours = to_list(profile.get('hours'))
            operating_hours = " | ".join(new_hours) if new_hours else ""
            
            # Validation: ensure at least two substantive fields are extracted
            filled_fields = 0
            if address and address != "Address not extracted":
                filled_fields += 1
            if contact:
                filled_fields += 1
            if new_cats:
                filled_fields += 1
            if new_prices:
                filled_fields += 1
            if new_hours:
                filled_fields += 1
                
            if filled_fields < 2:
                continue
                
            # Deduplication: check if this exact business name already exists
            final_name = str(b_name).strip()
            name_lower = final_name.lower()
            if name_lower in existing_names:
                continue
                
            existing_names.add(name_lower)
            
            # Construct the schema output
            out_obj = {
                "id": f"api-new-{uuid.uuid4().hex[:8]}",
                "name": str(b_name),
                "address": address,
                "categoryId": category_id,
                "contact": contact,
                "description": cleaned_desc,
                "operatingHours": operating_hours,
                "services": [],
                "facebookUrl": source_url,
                "flagCount": 0,
                "flagReasons": [],
                "isActive": True,
                "isOpen": True,
                "landmarkId": landmark_id,
                "locationType": "Unknown",
                "ownerId": None,
                "communityEngaged": False,
                "verifiedContact": False,
                "status": "Unverified",
                "is_verified": False,
                "isVerified": False,
                "verification_score": 0.0,
                "matched_registry_name": None,
                "stats": {
                    "created": today_str,
                    "impressions": 0,
                    "inquiries": 0
                },
                "categories": new_cats,
                "locations": new_locs,
                "phones": new_phones,
                "prices": new_prices,
                "hours": new_hours
            }
            normalized_entries.append(out_obj)
            new_entries_count += 1

    print(f"Processed {new_entries_count} new posts.")

    # Save the appended list back to JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(normalized_entries, f, indent=2, ensure_ascii=False)

    print(f"Successfully appended to {json_path}. Total businesses now: {len(normalized_entries)}")

if __name__ == "__main__":
    main()
