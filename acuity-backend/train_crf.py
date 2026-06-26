import json
import nltk
import sklearn_crfsuite
from sklearn_crfsuite import metrics
import pickle

nltk.download('averaged_perceptron_tagger_eng')

# Load the data
DATA_FILES = [
    "data/annotated/labeled_posts.json",
    "data/annotated/labeled_posts_2.json"
]

LABEL_MAP = {
    "O": 0,
    "B-BUSINESS_NAME": 1,
    "I-BUSINESS_NAME": 2,
    "B-SERVICE_CATEGORY": 3,
    "I-SERVICE_CATEGORY": 4,
    "B-LOCATION": 5,
    "I-LOCATION": 6
}

LABEL_MAP_INV = {v: k for k, v in LABEL_MAP.items()}

def process_label_studio_export(filepath):
    print(f"Reading {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        ls_data = json.load(f)

    processed_data = {"tokens": [], "ner_tags": []}
    
    for item in ls_data:
        text = item.get("text", "")
        labels = item.get("label", [])
        tokens = text.split()
        ner_tags = ["O"] * len(tokens)
        
        word_starts, word_ends = [], []
        current_char = 0
        for token in tokens:
            start = text.find(token, current_char)
            end = start + len(token)
            word_starts.append(start)
            word_ends.append(end)
            current_char = end
            
        for label_dict in labels:
            label_start = label_dict["start"]
            label_end = label_dict["end"]
            label_name = label_dict["labels"][0]
            started = False
            for i, (w_start, w_end) in enumerate(zip(word_starts, word_ends)):
                overlap = max(0, min(w_end, label_end) - max(w_start, label_start))
                if overlap > 0:
                    if not started:
                        ner_tags[i] = f"B-{label_name}"
                        started = True
                    else:
                        ner_tags[i] = f"I-{label_name}"
        
        processed_data["tokens"].append(tokens)
        tag_ids = [LABEL_MAP.get(tag, 0) for tag in ner_tags]
        processed_data["ner_tags"].append(tag_ids)

    return processed_data

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

def sent2labels(sent_labels):
    return [LABEL_MAP_INV[tag_id] for tag_id in sent_labels]

def main():
    print("Loading data...")
    dataset = {"tokens": [], "ner_tags": []}
    for file in DATA_FILES:
        ds = process_label_studio_export(file)
        dataset["tokens"].extend(ds["tokens"])
        dataset["ner_tags"].extend(ds["ner_tags"])
        
    X = [sent2features(tokens) for tokens in dataset["tokens"]]
    y = [sent2labels(labels) for labels in dataset["ner_tags"]]
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    print(f"Training on {len(X_train)} samples, evaluating on {len(X_test)} samples.")
    
    crf = sklearn_crfsuite.CRF(
        algorithm='lbfgs',
        c1=0.1,
        c2=0.1,
        max_iterations=100,
        all_possible_transitions=True
    )
    
    print("Training CRF model...")
    crf.fit(X_train, y_train)
    
    print("Evaluating...")
    y_pred = crf.predict(X_test)
    
    labels = list(crf.classes_)
    labels.remove('O')
    
    print(metrics.flat_classification_report(y_test, y_pred, labels=labels, digits=3))
    
    with open('crf_model.pkl', 'wb') as f:
        pickle.dump(crf, f)
    print("CRF model saved to crf_model.pkl")

if __name__ == "__main__":
    main()
