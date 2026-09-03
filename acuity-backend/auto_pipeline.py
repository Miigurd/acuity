import os
import subprocess
import sys
import time

def main():
    print("==================================================")
    print("       ACUITY AUTOMATED PIPELINE (6-MONTH)        ")
    print("==================================================")
    
    # 1. Run the Scraper
    # We will modify the run_scraper to be headless by passing a flag or modifying it here.
    print("\n>>> STEP 1: Running Scraper (Headless)...")
    from acuity.scraper.scraper import FacebookScraper, ScraperConfig
    
    urls_file = "urls.txt"
    if not os.path.exists(urls_file):
        print(f"Error: {urls_file} not found.")
        return

    with open(urls_file, "r", encoding="utf-8") as f:
        target_urls = [line.strip() for line in f if line.strip()]
        
    # Proxy for testing
    # Set to 5 posts per URL to quickly verify the pipeline
    MAX_POSTS_6_MONTHS = 5
    
    absolute_data_dir = os.path.abspath("data/chrome_session")
    os.makedirs(absolute_data_dir, exist_ok=True)
    
    config = ScraperConfig(
        chrome_user_data_dir=absolute_data_dir,
        chrome_version_main=None,  # Let undetected-chromedriver auto-detect
        max_posts=MAX_POSTS_6_MONTHS 
    )
    scraper = FacebookScraper(config=config)
    
    try:
        # Run headless=True as requested
        posts = scraper.run(target_urls=target_urls, headless=True)
        print(f"Scraped {len(posts)} total posts.")
    except Exception as e:
        print(f"Scraper encountered an issue: {e}")
        print("Proceeding with whatever data was captured...")

    # 2. Run the Processing Pipeline
    print("\n>>> STEP 2: Running NLP Processing Pipeline...")
    import process_new_posts
    try:
        process_new_posts.main()
    except Exception as e:
        print(f"Error in processing pipeline: {e}")
        
    # 3. Migrate/Upload to Database (Supabase)
    print("\n>>> STEP 3: Uploading to Database (Safe Update)...")
    import pipeline_db_update
    try:
        pipeline_db_update.update_database()
    except Exception as e:
        print(f"Error updating DB: {e}")

    print("\n==================================================")
    print("             PIPELINE RUN COMPLETE                ")
    print("==================================================")

if __name__ == "__main__":
    main()
