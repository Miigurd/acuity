import sys
import os
# Add the project root to sys.path so we can import modules like webapp
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import json
import re
import os

HOURS_PATTERN = re.compile(
    r"\b\d{1,2}(?::\d{2})?(?:\s?[ap]\.?m\.?)?\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s?[ap]\.?m\.?\b",
    re.IGNORECASE
)

def fix_data(input_path, output_path):
    print(f"Reading from {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        entries = json.load(f)

    for entry in entries:
        # 1. Fix operating hours
        description = entry.get('description', '')
        hours_matches = HOURS_PATTERN.findall(description)
        
        if hours_matches:
            # Deduplicate while preserving order
            unique_hours = list(dict.fromkeys(hours_matches))
            entry['operatingHours'] = " | ".join(unique_hours)
            entry['hours'] = unique_hours
        else:
            entry['operatingHours'] = ""
            entry['hours'] = []

        # 2. Fix duplicate phones (split by comma and deduplicate)
        raw_phones = entry.get('phones', [])
        cleaned_phones = []
        for p in raw_phones:
            if p:
                parts = [x.strip() for x in p.split(',')]
                for part in parts:
                    if part and part not in cleaned_phones:
                        cleaned_phones.append(part)
        
        entry['phones'] = cleaned_phones
        
        # Update the main contact field to use the first phone if available
        if cleaned_phones:
            entry['contact'] = cleaned_phones[0]
        else:
            entry['contact'] = ""

    print(f"Writing to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(entries)} entries.")

if __name__ == "__main__":
    input_file = 'data/processed/frontend_businesses_normalized.json'
    output_file = 'data/processed/frontend_businesses_fixed.json'
    
    if os.path.exists(input_file):
        fix_data(input_file, output_file)
    else:
        print(f"Error: Could not find {input_file}. Please run this script from the acuity-backend directory.")
