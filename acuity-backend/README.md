# ACUITY

**A**utomated **C**ommunity **U**nstructured **I**nformation to **T**argeted visibilit**Y**

A machine learning-based recommendation framework for enhancing digital visibility of local micro-enterprises in Barangay Banay-Banay, Cabuyao City, Laguna.

## Overview

ACUITY transforms unstructured Facebook community group posts into structured, searchable business profiles and delivers proximity-aware recommendations to residents seeking local services.

### Core Modules

| Module | Description |
|---|---|
| `scraper/` | Facebook community group data collection via undetected_chromedriver |
| `extraction/` | NLP pipeline — NER + rule-based extraction for business information |
| `recommender/` | TF-IDF vectorization + cosine similarity + Haversine proximity ranking |
| `webapp/` | Standalone web application for residents and business owners |

## Quick Start

```bash
# 1. Clone and set up
git clone <repo-url>
cd acuity
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Login to Facebook (one-time, saves session)
python -m scraper.login

# 4. Scrape community group posts
python -m scraper.scraper <facebook-group-url>

# 5. Run extraction pipeline
python -m extraction.pipeline

# 6. Launch web app
python -m webapp.app
```

## Project Structure

```
acuity/
├── scraper/          # Data collection from Facebook
├── extraction/       # NLP extraction pipeline
├── recommender/      # Recommendation engine
├── webapp/           # Web application
├── data/             # Raw, processed data & models (gitignored)
├── tests/            # Test suite
├── notebooks/        # Jupyter experimentation notebooks
└── docs/             # Documentation & thesis artifacts
```

## Tech Stack

- **Python 3.11+**
- **Selenium + undetected_chromedriver** — stealth browser automation
- **spaCy / transformers** — NER for business entity extraction
- **scikit-learn** — TF-IDF vectorization & cosine similarity
- **Flask / FastAPI** — web application framework
- **SQLite / PostgreSQL** — structured business profile storage

## License

This project is part of an academic thesis, College of Computing Studies.
