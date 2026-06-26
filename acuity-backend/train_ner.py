"""
ACUITY — Fine-Tuning Script for Google Colab
Upload this script along with the `hf_dataset` folder (zipped) to Google Colab.

Make sure to install these dependencies in a notebook cell before running:
!pip install transformers datasets evaluate seqeval accelerate sentencepiece tiktoken
"""
import os
from datasets import load_from_disk
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification
)
# Evaluate using seqeval
import evaluate
import numpy as np

# 1. Config
BASE_MODEL = "./best-model"
DATASET_PATH = "./hf_dataset" # Path to the dataset folder when unzipped in Colab
OUTPUT_DIR = "./acuity-fintuned-ner"

# Match exactly what you created in format_dataset.py
LABEL_LIST = [
    "O", 
    "B-BUSINESS_NAME", "I-BUSINESS_NAME", 
    "B-SERVICE_CATEGORY", "I-SERVICE_CATEGORY", 
    "B-LOCATION", "I-LOCATION"
]

def compute_metrics(p):
    """Calculates Precision, Recall, and F1 score during training."""
    metric = evaluate.load("seqeval")
    predictions, labels = p
    predictions = np.argmax(predictions, axis=2)

    # Remove ignored index (special tokens)
    true_predictions = [
        [LABEL_LIST[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    true_labels = [
        [LABEL_LIST[l] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]

    results = metric.compute(predictions=true_predictions, references=true_labels)
    return {
        "precision": results["overall_precision"],
        "recall": results["overall_recall"],
        "f1": results["overall_f1"],
        "accuracy": results["overall_accuracy"],
    }


def main():
    print(f"Loading Tokenizer from original 'jcblaise/roberta-tagalog-base' repository...")
    # Critical: RoBERTa tokenizers require add_prefix_space=True when tokenizing lists of words
    # We load the tokenizer from the absolute base because trainer.save_model doesn't always
    # export the physical vocab.json/merges.txt required to reload the tokenizer locally.
    tokenizer = AutoTokenizer.from_pretrained("jcblaise/roberta-tagalog-base", add_prefix_space=True)

    print("Loading Hugging Face Dataset from disk...")
    # NOTE: You MUST unzip your hf_dataset folder in Colab before this line runs!
    dataset = load_from_disk(DATASET_PATH)

    # We need to tokenize the text columns into input_ids and attention_masks for the model
    def tokenize_and_align_labels(examples):
        tokenized_inputs = tokenizer(
            examples["tokens"], truncation=True, is_split_into_words=True, max_length=512
        )

        labels = []
        for i, label in enumerate(examples["ner_tags"]):
            word_ids = tokenized_inputs.word_ids(batch_index=i)
            previous_word_idx = None
            label_ids = []
            
            for word_idx in word_ids:
                # Special tokens like <s> and </s> map to None
                if word_idx is None:
                    label_ids.append(-100)
                # We set the label for the first token of each word
                elif word_idx != previous_word_idx:
                    # Catch index out of bounds if dataset is malformed
                    if word_idx is not None and word_idx < len(label):
                        label_ids.append(label[word_idx])
                    else:
                        label_ids.append(-100)
                # For the other tokens in a word, we set the label to either the
                # current label or -100, depending on the label_all_tokens flag.
                # Standard practice is to ignore subwords during loss calculation
                else:
                    label_ids.append(-100)
                previous_word_idx = word_idx

            labels.append(label_ids)

        tokenized_inputs["labels"] = labels
        return tokenized_inputs

    print("Tokenizing and aligning labels...")
    tokenized_dataset = dataset.map(tokenize_and_align_labels, batched=True)

    id2label = {i: label for i, label in enumerate(LABEL_LIST)}
    label2id = {label: i for i, label in enumerate(LABEL_LIST)}

    print("Downloading the Tagalog Base Model (Downloading weights ~500MB)...")
    # Tell the model we have exactly 7 labels!
    model = AutoModelForTokenClassification.from_pretrained(
        BASE_MODEL, 
        num_labels=len(LABEL_LIST),
        id2label=id2label,
        label2id=label2id
    )

    data_collator = DataCollatorForTokenClassification(tokenizer=tokenizer)

    print("\n--- Setting up Training Configurations ---")
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        eval_strategy="epoch", # Evaluate the F1 Score after every loop
        learning_rate=3e-5, # Slightly higher learning rate to break out of all-O minimum
        per_device_train_batch_size=16, # How many posts it looks at once
        per_device_eval_batch_size=16,
        num_train_epochs=15, # Loop over the data 15 times to ensure minority classes are learned
        weight_decay=0.01,
        save_strategy="epoch", # Save the model automatically
        load_best_model_at_end=True, # Keep the smartest version
        metric_for_best_model="f1", # CRUCIAL: Pick the best model based on F1 Score, not strict loss!
        greater_is_better=True,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["test"],
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    print("\n🚀 STARTING THE TRAINING PHASE 🚀")
    print("If you are on a Google Colab GPU (T4), this should take < 5 minutes!")
    trainer.train()

    print("\nTraining Complete! Saving final model...")
    trainer.save_model(f"{OUTPUT_DIR}/best-model")
    print(f"You can now download the folder `{OUTPUT_DIR}/best-model` to your PC!")

if __name__ == "__main__":
    main()
