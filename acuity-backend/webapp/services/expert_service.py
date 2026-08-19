"""
ACUITY — Expert Mode Live Trace Service

Runs the *actual* production pipelines and returns every intermediate
value so the IT Expert portal can demonstrate exactly what the system
computes — the same cached engine, corpus, and TF-IDF state used by
``/api/search``, and the same CRF extraction path used by ``/api/extract``.
"""
from __future__ import annotations

from acuity.recommendation.vectorizer import transform_query  # type: ignore
from acuity.extraction.preprocessing import preprocess  # type: ignore
from acuity.extraction.rules import extract_structured_fields  # type: ignore
from acuity.extraction.postprocessing import build_business_profile  # type: ignore
from acuity.extraction.ner_crf import _sent2features  # type: ignore

from webapp.services.search_service import get_engine


def trace_recommendation(query: str, user_lat=None, user_lon=None, top_k: int = 50, engine=None) -> dict:
    """Return a full live trace of the recommendation pipeline.

    The returned ranking is produced by the same cached ``RecommendationEngine``
    that powers ``/api/search``, so the final results are identical to what the
    deployed system returns.

    Args:
        engine: Optional pre-built engine (used by tests). Defaults to the
            shared production engine from ``get_engine()``.
    """
    if engine is None:
        engine = get_engine()
    if engine is None:
        return {
            "source": "production",
            "error": "No eligible (verified + active) business profiles in the database to vectorize.",
            "corpus": [],
            "results": [],
        }

    vectorizer = engine._vectorizer
    tfidf_matrix = engine._tfidf_matrix

    # 1. Query vectorization (same call the engine makes)
    query_vec = transform_query(vectorizer, query or "")[0]

    # 2. Textual relevance (cosine) per profile
    cosine_scores = []
    for profile, vector in zip(engine.profiles, tfidf_matrix):
        qv = query_vec
        qmag = sum(v ** 2 for v in qv.values()) ** 0.5
        if qmag == 0:
            cosine_scores.append(0.0)
            continue
        dot = sum(w * vector.get(t, 0.0) for t, w in qv.items())
        dmag = sum(v ** 2 for v in vector.values()) ** 0.5
        cosine_scores.append(dot / (qmag * dmag) if dmag else 0.0)

    # 3. Geographic proximity (Haversine) per profile
    from acuity.recommendation.proximity import haversine_distance  # type: ignore

    distances = []
    for profile in engine.profiles:
        biz_lat = profile.get("latitude")
        biz_lon = profile.get("longitude")
        if user_lat is not None and user_lon is not None and biz_lat is not None and biz_lon is not None:
            distances.append(haversine_distance(user_lat, user_lon, biz_lat, biz_lon))
        else:
            distances.append(None)

    # 4. Per-profile breakdown (aligned with engine.profiles order)
    per_profile = []
    for i, profile in enumerate(engine.profiles):
        name = profile.get("name") or profile.get("business_name") or "(unnamed)"
        dist = distances[i]
        proximity_score = 1.0 / (1.0 + dist) if dist is not None else 0.0
        relevance = float(cosine_scores[i])
        final = (engine.relevance_weight * relevance) + (engine.proximity_weight * proximity_score)

        # Non-zero TF-IDF terms actually present in this profile's vector
        tf_vector = {term: round(w, 6) for term, w in tfidf_matrix[i].items()}

        per_profile.append({
            "name": name,
            "latitude": profile.get("latitude"),
            "longitude": profile.get("longitude"),
            "distance_km": round(dist, 4) if dist is not None else None,
            "cosine_similarity": round(relevance, 6),
            "proximity_score": round(proximity_score, 6),
            "relevance_score": round(relevance, 6),
            "final_score": round(final, 6),
            "tf_vector": tf_vector,
        })

    # 5. The actual ranked output (identical to /api/search minus impression tracking)
    results = engine.recommend(query=query, user_lat=user_lat, user_lon=user_lon, top_k=top_k)

    ranked = [{
        "name": r.get("name") or r.get("business_name"),
        "relevance_score": r.get("relevance_score"),
        "distance_km": r.get("distance_km"),
        "proximity_score": r.get("proximity_score"),
        "final_score": r.get("final_score"),
    } for r in results if (r.get("name") or r.get("business_name"))]

    return {
        "source": "production",
        "engine": "acuity.recommendation.RecommendationEngine",
        "weights": {
            "relevance_weight": engine.relevance_weight,
            "proximity_weight": engine.proximity_weight,
            "top_k": top_k,
        },
        "query": query,
        "query_vector": {term: round(w, 6) for term, w in query_vec.items()},
        "idf_table": {term: round(w, 6) for term, w in vectorizer.idf_weights.items()},
        "vocabulary_size": len(vectorizer.vocabulary),
        "corpus": [{
            "name": p.get("name") or p.get("business_name") or "(unnamed)",
            "text": "{name} {description} {categories} {services}".format(
                name=p.get("name") or p.get("business_name") or "",
                description=p.get("description") or "",
                categories=" ".join(p.get("categories") or []),
                services=" ".join(p.get("services") or []),
            ),
            "latitude": p.get("latitude"),
            "longitude": p.get("longitude"),
        } for p in engine.profiles],
        "per_profile": per_profile,
        "results": ranked,
        "user_location": {"lat": user_lat, "lon": user_lon},
    }


def trace_extraction(text: str, crf_model) -> dict:
    """Run the real extraction pipeline and expose every intermediate stage."""
    cleaned = preprocess(text)

    # Token-level CRF BIO tag predictions
    token_tags = []
    grouped_entities = {"business_name": [], "categories": [], "locations": []}

    if crf_model is not None:
        tokens = cleaned.split()
        if tokens:
            features = _sent2features(tokens)
            predictions = crf_model.predict([features])[0]

            current_type = None
            current_tokens = []

            def _save():
                if current_type and current_tokens:
                    entity_text = " ".join(current_tokens)
                    if current_type == "BUSINESS_NAME":
                        grouped_entities["business_name"].append(entity_text)
                    elif current_type == "SERVICE_CATEGORY":
                        grouped_entities["categories"].append(entity_text)
                    elif current_type == "LOCATION":
                        grouped_entities["locations"].append(entity_text)

            for token, tag in zip(tokens, predictions):
                token_tags.append({"token": token, "tag": tag})
                if tag.startswith("B-"):
                    _save()
                    current_type = tag[2:]
                    current_tokens = [token]
                elif tag.startswith("I-"):
                    if current_type == tag[2:]:
                        current_tokens.append(token)
                    else:
                        _save()
                        current_type = tag[2:]
                        current_tokens = [token]
                else:
                    _save()
                    current_type = None
                    current_tokens = []
            _save()
    else:
        token_tags = [{"token": t, "tag": "O"} for t in cleaned.split()]

    # Rule-based structured fields (phones, prices, hours)
    structured = extract_structured_fields(cleaned)

    # Final profile construction (same call the pipeline makes)
    profile = build_business_profile(
        raw_text=text,
        entities=grouped_entities,
        structured_fields=structured,
        metadata={"source_index": 0},
    )

    return {
        "source": "production",
        "raw_text": text,
        "preprocessed_text": cleaned,
        "model_loaded": crf_model is not None,
        "token_tags": token_tags,
        "entities": grouped_entities,
        "structured_fields": {
            "phones": structured.get("phones", []),
            "prices": structured.get("prices", []),
            "hours": structured.get("hours", []),
        },
        "profile": profile,
    }
