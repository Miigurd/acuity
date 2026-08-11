import pytest
import math
import json
from acuity.recommendation.proximity import haversine_distance
from acuity.recommendation.similarity import compute_cosine_scores
from acuity.recommendation.ranker import rank_results

def test_end_to_end_recommendation():
    print("\n\n" + "="*50)
    print("--- END-TO-END RECOMMENDATION TEST ---")
    print("="*50)
    
    # 1. Define businesses with their coordinates and documents
    businesses = [
        {"id": 1, "name": "Distant Bakery (Manila)", "lat": 14.5995, "lon": 120.9842, "doc": {"bakery": 1.0, "bread": 0.5, "pastry": 0.5}},
        {"id": 2, "name": "Nearby Hardware (Cabuyao)", "lat": 14.2833, "lon": 121.1167, "doc": {"hardware": 1.0, "tools": 1.0}},
        {"id": 3, "name": "Nearby Bakery (Cabuyao)", "lat": 14.2711, "lon": 121.1278, "doc": {"bakery": 1.0, "pastry": 1.0}},
        {"id": 4, "name": "Perfect Match Far (Tokyo)", "lat": 35.6895, "lon": 139.6917, "doc": {"bakery": 1.0, "bread": 0.5, "pastry": 0.5}},
        {"id": 5, "name": "Perfect Match Near (Cabuyao)", "lat": 14.2830, "lon": 121.1160, "doc": {"bakery": 1.0, "bread": 0.5, "pastry": 0.5}},
        {"id": 6, "name": "Zero Match Near (Cabuyao)", "lat": 14.2833, "lon": 121.1167, "doc": {"food": 1.0}},
        {"id": 7, "name": "Pastry Shop Medium (Santa Rosa)", "lat": 14.3167, "lon": 121.0833, "doc": {"pastry": 1.0, "cake": 0.8}},
        {"id": 8, "name": "Bakery Medium Dist (Biñan)", "lat": 14.3333, "lon": 121.0833, "doc": {"bakery": 0.8, "bread": 0.8}},
        {"id": 9, "name": "General Store Very Far (Cebu)", "lat": 10.3157, "lon": 123.8854, "doc": {"bakery": 0.2, "hardware": 0.5, "food": 0.8}},
        {"id": 10, "name": "Bread and Hardware Near (Cabuyao)", "lat": 14.2800, "lon": 121.1200, "doc": {"bakery": 0.5, "hardware": 0.5, "tools": 0.5}},
    ]
    
    # 2. User Query and Location (e.g., somewhere in Cabuyao)
    user_lat = 14.2833
    user_lon = 121.1167
    query_docs = [{"bakery": 1.0, "bread": 0.5, "pastry": 0.5}]
    
    print("\n[USER QUERY]")
    print(f"Location: ({user_lat}, {user_lon})")
    print(f"Query Document: {json.dumps(query_docs[0])}")
    
    print("\n[BUSINESSES IN DATABASE]")
    for b in businesses:
        print(f"ID: {b['id']} | Name: {b['name']} | Location: ({b['lat']}, {b['lon']})")
        print(f"Doc: {json.dumps(b['doc'])}")
    print("-" * 50)
    
    # 3. Compute Distances
    distances = []
    for b in businesses:
        dist = haversine_distance(user_lat, user_lon, b["lat"], b["lon"])
        distances.append(dist)
        
    # 4. Compute Cosine Scores
    business_docs = [b["doc"] for b in businesses]
    cosine_scores = compute_cosine_scores(business_docs, query_docs)
    
    # 5. Rank Results
    relevance_weight = 0.6
    proximity_weight = 0.4
    max_distance_km = 15.0 # From ranker.py
    
    results = rank_results(
        profiles=businesses,
        cosine_scores=cosine_scores,
        distances=distances,
        relevance_weight=relevance_weight,
        proximity_weight=proximity_weight,
        top_k=10
    )
    
    print("\n[RANKED RESULTS & SCORING MATRIX]")
    print("Scoring Formula:")
    print(f"  Final Score = (Relevance Score * {relevance_weight}) + (Proximity Score * {proximity_weight})")
    print(f"  Proximity Score = max(0, 1.0 - (Distance / {max_distance_km}km))")
    print("\nTop Recommendations:")
    
    for i, r in enumerate(results, 1):
        print(f"{i}. {r['name']}")
        print(f"   Business Doc: {json.dumps(r['doc'])}")
        print(f"   Distance: {r['distance_km']} km")
        print(f"   Calculation Breakdown:")
        
        # Explain relevance
        print(f"     - Relevance (Cosine Similarity) = {r['relevance_score']:.4f}")
        print(f"       * Weighted Relevance: {r['relevance_score']:.4f} * {relevance_weight} = {(r['relevance_score'] * relevance_weight):.4f}")
        
        # Explain proximity
        print(f"     - Proximity Score = max(0, 1.0 - ({r['distance_km']} / {max_distance_km})) = {r['proximity_score']:.4f}")
        print(f"       * Weighted Proximity: {r['proximity_score']:.4f} * {proximity_weight} = {(r['proximity_score'] * proximity_weight):.4f}")
        
        # Final Score
        print(f"   => FINAL SCORE: {(r['relevance_score'] * relevance_weight) + (r['proximity_score'] * proximity_weight):.4f} (Actual returned by ranker: {r['final_score']:.4f})")
        print()
        
    assert len(results) == len(businesses)
    assert results[0]["name"] == "Perfect Match Near (Cabuyao)"
