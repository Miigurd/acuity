"""
ACUITY — Scraper Utilities
Shared helper functions for text cleaning and post validation.
"""


import unicodedata

def clean_post_text(raw_text: str) -> str:
    """Clean raw post text extracted from a Facebook element.

    Applies heuristics to strip UI noise (Like / Comment / Share bars)
    and returns the most likely post body.
    """
    # Normalize mathematical alphanumeric and other styling unicode characters
    # back into standard ASCII text
    text = unicodedata.normalize('NFKC', raw_text).strip()

    # If the grabbed element includes the full card (Like/Comment/Share), try
    # to extract just the body paragraph (longest line heuristic).
    if "Like" in text and "Comment" in text and "Share" in text:
        lines = text.split("\n")
        text = max(lines, key=len)

    return text.strip()


def is_valid_post(text: str, min_length: int = 20) -> bool:
    """Return True if *text* looks like a real community post."""
    if not text:
        return False
    if len(text) < min_length:
        return False
        
    # Ignore posts containing specific words (case-insensitive)
    ignored_phrases = [
        "looking for", "naghahanap", "lf", "hiring",
        "pasalo", "sure buyer", "for sale", "nego", "negotiation",
        "fs", "f.s", "f.s.", "on hand", "onhand", "secondhand", "second hand",
        "no issues", "no issue", "negotiable", "paubos", "forsale"
    ]
    text_lower = text.lower()
    for phrase in ignored_phrases:
        if phrase in text_lower:
            return False
            
    return True
