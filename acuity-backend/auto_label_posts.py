"""
ACUITY — Distant Supervision Auto-Labeler for posts.csv

Converts raw Facebook community posts into CRF training data by auto-annotating
tokens with the three entity types the model learns:

    LOCATION          (barangays, towns, landmarks, address markers)
    SERVICE_CATEGORY  (service/product keywords)
    BUSINESS_NAME     (known brand names + "X Shop/Store/House..." patterns)

Output format (Label Studio-compatible tokens/ner_tags):

    [
      {
        "index": 0,
        "text": "...raw post...",
        "tokens": ["...", "..."],
        "ner_tags": ["O", "B-BUSINESS_NAME", ...]
      },
      ...
    ]

Posts that receive no labels are dropped so the CRF does not over-learn "O".

Usage:
    python auto_label_posts.py                      # reads ../posts.csv
    python auto_label_posts.py --input posts.csv --output data/annotated/posts_csv_auto.json
"""
from __future__ import annotations

import argparse
import json
import re

from acuity.extraction.preprocessing import preprocess

# ---------------------------------------------------------------------------
# Entity phrase dictionaries
# ---------------------------------------------------------------------------

LOCATION_PHRASES = [
    # Barangays of Cabuyao
    "brgy baclaran", "baclaran", "brgy banay banay", "banay banay", "banay-banay",
    "banlic", "bigaa", "butong", "casile", "diezmo", "gulod", "mamatid",
    "marinig", "niugan", "pittland", "poblacion uno", "poblacion dos",
    "poblacion tres", "brgy pulo", "pulo cabuyao", "sala", "san isidro",
    # Nearby towns / cities
    "calamba", "sta rosa", "santa rosa", "san pedro", "binan", "biñan",
    "laguna", "manila", "los banos", "los baños",
    # Landmarks & neighbourhoods
    "celestine homes", "celestine marinig", "windfield", "mabuhay city",
    "buena rosario", "buena rosa", "grand acasia", "grand acacia",
    "st joseph", "mahogany", "puregold", "immaculate conception",
    "phoenix gasoline", "san cristobal bridge", "checkpoint parian",
    "calamba doctors hospital", "national highway", "manila south road",
    "jp rizal street", "wheeltek bldg", "wheeltek building",
    "acasia grove", "celestine gate", "pamantasan",
]

ADDRESS_MARKERS = ["brgy", "purok", "blk", "phase", "subd", "street", "st", "rd", "lot", "km"]

SERVICE_PHRASES = [
    "laundry", "labada", "massage", "hilot", "spa", "ventosa", "nails", "softgel",
    "salon", "haircut", "hair color", "rebond", "makeup", "eyelash",
    "bakery", "pandesal", "cake", "cupcakes", "lomi", "siomai", "pizza", "samgyup",
    "wings", "grill", "cafe", "coffee", "milktea", "shawarma", "takoyaki", "kimchi",
    "frozen products", "frozen", "siopao", "burger patties", "noodles",
    "restaurant", "eatery", "bilao", "catering", "delivery",
    "cellphone repair", "phone repair", "lcd", "battery", "reformat", "bypass",
    "repair", "vulcanizing", "ebike", "e bike", "motor", "motorcycle", "scooter",
    "lpg", "gasul", "regulator", "gas", "gasoline",
    "fiber internet", "internet", "wifi", "cable", "installation",
    "insurance", "registration", "emission testing", "ltms",
    "rental", "tents", "tables", "chairs", "ball gowns",
    "shoes", "clothes", "garments", "ukay", "tshirt", "sweatshirt", "sleepwear",
    "keychain", "watch", "paperbag", "bag",
    "aquarium", "aquatic", "fish", "aquatic plants",
    "printer", "printing", "xerox", "scan", "encode", "laminating",
    "upvc", "aluminum", "glass", "sliding window", "sliding door", "screen door",
    "canopy", "tempered glass", "korean blinds", "roll up", "steel works", "mirrors",
    "kitchen cabinet", "closet", "fabricator",
    "water refilling", "bigas", "rice",
    "jewelry", "alahas", "scrap gold", "aircon", "refrigerator",
    "massage therapy", "deep tissue", "sciatica", "frozen shoulder", "chiropractor",
    "home service", "sari sari",
]

