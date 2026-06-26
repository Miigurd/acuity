"""
ACUITY — Scraper Configuration
Centralized settings for the Facebook scraper module.
"""
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()


# ---------------------------------------------------------------------------
# Chrome / Driver Settings
# ---------------------------------------------------------------------------
CHROME_USER_DATA_DIR = os.getenv(
    "CHROME_USER_DATA_DIR",
    os.path.abspath("./data/chrome_session"),
)
CHROME_VERSION_MAIN = int(os.getenv("CHROME_VERSION_MAIN", "149"))

# ---------------------------------------------------------------------------
# Scraping Behaviour
# ---------------------------------------------------------------------------
DEFAULT_MAX_POSTS = int(os.getenv("DEFAULT_MAX_POSTS", "500"))
DEFAULT_SCROLL_DELAY = int(os.getenv("DEFAULT_SCROLL_DELAY", "4"))
INITIAL_LOAD_DELAY = 5          # seconds to wait after page navigation
MIN_POST_LENGTH = 100           # minimum character length to consider a post

# ---------------------------------------------------------------------------
# Target URLs
# ---------------------------------------------------------------------------
TARGET_URLS = [
    url.strip()
    for url in os.getenv("TARGET_URLS", "").split(",")
    if url.strip()
]

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
RAW_DATA_DIR = os.path.abspath("./data/raw")
