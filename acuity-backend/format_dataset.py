import json
import os
from datasets import Dataset

# 1. Configuration
INPUT_FILES = [
    "data/annotated/labeled_posts.json",
    "data/annotated/labeled_posts_2.json"
]
OUTPUT_DIR = "data/hf_dataset"

# Define our labels and their corresponding integer IDs
LABEL_MAP = {
    "O": 0,
    "B-BUSINESS_NAME": 1,
    "I-BUSINESS_NAME": 2,
    "B-SERVICE_CATEGORY": 3,
    "I-SERVICE_CATEGORY": 4,
    "B-LOCATION": 5,
    "I-LOCATION": 6
}

def process_label_studio_export(filepath):
    """
    Reads Label Studio JSON-MIN and converts it into Token/NER Tag format
    """
    print(f"Reading {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        ls_data = json.load(f)

    processed_data = {
        "tokens": [],
        "ner_tags": []
    }

    print(f"Processing {len(ls_data)} annotated posts...")
    
    for item in ls_data:
        text = item.get("text", "")
        labels = item.get("label", [])
        
        # Tokenize simply by splitting on whitespace
        # (This must match how we do pre-tokenization in the Inference script later!)
        tokens = text.split()
        
        # Default all tokens to 'O'
        ner_tags = ["O"] * len(tokens)
        
        # We need to map word indices to character offsets
        word_starts = []
        word_ends = []
        current_char = 0
        
        for token in tokens:
            # Find the actual start index of this token in the original text
            start = text.find(token, current_char)
            end = start + len(token)
            
            word_starts.append(start)
            word_ends.append(end)
            
            # Advance our search position
            current_char = end
            
        # Now, match the Label Studio character annotations to our word tokens
        for label_dict in labels:
            label_start = label_dict["start"]
            label_end = label_dict["end"]
            label_name = label_dict["labels"][0] # e.g. "BUSINESS_NAME"
            
            started = False
            
            for i, (w_start, w_end) in enumerate(zip(word_starts, word_ends)):
                # If the word falls inside the annotation bounding box
                # (We use a lenient overlap check to handle punctuation attached to words)
                overlap = max(0, min(w_end, label_end) - max(w_start, label_start))
                
                if overlap > 0:
                    if not started:
                        ner_tags[i] = f"B-{label_name}"
                        started = True
                    else:
                        ner_tags[i] = f"I-{label_name}"
        
        processed_data["tokens"].append(tokens)
        
        # Convert string labels to integer IDs for Hugging Face
        tag_ids = [LABEL_MAP.get(tag, 0) for tag in ner_tags]
        processed_data["ner_tags"].append(tag_ids)

    return processed_data


def main():
    combined_data = {"tokens": [], "ner_tags": []}
    
    for file in INPUT_FILES:
        if not os.path.exists(file):
            print(f"Warning: Could not find {file}")
            continue
            
        data_dict = process_label_studio_export(file)
        combined_data["tokens"].extend(data_dict["tokens"])
        combined_data["ner_tags"].extend(data_dict["ner_tags"])

    if not combined_data["tokens"]:
        print("Error: No data found across input files.")
        return
        
    # 2. Convert to Hugging Face Dataset format
    hf_dataset = Dataset.from_dict(combined_data)
    
    # Optional: Split into train and test sets (80% train, 20% test)
    hf_dataset = hf_dataset.train_test_split(test_size=0.2)
    
    # 3. Save to disk
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    hf_dataset.save_to_disk(OUTPUT_DIR)
    print(f"\nSuccess! Hugging Face dataset saved to: {OUTPUT_DIR}")
    print("You are now ready for Phase 4: Fine-Tuning!")
    print(hf_dataset)

if __name__ == "__main__":
    main()
