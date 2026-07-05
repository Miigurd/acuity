import json
import re
import os

def format_business_name(name: str) -> str:
    if not name: return name
    cleaned = re.sub(r'[#.,!_]', ' ', name)
    cleaned = re.sub(r'([a-z])([A-Z])', r'\1 \2', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned.title()

def cleanse_json_file(filepath):
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} businesses from {filepath}")

    unique_businesses = {}
    
    for b in data:
        raw_name = b.get("name") or b.get("business_name")
        if not raw_name:
            continue
            
        formatted_name = format_business_name(raw_name)
        
        # Keep the formatted name in the object
        if "business_name" in b:
            b["business_name"] = formatted_name
        if "name" in b:
            b["name"] = formatted_name
            
        # Deduplicate: if it exists, maybe merge or just ignore. 
        # For this script, we'll keep the first one we find.
        if formatted_name not in unique_businesses:
            unique_businesses[formatted_name] = b
        else:
            # We could merge categories/locations, but for now we just drop the duplicate
            pass

    cleansed_data = list(unique_businesses.values())
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(cleansed_data, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(cleansed_data)} cleansed businesses to {filepath}")

if __name__ == "__main__":
    frontend_path = "c:/Users/Kirt Asia/.gemini/antigravity/scratch/acuity/acuity-backend/data/processed/frontend_businesses.json"
    backend_path = "c:/Users/Kirt Asia/.gemini/antigravity/scratch/acuity/acuity-backend/data/processed/business_profiles.json"
    
    cleanse_json_file(frontend_path)
    cleanse_json_file(backend_path)
    print("Done!")
