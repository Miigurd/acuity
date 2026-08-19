import pytest
from acuity.recommendation import RecommendationEngine
from acuity.recommendation.similarity import compute_cosine_scores
from acuity.recommendation.vectorizer import transform_query

from webapp.services.expert_service import trace_recommendation, trace_extraction


def _make_engine():
    profiles = [
        {
            "name": "Juan's Bakery",
            "description": "Fresh bread and pandesal daily",
            "categories": ["Bakery"],
            "services": ["pandesal", "bread"],
            "latitude": 14.252638,
            "longitude": 121.128865,
        },
        {
            "name": "Kuya Jun Vulcanizing",
            "description": "Bike repair and vulcanizing shop",
            "categories": ["Repair Services"],
            "services": ["vulcanizing", "bike repair"],
            "latitude": 14.243532,
            "longitude": 121.170394,
        },
        {
            "name": "Mang Kanor Lomi House",
            "description": "Lomi and tapsilog in Banay-Banay",
            "categories": ["Food & Beverages"],
            "services": ["lomi", "tapsilog"],
            "latitude": 14.235041,
            "longitude": 121.151889,
        },
    ]
    engine = RecommendationEngine()
    engine.set_profiles(profiles)
    return engine


def test_trace_recommendation_matches_engine_output():
    engine = _make_engine()
    query = "bike repair vulcanizing"
    user_lat, user_lon = 14.252638, 121.128865

    trace = trace_recommendation(query, user_lat, user_lon, top_k=10, engine=engine)

    assert trace["source"] == "production"
    assert trace["weights"]["relevance_weight"] == 0.6
    assert trace["weights"]["proximity_weight"] == 0.4

    # Final ranking must match the actual engine output used by /api/search
    live = engine.recommend(query=query, user_lat=user_lat, user_lon=user_lon, top_k=10)
    assert len(trace["results"]) == len(live)
    for a, b in zip(trace["results"], live):
        assert a["name"] == (b.get("name") or b.get("business_name"))
        assert a["final_score"] == b["final_score"]
        assert a["relevance_score"] == b["relevance_score"]
        assert a["distance_km"] == b["distance_km"]

    # Cosine scores must match the framework's own similarity module
    query_vec = transform_query(engine._vectorizer, query)
    expected_cosine = compute_cosine_scores(engine._tfidf_matrix, query_vec)
    for row, expected in zip(trace["per_profile"], expected_cosine):
        assert abs(row["cosine_similarity"] - expected) < 1e-6

    # Corpus text must be exactly what the engine vectorized
    assert len(trace["corpus"]) == 3
    assert trace["corpus"][0]["name"] == "Juan's Bakery"
    assert "pandesal" in trace["corpus"][0]["text"]

    # Query vector / IDF table populated for a real query
    assert len(trace["query_vector"]) > 0
    assert len(trace["idf_table"]) > 0
    assert trace["vocabulary_size"] > 0

    # Per-profile TF vectors present
    assert all("tf_vector" in row for row in trace["per_profile"])
    assert trace["per_profile"][0]["distance_km"] is not None


def test_trace_recommendation_empty_query():
    engine = _make_engine()
    trace = trace_recommendation("", user_lat=14.25, user_lon=121.13, engine=engine)
    # Empty query => no textual relevance, so results still ranked by proximity
    assert trace["query_vector"] == {}
    assert len(trace["results"]) == len(engine.profiles)


def test_trace_extraction_without_model():
    text = "Looking for a laundry shop near Brgy. Pulo, Cabuyao. Open 8am-5pm, 0917-123-4567."
    trace = trace_extraction(text, crf_model=None)

    assert trace["source"] == "production"
    assert trace["raw_text"] == text
    assert "0917-123-4567" in trace["preprocessed_text"]

    # Token tags should be produced even without a model (all tagged O)
    assert len(trace["token_tags"]) > 0
    assert all("token" in t and "tag" in t for t in trace["token_tags"])

    # Rule-based structured extraction ran on the cleaned text
    assert "0917-123-4567" in trace["structured_fields"]["phones"]
    assert len(trace["structured_fields"]["hours"]) > 0

    # Final profile construction ran
    assert trace["profile"] is not None
    assert trace["profile"]["description"] == text
