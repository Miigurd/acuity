"""
ACUITY — TF-IDF Vectorizer (Hardcoded)
Converts business profile descriptions (and user queries) into
TF-IDF feature vectors for similarity computation using pure Python.
"""
from __future__ import annotations

import math
import re
from collections import defaultdict
from typing import Any

# Standard English stop words
STOP_WORDS = set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", 
    "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", 
    "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", 
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that", 
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", 
    "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", 
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", 
    "at", "by", "for", "with", "about", "against", "between", "into", "through", 
    "during", "before", "after", "above", "below", "to", "from", "up", "down", 
    "in", "out", "on", "off", "over", "under", "again", "further", "then", 
    "once", "here", "there", "when", "where", "why", "how", "all", "any", 
    "both", "each", "few", "more", "most", "other", "some", "such", "no", 
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", 
    "t", "can", "will", "just", "don", "should", "now"
])

class CustomTfidfVectorizer:
    def __init__(self, ngram_range=(1, 2)):
        self.ngram_range = ngram_range
        self.idf_weights: dict[str, float] = {}
        self.vocabulary: set[str] = set()
        self.n_documents: int = 0
    
    def _tokenize_and_ngrams(self, text: str) -> list[str]:
        # Lowercase and extract alphanumeric tokens
        text = text.lower()
        tokens = re.findall(r'\b[a-z0-9]+\b', text)
        
        # Remove stop words
        tokens = [t for t in tokens if t not in STOP_WORDS]
        
        ngrams = []
        min_n, max_n = self.ngram_range
        
        # Unigrams
        if min_n <= 1:
            ngrams.extend(tokens)
            
        # Bigrams, Trigrams, etc.
        for n in range(max(2, min_n), max_n + 1):
            for i in range(len(tokens) - n + 1):
                ngram = " ".join(tokens[i:i+n])
                ngrams.append(ngram)
                
        return ngrams

    def fit_transform(self, documents: list[str]) -> list[dict[str, float]]:
        self.n_documents = len(documents)
        document_term_counts = []
        doc_frequency = defaultdict(int)
        
        # Stage 1: Tokenize and compute term frequencies per document
        for doc in documents:
            tokens = self._tokenize_and_ngrams(doc)
            term_counts = defaultdict(int)
            for token in tokens:
                term_counts[token] += 1
            
            document_term_counts.append(term_counts)
            
            # Count document frequency (number of docs containing the term)
            for unique_term in set(tokens):
                doc_frequency[unique_term] += 1
                self.vocabulary.add(unique_term)
                
        # Stage 2: Compute IDF weights (Eq. 3.7)
        for term, df in doc_frequency.items():
            self.idf_weights[term] = math.log(self.n_documents / df)
            
        # Stage 3: Compute TF-IDF vectors for the training documents (Eq. 3.5 & 3.6)
        tfidf_vectors = []
        for term_counts in document_term_counts:
            vector = {}
            for term, count in term_counts.items():
                if count > 0:
                    tf = 1.0 + math.log(count)
                    vector[term] = tf * self.idf_weights[term]
            tfidf_vectors.append(vector)
            
        return tfidf_vectors

    def transform(self, documents: list[str]) -> list[dict[str, float]]:
        tfidf_vectors = []
        for doc in documents:
            tokens = self._tokenize_and_ngrams(doc)
            term_counts = defaultdict(int)
            for token in tokens:
                if token in self.vocabulary:
                    term_counts[token] += 1
            
            vector = {}
            for term, count in term_counts.items():
                if count > 0:
                    tf = 1.0 + math.log(count)
                    vector[term] = tf * self.idf_weights[term]
            tfidf_vectors.append(vector)
            
        return tfidf_vectors

def build_tfidf_matrix(documents: list[str]) -> tuple[CustomTfidfVectorizer, list[dict[str, float]]]:
    """Fit a custom TF-IDF vectorizer on *documents* and return the vectors."""
    vectorizer = CustomTfidfVectorizer(ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(documents)
    return vectorizer, tfidf_matrix

def transform_query(vectorizer: CustomTfidfVectorizer, query: str) -> list[dict[str, float]]:
    """Transform a user query string into the fitted TF-IDF vector space."""
    return vectorizer.transform([query])
