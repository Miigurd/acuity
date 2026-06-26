# ACUITY - Monorepo

**A**utomated **C**ommunity **U**nstructured **I**nformation to **T**argeted visibilit**Y**

This repository contains the complete software suite for the ACUITY project: a machine learning-based recommendation framework for enhancing digital visibility of local micro-enterprises in Barangay Banay-Banay, Cabuyao City, Laguna.

## Repository Structure

This project is organized as a monorepo containing three distinct applications:

*   **`acuity-backend/`**: The core Python API, NLP extraction pipeline (NER), and machine learning recommendation engine (TF-IDF vectorization & cosine similarity)
*   **`acuity-frontend/`**: The React-based web application for residents seeking local services and business owners managing their digital footprint.
*   **`acuity-admin/`**: The Vite + React administrative dashboard used for registry management, flagged profiles, and verification queues.

## Getting Started

Because this is a monorepo, each sub-project has its own dependencies and run commands. Please refer to the specific `README.md` file inside each directory for setup instructions:

*   [Backend Setup Instructions](./acuity-backend/README.md)
*   [Frontend Setup Instructions](./acuity-frontend/README.md)
*   [Admin Setup Instructions](./acuity-admin/README.md)

## License

This project is part of an academic thesis, College of Computing Studies.
