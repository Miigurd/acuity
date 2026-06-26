"""
ACUITY Framework Configuration
"""
import os
from dataclasses import dataclass

@dataclass
class AcuityConfig:
    # Data paths
    raw_data_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "raw", "posts.csv"))
    output_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "processed", "business_profiles.json"))
    frontend_data_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "processed", "frontend_businesses.json"))
    
    # NLP / Pipeline settings
    ner_model_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "best-model"))
    completeness_threshold: int = 2
    
    # Recommendation settings
    relevance_weight: float = 0.6
    proximity_weight: float = 0.4
    default_top_k: int = 10
    
    # BPLO Verification settings
    # We provide a default, but this should be overridden in production
    bplo_registry_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dummy_bplo.csv"))
    fuzzy_match_threshold_verified: float = 0.8
    fuzzy_match_threshold_pending: float = 0.6

# Global default config instance
default_config = AcuityConfig()
