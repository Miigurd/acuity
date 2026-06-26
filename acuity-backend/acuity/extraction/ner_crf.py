import os
import pickle
import nltk
from ..config import default_config

try:
    nltk.data.find('taggers/averaged_perceptron_tagger_eng')
except LookupError:
    nltk.download('averaged_perceptron_tagger_eng')

# Load the local CRF model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "crf_model.pkl")

try:
    with open(MODEL_PATH, 'rb') as f:
        crf_model = pickle.load(f)
except Exception as e:
    print(f"Warning: Could not load local CRF model from {MODEL_PATH}: {e}")
    crf_model = None

def extract_features(tokens, pos_tags, i):
    word = tokens[i]
    postag = pos_tags[i][1]
    
    features = {
        'bias': 1.0,
        'word.lower()': word.lower(),
        'word[-3:]': word[-3:],
        'word[-2:]': word[-2:],
        'word[:3]': word[:3],
        'word[:2]': word[:2],
        'word.isupper()': word.isupper(),
        'word.istitle()': word.istitle(),
        'word.isdigit()': word.isdigit(),
        'postag': postag,
        'postag[:2]': postag[:2],
    }
    
    if i > 0:
        word1 = tokens[i-1]
        postag1 = pos_tags[i-1][1]
        features.update({
            '-1:word.lower()': word1.lower(),
            '-1:word.istitle()': word1.istitle(),
            '-1:word.isupper()': word1.isupper(),
            '-1:postag': postag1,
            '-1:postag[:2]': postag1[:2],
        })
    else:
        features['BOS'] = True

    if i < len(tokens)-1:
        word1 = tokens[i+1]
        postag1 = pos_tags[i+1][1]
        features.update({
            '+1:word.lower()': word1.lower(),
            '+1:word.istitle()': word1.istitle(),
            '+1:word.isupper()': word1.isupper(),
            '+1:postag': postag1,
            '+1:postag[:2]': postag1[:2],
        })
    else:
        features['EOS'] = True

    return features

def sent2features(sent_tokens):
    pos_tags = nltk.pos_tag(sent_tokens)
    return [extract_features(sent_tokens, pos_tags, i) for i in range(len(sent_tokens))]

def extract_entities(text: str) -> dict:
    """Extract named entities from *text* using a CRF model.

    Returns:
        dict with keys: business_name, categories, locations.
        Each value is a list of extracted strings.
    """
    extracted = {
        "business_name": [],
        "categories": [],
        "locations": [],
    }

    if not crf_model:
        return extracted

    # Tokenize simply by splitting on whitespace to match training
    tokens = text.split()
    if not tokens:
        return extracted

    # Extract features
    features = sent2features(tokens)
    
    # Predict BIO tags
    predictions = crf_model.predict([features])[0]
    
    # Reconstruct entities from BIO tags
    current_entity_type = None
    current_entity_tokens = []
    
    def _save_entity():
        if current_entity_type and current_entity_tokens:
            entity_text = " ".join(current_entity_tokens)
            if current_entity_type == "BUSINESS_NAME":
                extracted["business_name"].append(entity_text)
            elif current_entity_type == "SERVICE_CATEGORY":
                extracted["categories"].append(entity_text)
            elif current_entity_type == "LOCATION":
                extracted["locations"].append(entity_text)
                
    for token, tag in zip(tokens, predictions):
        if tag.startswith("B-"):
            _save_entity()
            current_entity_type = tag[2:]
            current_entity_tokens = [token]
        elif tag.startswith("I-"):
            if current_entity_type == tag[2:]:
                current_entity_tokens.append(token)
            else:
                _save_entity()
                current_entity_type = tag[2:]
                current_entity_tokens = [token]
        else:
            _save_entity()
            current_entity_type = None
            current_entity_tokens = []
            
    _save_entity()

    return extracted
