"""
ACUITY — Facebook Post Scraper
Navigates to a Facebook community group page and extracts post content
using scroll-and-capture via undetected_chromedriver.

Usage:
    python -m scraper.scraper <facebook-group-url> [--headless] [--max-scrolls N]
"""
from __future__ import annotations

import argparse
import csv
import os
import time
import typing

import undetected_chromedriver as uc  # type: ignore
from selenium.webdriver.common.by import By  # type: ignore
from selenium.webdriver.support.ui import WebDriverWait  # type: ignore
from selenium.webdriver.support import expected_conditions as EC  # type: ignore

from .config import (  # type: ignore
    CHROME_USER_DATA_DIR,
    CHROME_VERSION_MAIN,
    DEFAULT_MAX_POSTS,
    DEFAULT_SCROLL_DELAY,
    INITIAL_LOAD_DELAY,
    MIN_POST_LENGTH,
    RAW_DATA_DIR,
)
from .utils import clean_post_text, is_valid_post  # type: ignore

JS_EXTRACT_TEXT = """
function getFacebookText(el) {
    if (!el) return "";
    return el.innerText.trim();
}

function getAuthorForMessage(msgNode, wrapper) {
    let curr = msgNode;
    let bound = wrapper || document.body;
    while(curr && curr !== bound) {
        let container = curr.parentElement;
        if (container) {
            let candidates = Array.from(container.querySelectorAll('h3, strong, a[role="link"]')).filter(el => {
                return (msgNode.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
            });
            if (candidates.length > 0) {
                // Find the first valid name in this immediate container context
                for (let i = 0; i < candidates.length; i++) {
                    let text = candidates[i].textContent.trim();
                    let lowerText = text.toLowerCase();
                    if (!text || text.length > 60 || lowerText === 'follow' || lowerText === 'reply' || lowerText === 'online status indicator' || lowerText.includes('is in') || /^\\+?\\s*\\d+$/.test(text) || text.length === 1) continue;
                    
                    text = text.split(/\\n|\\s*·\\s*| Follow| is in | is with | is feeling | is at | added a | updated h| shared a | was live| and\\s+\\d+\\s+others| and others/i)[0].trim();
                     if (text && text.length >= 2 && text.length < 50 && !/^\\+?\\s*\\d+$/.test(text)) return text;
                }
            }
        }
        curr = curr.parentElement;
    }
    return "Unknown";
}

let messages = document.querySelectorAll('div[data-ad-preview="message"]');
let posts = [];
let processed = new Set();

for (let i = 0; i < messages.length; i++) {
    if (processed.has(messages[i])) continue;
    
    let wrapper = messages[i];
    let foundWrapper = false;
    let posIndex = 999999;
    
    while(wrapper && wrapper.tagName && wrapper.tagName.toLowerCase() === 'div') {
        if (wrapper.hasAttribute('aria-posinset')) {
            foundWrapper = true;
            posIndex = parseInt(wrapper.getAttribute('aria-posinset'), 10) || 999999;
            break;
        }
        wrapper = wrapper.parentElement;
    }
    
    // Quick hash to ensure recycled nodes are treated as new, avoiding layout thrashing
    const getHash = (el) => {
        if (!el || !el.textContent) return "0_";
        return el.textContent.length + "_" + el.textContent.substring(0, 20).replace(/\\s+/g, '');
    };
    
    if (foundWrapper) {
        let msgsInWrapper = wrapper.querySelectorAll('div[data-ad-preview="message"]');
        let selectedText = "";
        let selectedPoster = "Unknown";
        for(let m of msgsInWrapper) {
            if (!processed.has(m)) {
                processed.add(m);
                
        let currentHash = getHash(m);
        let cachedHash = m.getAttribute('data-acuity-hash');
        let t = m.getAttribute('data-acuity-text');
        let p = m.getAttribute('data-acuity-poster');
        
        if (cachedHash !== currentHash || typeof t !== 'string') {
            t = getFacebookText(m);
            m.setAttribute('data-acuity-hash', currentHash);
            m.setAttribute('data-acuity-text', t);
            
            p = getAuthorForMessage(m, wrapper);
            m.setAttribute('data-acuity-poster', p);
        } else if (!p) {
            p = getAuthorForMessage(m, wrapper);
            m.setAttribute('data-acuity-poster', p);
        }
        
        if (t) {
            selectedText = t; // Overwrite to get the last message
            selectedPoster = p;
        }
    }
}
if (selectedText) {
    posts.push({text: selectedText, index: posIndex, poster: selectedPoster, html: selectedPoster === 'Unknown' ? wrapper.outerHTML : ''});
}
    } else {
        processed.add(messages[i]);
        let m = messages[i];
        
        let currentHash = getHash(m);
        let cachedHash = m.getAttribute('data-acuity-hash');
        let t = m.getAttribute('data-acuity-text');
        let p = m.getAttribute('data-acuity-poster');
        
        if (cachedHash !== currentHash || typeof t !== 'string') {
            t = getFacebookText(m);
            m.setAttribute('data-acuity-hash', currentHash);
            m.setAttribute('data-acuity-text', t);
            
            p = getAuthorForMessage(m, m.closest('div.x1yztbdb') || null);
            m.setAttribute('data-acuity-poster', p);
        } else if (!p) {
            p = getAuthorForMessage(m, m.closest('div.x1yztbdb') || null);
            m.setAttribute('data-acuity-poster', p);
        }
        
        if (t) posts.push({text: t, index: 999999, poster: p, html: p === 'Unknown' ? (m.closest('div.x1yztbdb') || m).outerHTML : ''});
    }
}
return posts;
"""


