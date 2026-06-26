"""
ACUITY — Post-processing & Profile Construction
Merges NER outputs and rule-based fields into a unified business profile,
performs validation, and assigns confidence scores.
"""
from __future__ import annotations


def build_business_profile(
    raw_text: str,
    entities: dict,
    structured_fields: dict,
    metadata: dict | None = None,
    poster_name: str | None = None,
) -> dict | None:
    """Construct a business profile dict from extraction outputs.

    Args:
        raw_text: The original post text.
        entities: Output from NER (business_name, categories, locations).
        structured_fields: Output from rule-based extraction (phones, prices, hours).
        metadata: Optional metadata (source_index, scraped_at, etc.).
        poster_name: Optional poster name to fallback to if business_name is missing.

    Returns:
        A business profile dict, or None if insufficient information was extracted.
    """
    b_names = entities.get("business_name", [])
    business_name = " ".join(b_names) if b_names else None
    if not business_name and poster_name:
        business_name = poster_name

    profile = {
        "business_name": business_name,
        "categories": entities.get("categories", []),
        "locations": entities.get("locations", []),
        "phones": structured_fields.get("phones", []),
        "prices": structured_fields.get("prices", []),
        "hours": structured_fields.get("hours", []),
        "description": raw_text,
        "metadata": metadata or {},
    }

    # Basic validation: require at least some extractable information
    has_info = (
        profile["business_name"]
        or profile["categories"]
        or profile["phones"]
        or profile["prices"]
    )

    return profile if has_info else None
