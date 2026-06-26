"""
ACUITY — Extraction Pipeline Orchestrator
Coordinates the full extraction flow:
    Raw post text → preprocessing → NER → rule-based extraction → profile construction

Usage:
    python -m extraction.pipeline
"""
from __future__ import annotations

import csv
import json
import os
import re
from datetime import date

from .preprocessing import preprocess  # type: ignore
from .ner import extract_entities  # type: ignore
from .rules import extract_structured_fields  # type: ignore
from .postprocessing import build_business_profile  # type: ignore
from ..config import AcuityConfig, default_config


def _append_to_json_file(filepath: str, new_items: list) -> int:
    """Load an existing JSON array from *filepath*, append *new_items*, and save.

    Returns the total number of items after appending.
    """
    existing = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except json.JSONDecodeError:
            pass

    existing.extend(new_items)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    return len(existing)


def _get_next_frontend_id(frontend_path: str) -> int:
    """Return the next available numeric suffix for ``api-b{N}`` IDs."""
    if not os.path.exists(frontend_path):
        return 0

    try:
        with open(frontend_path, "r", encoding="utf-8") as f:
            entries = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return 0

    max_num = -1
    for entry in entries:
        entry_id = entry.get("id", "")
        match = re.match(r"api-b(\d+)", str(entry_id))
        if match:
            max_num = max(max_num, int(match.group(1)))

    return max_num + 1


def _assign_landmark(address: str) -> str | None:
    """Automatically assign a landmark_id by matching the address to known barangays."""
    if not address or address == "Address not extracted":
        return None
        
    try:
        from webapp.constants import LANDMARKS
        address_lower = address.lower()
        for landmark_id, data in LANDMARKS.items():
            name_lower = data["name"].lower()
            # Handle variations like "Mamatid" instead of "Brgy. Mamatid"
            simplified_name = name_lower.replace("brgy.", "").replace("brgy", "").strip()
            if simplified_name in address_lower:
                return landmark_id
    except ImportError:
        pass
        
    return None


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


def _convert_to_frontend_format(profiles: list, start_id: int) -> list:
    """Convert pipeline profiles to the frontend schema.

    Mapping rules:
        business_name  → name
        locations      → address  (joined, or "Address not extracted")
        phones         → contact  (joined)
        categories     → services (list)
        hours[0]       → operatingHours (or "Not available")
        description    → description
    Plus sensible defaults for all other frontend fields.
    """
    converted = []
    today_str = date.today().isoformat()

    for i, profile in enumerate(profiles):
        locations = profile.get("locations", [])
        phones = profile.get("phones", [])
        hours = profile.get("hours", [])
        categories = profile.get("categories", [])

        converted.append({
            "id": f"api-b{start_id + i}",
            "name": profile.get("business_name", "Unknown"),
            "address": ", ".join(locations) if locations else "Address not extracted",
            "categoryId": _assign_category(categories),
            "contact": ", ".join(phones) if phones else "",
            "description": profile.get("description", ""),
            "operatingHours": hours[0] if hours else "Not available",
            "services": categories,
            "facebookUrl": "",
            "flagCount": 0,
            "flagReasons": [],
            "isActive": True,
            "isOpen": True,
            "landmarkId": _assign_landmark(", ".join(locations)) if locations else None,
            "locationType": "Unknown",
            "ownerId": None,
            "communityEngaged": False,
            "verifiedContact": False,
            "stats": {
                "created": today_str,
                "impressions": 0,
                "inquiries": 0,
            },
        })

    return converted


def run_pipeline(config: AcuityConfig | None = None):
    """Execute the full extraction pipeline.

    Args:
        config: AcuityConfig instance with file paths and settings.
    """
    config = config or default_config
    input_path = config.raw_data_path
    output_path = config.output_path
    frontend_path = config.frontend_data_path

    print(f"Loading raw posts from {input_path}...")

    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        posts = list(reader)

    print(f"Loaded {len(posts)} posts. Running extraction pipeline...")

    profiles = []
    for i, post in enumerate(posts):
        raw_text = post.get("text", "")

        # Step 1: Preprocess (clean, normalise)
        cleaned = preprocess(raw_text)

        # Step 2: Named Entity Recognition
        entities = extract_entities(cleaned)

        # Step 3: Rule-based extraction (contacts, hours, address patterns)
        structured = extract_structured_fields(cleaned)

        # Step 4: Build business profile
        profile = build_business_profile(
            raw_text=raw_text,
            entities=entities,
            structured_fields=structured,
            metadata={"source_index": i, "scraped_at": post.get("scraped_at")},
            poster_name=post.get("poster"),
        )

        if profile:
            # We want to filter out weak profiles. Count how many meaningful fields are populated.
            # (Ignoring description/business_name which are often just the raw text chunk)
            detail_lists = [
                profile.get("categories", []),
                profile.get("locations", []),
                profile.get("phones", []),
                profile.get("prices", []),
                profile.get("hours", [])
            ]
            
            populated_fields_count = sum(1 for field in detail_lists if len(field) > 0)
            
            if populated_fields_count >= 2:
                profiles.append(profile)

    # Save to the main processed file
    total_processed = _append_to_json_file(output_path, profiles)
    print(f"Appended {len(profiles)} business profiles -> {output_path} (Total: {total_processed})")

    # Auto-sync to the frontend file (convert to frontend format first)
    next_id = _get_next_frontend_id(frontend_path)
    frontend_profiles = _convert_to_frontend_format(profiles, next_id)
    
    # Run BPLO Verification before saving
    from ..verification.bplo import BPLOVerifier
    verifier = BPLOVerifier(config)
    verifier.load_registry_from_csv()
    frontend_profiles = verifier.verify_batch(frontend_profiles)
    
    total_frontend = _append_to_json_file(frontend_path, frontend_profiles)
    print(f"Synced {len(frontend_profiles)} new verified profiles -> {frontend_path} (Total: {total_frontend})")
    
    return frontend_profiles




if __name__ == "__main__":
    run_pipeline()

