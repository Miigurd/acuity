"""
ACUITY — Named Entity Recognition
Extracts business-related entities from preprocessed post text:
  - Business name
  - Service category / offerings
  - Location mentions (barangay, street, subdivision)

Uses spaCy (or a fine-tuned transformer) as the backbone.
"""


import os
from transformers import pipeline

from ..config import default_config

# Load the local fine-tuned model
# We use aggregation_strategy="simple" so Hugging Face automatically 
# merges B- and I- tags back into full words!
MODEL_PATH = default_config.ner_model_path

try:
    print(f"Loading Fine-Tuned NER model from {MODEL_PATH}...")
    ner_model = pipeline("ner", model=MODEL_PATH, aggregation_strategy="simple")
except Exception as e:
    print(f"Warning: Could not load local NER model: {e}")
    ner_model = None

def extract_entities(text: str) -> dict:
    """Extract named entities from *text*.

    Returns:
        dict with keys: business_name, categories, locations.
        Each value is a list of extracted strings.
    """
    extracted = {
        "business_name": [],
        "categories": [],
        "locations": [],
    }

    if not ner_model:
        return extracted

    # Use character-level slicing to prevent PyTorch CUDA asserts on long posts without destroying token alignment.
    # 2000 characters is a safe upper bound that typically fits well within 512 tokens.
    truncated_text = text[:2000]

    # Run the Hugging Face model on the truncated text
    hf_results = ner_model(truncated_text)
    
    # Map the model's output to our pipeline dictionary
    for entity in hf_results:
        label = entity.get("entity_group")
        word = entity.get("word", "").strip()
        score = float(entity.get("score", 0))
        
        # We only want confident extractions
        if score < 0.30:
            continue
            
        if label == "BUSINESS_NAME": 
            extracted["business_name"].append(word)
        elif label == "LOCATION":
            extracted["locations"].append(word)
        elif label == "SERVICE_CATEGORY": 
            extracted["categories"].append(word)

    return extracted
