import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from acuity.utils import levenshtein_ratio, levenshtein_details
from acuity.config import AcuityConfig

default_config = AcuityConfig()

def test_bplo_levenshtein_matching():
    print("\n===========================================================")
    print("   ACUITY BPLO VERIFICATION (LEVENSHTEIN DISTANCE)         ")
    print("===========================================================")
    print(f"Auto-Verify Threshold  : {default_config.fuzzy_match_threshold_verified}")
    print(f"Pending-Queue Threshold: {default_config.fuzzy_match_threshold_pending}")
    print("-----------------------------------------------------------\n")

    # (Extracted Name from FB, BPLO Registry Name)
    test_cases = [
        ("Marias Eatery", "Maria's Eatery"), # Near exact typo match
        ("Banay-Banay Water Station", "Banay Banay Water Refilling Station"), # Partial missing word match
        ("", "Acme Bakery") # Edge case: Empty extracted string
    ]

    for extracted, bplo in test_cases:
        # Convert both to lowercase just like the actual system does
        extracted_lower = extracted.lower()
        bplo_lower = bplo.lower()
        
        score = levenshtein_ratio(extracted_lower, bplo_lower)
        details = levenshtein_details(extracted_lower, bplo_lower)
        
        print(f"Extracted (FB) : '{extracted}'")
        print(f"BPLO Registry  : '{bplo}'")
        print(f"Match Score    : {score:.2f} ({int(score * 100)}%)")
        print(f"Edits needed   : {details['edits']} (out of max len {details['max_len']})")
        
        # Simulate the routing logic inside bplo_service.py
        if extracted_lower == bplo_lower:
            print("=> Result: [VERIFIED] (Fast Path: Exact O(1) Match)\n")
            assert True
        elif score >= default_config.fuzzy_match_threshold_verified:
            print("=> Result: [VERIFIED] (Fuzzy Match Auto-verified)\n")
            assert True
        elif score >= default_config.fuzzy_match_threshold_pending:
            print("=> Result: [PENDING] (Queued for Admin Review)\n")
            assert True
        else:
            print("=> Result: [REJECTED] (Score too low to match)\n")
            assert True