def run(target_urls: list[str], headless: bool = False, max_posts: int | None = None):
    """Scrape posts from a Facebook page/group URL.

    Args:
        target_urls: A list of Facebook URLs to scrape.
        headless: Run Chrome in headless mode.
        max_posts: Override the default maximum number of posts to scrape per URL.
    """
    limit_posts: int = max_posts if max_posts is not None else DEFAULT_MAX_POSTS

    print(f"Using user data directory: {CHROME_USER_DATA_DIR}")

    options = uc.ChromeOptions()
    
    # Add stability arguments to prevent renderer crashes
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    
    if headless:
        options.add_argument("--headless")

    print("Launching undetected Chrome...")
    driver = uc.Chrome(
        options=options,
        user_data_dir=CHROME_USER_DATA_DIR,
        version_main=CHROME_VERSION_MAIN,
    )

    import urllib.parse

    all_posts: list[dict[str, typing.Any]] = []

    try:
        time.sleep(2)  # Allow browser to initialise / restore session

        for target_url in target_urls:
            # Auto-apply "New Posts" sorting for groups if not already present
            if "/groups/" in target_url and "sorting_setting" not in target_url:
                parts = urllib.parse.urlparse(target_url)
                q = urllib.parse.parse_qs(parts.query)
                q['sorting_setting'] = ['CHRONOLOGICAL']
                target_url = parts._replace(query=urllib.parse.urlencode(q, doseq=True)).geturl()
                print(f"\nAuto-applied 'New Posts' filter. Updated URL: {target_url}")

            print(f"\n--- Navigating to {target_url} ---")
            driver.get(target_url)
            time.sleep(INITIAL_LOAD_DELAY)

            # Retry navigation if still on home feed
            if driver.title == "Facebook" and "facebook.com" in driver.current_url:
                print("Still on homepage. Retrying navigation to target...")
                driver.get(target_url)
                time.sleep(INITIAL_LOAD_DELAY)

            print(f"Current URL: {driver.current_url}")
            print(f"Page Title:  {driver.title}")

            if "login" in driver.current_url:
                print("Redirected to login page. Please run `python -m scraper.login` first.")
                continue

            # Wait for body to be present
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except Exception as e:
                print(f"Timeout waiting for body: {e}")
                continue

            # ---- Scroll & Scrape ------------------------------------------------
            last_height = driver.execute_script("return document.body.scrollHeight")

            print(f"Starting scrape for {target_url}...")

            posts: list[dict[str, typing.Any]] = []
            scroll_idx = 0
            while True:
                scroll_idx += 1
                print(f"Starting scroll cycle {scroll_idx}")
            
                # Smooth scroll sequence: scroll by 600px multiple times per cycle
                steps_per_cycle = 6
                for step in range(steps_per_cycle):
                    driver.execute_script("window.scrollBy(0, 600);")
                    time.sleep(0.8) # Wait for network/React to render new posts
                
                    # Click "See more" buttons before extracting
                    driver.execute_script("""
                        document.querySelectorAll('div[role="button"]:not([data-acuity-checked="true"])').forEach(btn => {
                            let text = btn.textContent;
                            if (text && text.toLowerCase().includes('see more')) {
                                try { btn.click(); btn.setAttribute('data-acuity-checked', 'true'); } catch(e) {}
                            } else {
                                btn.setAttribute('data-acuity-checked', 'true');
                            }
                        });
                    """)
                    time.sleep(0.4) # Wait for DOM text expansion
                
                    # Attempt to locate post articles using JS currently in DOM
                    extracted_data = driver.execute_script(JS_EXTRACT_TEXT)
                
                    for item in extracted_data:
                        raw_text = item.get("text", "")
                        index = item.get("index", 999999)
                        poster = item.get("poster", "Unknown")
                    
                        try:
                            text = clean_post_text(raw_text)

                            if is_valid_post(text, min_length=MIN_POST_LENGTH):
                                # Dedup by index if valid, otherwise dedup by exact text match
                                existing_post = next((p for p in posts if (p["index"] == index and index != 999999) or p["text"] == text), None)
                            
                                if existing_post:
                                    # Update if new text is longer (e.g. from a successful "See more" click expansion)
                                    if len(text) > len(existing_post["text"]):
                                        existing_post["text"] = text
                                        existing_post["poster"] = poster
                                else:
                                    posts.append({"text": text, "index": index, "poster": poster, "scraped_at": time.time(), "source_url": target_url})
                                    # Safely encode text for Windows console output
                                    display_text = text[:50].replace('\\n', ' ').encode('ascii', 'replace').decode('ascii')
                                    print(f"  Captured (Index {index}) by {poster}: {display_text}...")
                        except Exception as e:
                            print(f"  Error extracting post: {e}")
                            continue
            
                print(f"Finished cycle {scroll_idx}. Total unique posts so far: {len(posts)}")
                time.sleep(DEFAULT_SCROLL_DELAY / 2)
            
                if len(posts) >= limit_posts:
                    print(f"Reached target of {limit_posts} posts. Stopping early.")
                    break

                # Reorder all accumulated posts by their timeline sequence index to fix ordering
                posts.sort(key=lambda x: x["index"])

                # Check if we've reached the bottom
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    time.sleep(2)
                    new_height = driver.execute_script("return document.body.scrollHeight")
                    if new_height == last_height:
                        print("End of content or stuck. Stopping.")
                        break
                last_height = new_height

            # Truncate to exact limit_posts if we overshot in the last cycle
            while len(posts) > limit_posts:
                posts.pop()
            
            all_posts.extend(posts)
            print(f"Finished scraping {target_url}. Gathered {len(posts)} posts.\\n")

    except Exception as e:
        error_str = str(e)
        if "invalid session id" in error_str or "disconnected" in error_str:
            print("\nBrowser was closed manually. Stopping scrape.")
        else:
            print(f"\nError during scraping: {e}")
        print("Scraping interrupted. Evaluating partial data to save...")
    finally:
        # ---- Save Results ----------------------------------------------------
        try:
            os.makedirs(RAW_DATA_DIR, exist_ok=True)
            output_file = os.path.join(RAW_DATA_DIR, "posts.csv")

            if all_posts:
                with open(output_file, "w", newline="", encoding="utf-8-sig") as f:
                    writer = csv.DictWriter(f, fieldnames=["index", "poster", "text", "scraped_at", "source_url"])
                    writer.writeheader()
                    writer.writerows(all_posts)
                print(f"Saved {len(all_posts)} posts to {output_file} (Overwrote previous data)")
            else:
                print("No posts found.")
        except Exception as save_err:
            print(f"Failed to save results: {save_err}")

        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="ACUITY — Facebook Community Group Scraper"
    )
    parser.add_argument("urls_file", help="Path to a text file containing target Facebook URLs (one per line)")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode")
    parser.add_argument(
        "--max-posts", type=int, default=None, help="Stop after collecting this many posts per URL"
    )
    args = parser.parse_args()

    if not os.path.isfile(args.urls_file):
        print(f"Error: Could not find file {args.urls_file}")
        import sys
        sys.exit(1)
        
    with open(args.urls_file, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]
        
    if not urls:
        print("Error: No valid URLs found in the file.")
        import sys
        sys.exit(1)

    run(urls, args.headless, args.max_posts)
