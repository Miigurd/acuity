"""
ACUITY Framework - BPLO Registry Verification
"""
import csv
import difflib
from typing import List, Dict, Optional, Any
from ..config import AcuityConfig, default_config

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]

def token_sort_ratio(s1: str, s2: str) -> float:
    """Calculate the token-sort ratio using Levenshtein distance."""
    import string
    
    # Strip punctuation and tokenize
    trans = str.maketrans('', '', string.punctuation)
    s1_clean = s1.translate(trans).strip()
    s2_clean = s2.translate(trans).strip()
    
    t1 = " ".join(sorted(s1_clean.split()))
    t2 = " ".join(sorted(s2_clean.split()))
    
    total_len = len(t1) + len(t2)
    if total_len == 0:
        return 1.0
        
    dist = levenshtein_distance(t1, t2)
    return (total_len - dist) / total_len


class BPLOVerifier:
    def __init__(self, config: Optional[AcuityConfig] = None):
        self.config = config or default_config
        self.registry: List[Dict[str, str]] = []

    def load_registry_from_csv(self, path: Optional[str] = None):
        """Loads BPLO registry from a CSV file."""
        csv_path = path or self.config.bplo_registry_path
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                # Basic assumption: there's a header and we want the rows as dicts
                # Adjust depending on actual CSV structure
                reader = csv.DictReader(f)
                self.registry = list(reader)
        except Exception as e:
            print(f"Warning: Could not load BPLO registry from {csv_path}: {e}")

    def load_registry_from_list(self, entries: List[Dict[str, str]]):
        """Allows passing a list of registry dictionaries directly (e.g. from a DB)."""
        self.registry = entries

    def verify(self, business_name: str) -> Dict[str, Any]:
        """
        Verifies a single business name against the loaded registry.
        Returns a dict with verification status and match info.
        """
        best_match = None
        best_score = 0.0
        
        name_lower = business_name.lower().strip()
        if not name_lower or not self.registry:
            return {"status": "Unverified", "score": 0.0, "match": None}

        for entry in self.registry:
            # Assume registry has a 'name' or 'business_name' field
            bplo_name = entry.get("name", entry.get("business_name", "")).lower()
            if not bplo_name:
                continue
                
            score = token_sort_ratio(name_lower, bplo_name)
            if score > best_score:
                best_score = score
                best_match = entry

        # Config threshold for fuzzy matching is usually percentage (e.g. 80)
        # but our ratio is 0-1, so we convert if needed, or assume config is 0-100
        threshold_verified = self.config.fuzzy_match_threshold_verified / 100.0 if self.config.fuzzy_match_threshold_verified > 1.0 else self.config.fuzzy_match_threshold_verified
        threshold_pending = self.config.fuzzy_match_threshold_pending / 100.0 if self.config.fuzzy_match_threshold_pending > 1.0 else self.config.fuzzy_match_threshold_pending

        if best_score >= threshold_verified:
            status = "Verified"
        elif best_score >= threshold_pending:
            status = "Pending"
        else:
            status = "Unverified"

        return {
            "status": status,
            "score": round(best_score, 2),
            "match": best_match
        }

    def verify_batch(self, profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Verifies a batch of profiles, updating them in-place with verification status.
        """
        for profile in profiles:
            name = profile.get("name", profile.get("business_name", ""))
            result = self.verify(name)
            
            profile["status"] = result["status"]
            profile["is_verified"] = (result["status"] == "Verified")
            profile["verification_score"] = result["score"]
            if result["match"]:
                # Save some info about the match
                profile["matched_registry_name"] = result["match"].get("name", result["match"].get("business_name"))
                
        return profiles
