"""
ACUITY Framework - BPLO Registry Verification
"""
import csv
import difflib
from typing import List, Dict, Optional, Any
from ..config import AcuityConfig, default_config
from webapp.utils import levenshtein_ratio



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
                
            score = levenshtein_ratio(name_lower, bplo_name)
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
            status = "Pending Verification"
        else:
            status = "Unverified"
            best_match = None

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
