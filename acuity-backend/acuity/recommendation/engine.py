"""
ACUITY — Recommendation Engine
Main orchestrator that combines textual relevance (TF-IDF + cosine)
with geographic proximity (Haversine) to produce ranked results.

Usage:
    from recommender.engine import RecommendationEngine

    engine = RecommendationEngine()
    engine.load_profiles("data/processed/business_profiles.json")
    results = engine.recommend(query="bakery", user_lat=14.25, user_lon=121.10)
"""
from __future__ import annotations

import json

from .vectorizer import build_tfidf_matrix, transform_query  # type: ignore
from .similarity import compute_cosine_scores  # type: ignore
from .proximity import haversine_distance  # type: ignore
from .ranker import rank_results  # type: ignore
from ..config import AcuityConfig, default_config


class RecommendationEngine:
    """End-to-end recommendation engine for ACUITY."""

    def __init__(self, config: AcuityConfig | None = None, relevance_weight: float | None = None, proximity_weight: float | None = None):
        self.config = config or default_config
        self.profiles: list[dict] = []
        self.relevance_weight = relevance_weight if relevance_weight is not None else self.config.relevance_weight
        self.proximity_weight = proximity_weight if proximity_weight is not None else self.config.proximity_weight
        self._tfidf_matrix = None
        self._vectorizer = None

    def set_profiles(self, profiles: list[dict]):
        """Load business profiles from an in-memory list."""
        self.profiles = profiles
        # Build TF-IDF matrix from profile names and descriptions
        texts = [f"{p.get('name', p.get('business_name', ''))} {p.get('description', '')}" for p in self.profiles]
        self._vectorizer, self._tfidf_matrix = build_tfidf_matrix(texts)
        print(f"Loaded {len(self.profiles)} profiles. TF-IDF matrix built.")

    def load_profiles(self, path: str):
        """Load business profiles from a JSON file."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.set_profiles(data)

    def recommend(
        self,
        query: str,
        user_lat: float | None = None,
        user_lon: float | None = None,
        top_k: int | None = None,
    ) -> list[dict]:
        """Return top-k ranked business profiles for *query*.

        Args:
            query: User's search query text.
            user_lat: User's latitude (optional, for proximity scoring).
            user_lon: User's longitude (optional, for proximity scoring).
            top_k: Number of results to return.

        Returns:
            List of profile dicts augmented with relevance_score,
            distance_km, and final_score.
        """
        if top_k is None:
            top_k = self.config.default_top_k

        if not self.profiles or self._tfidf_matrix is None:
            return []

        # Textual relevance
        query_vec = transform_query(self._vectorizer, query)
        cosine_scores = compute_cosine_scores(self._tfidf_matrix, query_vec)

        # Proximity (if user location provided)
        distances = []
        if user_lat is not None and user_lon is not None:
            for profile in self.profiles:
                biz_lat = profile.get("latitude")
                biz_lon = profile.get("longitude")
                if biz_lat is not None and biz_lon is not None:
                    distances.append(
                        haversine_distance(user_lat, user_lon, biz_lat, biz_lon)
                    )
                else:
                    distances.append(None)
        else:
            distances = [None] * len(self.profiles)

        # Combine & rank
        results = rank_results(
            profiles=self.profiles,
            cosine_scores=cosine_scores,
            distances=distances,
            relevance_weight=self.relevance_weight,
            proximity_weight=self.proximity_weight,
            top_k=top_k,
        )

        return results