BUSINESS_PHRASES = [
    "ace laundry shop", "ace laundry", "kenboy's grill", "kenboys grill",
    "kenboysgrill", "velvera cafe and grill", "velvera cafe", "velvera",
    "r&m rental services", "r&m rentals", "el rickys pizza house",
    "el ricky's pizza house", "boss toph's shawarma x takoyaki",
    "madam's bilao bundle", "em em aquatic", "damflyn products",
    "pasinaya homes", "pasinaya heights", "idesia cabuyao east",
    "wheeltek", "jcb mamatid", "jcb", "moll japan surplus",
    "yasser cell phone accessories", "mi senoritas", "che salon",
    "cptl insurance", "royal cable", "converge", "pldt home",
    "town gas", "regasco", "super kalan", "shine gas", "petron gasul",
    "goojodoq", "consumo cabuyao", "sabrina's clothes", "ace laundry shop",
    "boss toph's shawarma", "velvera cafe & grill",
]

BUSINESS_SUFFIXES = [
    "shop", "store", "house", "cafe", "grill", "laundry", "rental", "rentals",
    "homes", "bldg", "services", "bakery", "restaurant", "eatery", "aquatic",
    "salon", "surplus", "studio", "branch", "trading", "supply", "products",
    "center", "therap", "pizza", "extension", "equipment",
]


def _norm(phrase: str) -> list[str]:
    return re.findall(r"\b[a-z0-9'&.]+\b", phrase.lower())


class AutoLabeler:
    """Annotates tokens of a preprocessed post with BIO tags."""

    LABELS = ("SERVICE_CATEGORY", "LOCATION", "BUSINESS_NAME")

    def __init__(self):
        self.phrases = {
            label: sorted(
                {tuple(_norm(p)) for p in phrases if _norm(p)},
                key=len,
                reverse=True,
            )
            for label, phrases in (
                ("LOCATION", LOCATION_PHRASES),
                ("SERVICE_CATEGORY", SERVICE_PHRASES),
                ("BUSINESS_NAME", BUSINESS_PHRASES),
            )
        }

    def annotate(self, text: str) -> list[str]:
        tokens = text.split()
        tags = ["O"] * len(tokens)
        if not tokens:
            return tags

        lowered = [t.lower() for t in tokens]

        def mark(start: int, end: int, label: str) -> None:
            if start < 0 or end > len(tokens):
                return
            tags[start] = f"B-{label}"
            for i in range(start + 1, end):
                tags[i] = f"I-{label}"

        # Phrase scanning, applied in order so BUSINESS_NAME wins on overlap.
        for label in self.LABELS:
            for phrase in self.phrases[label]:
                n = len(phrase)
                for i in range(len(lowered) - n + 1):
                    if tuple(lowered[i:i + n]) == phrase:
                        mark(i, i + n, label)

        # Pattern-based business names: "Ace Laundry Shop", "El Rickys Pizza House" etc.
        # Requires the name run to be Capitalised (proper noun) so "our cafe shop"
        # and "laundry services" are NOT mistaken for business names.
        for i in range(len(tokens) - 1):
            suffix_idx = i + 1
            if lowered[suffix_idx] not in BUSINESS_SUFFIXES or tags[suffix_idx] != "O":
                continue
            # Only trigger if the word right before the suffix is a proper noun.
            if not tokens[i][:1].isupper():
                continue
            start = i
            while start > 0 and tokens[start - 1][:1].isupper() and (suffix_idx - start) < 4:
                start -= 1
            mark(start, suffix_idx + 1, "BUSINESS_NAME")

        # Single-token address markers ("brgy", "purok", "blk") get a LOCATION
        # tag together with the next word only ("Brgy Pulo", "Purok 1").
        for i, tok in enumerate(lowered):
            if tok in ADDRESS_MARKERS and tags[i] == "O":
                mark(i, min(len(tokens), i + 2), "LOCATION")

        return tags


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default="../posts.csv", help="Path to posts.csv")
    parser.add_argument("--output", default="data/annotated/posts_csv_auto.json", help="Output JSON path")
    args = parser.parse_args()

    import pandas as pd

    df = pd.read_csv(args.input)
    labeler = AutoLabeler()

    records = []
    dropped = 0
    for idx, row in df.iterrows():
        text = str(row["text"])
        if not text.strip():
            continue
        cleaned = preprocess(text)
        tags = labeler.annotate(cleaned)
        if set(tags) == {"O"}:
            dropped += 1
            continue
        records.append({
            "index": idx,
            "text": text,
            "source_url": str(row.get("source_url", "")),
            "tokens": cleaned.split(),
            "ner_tags": tags,
        })

    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2)

    tag_counts = {}
    for r in records:
        for t in r["ner_tags"]:
            tag_counts[t] = tag_counts.get(t, 0) + 1

    print(f"Posts read: {len(df)}")
    print(f"Auto-labeled records written: {len(records)} (dropped {dropped} with no labels)")
    print("Tag distribution:")
    for tag in sorted(tag_counts, key=lambda k: -tag_counts[k]):
        print(f"  {tag}: {tag_counts[tag]}")
    print(f"Saved to {args.output}")


if __name__ == "__main__":
    main()
