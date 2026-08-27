import os
from acuity.scraper.scraper import FacebookScraper

def main():
    # Read URLs from urls.txt
    urls_file = "urls.txt"
    if not os.path.exists(urls_file):
        print(f"Error: {urls_file} not found.")
        return

    with open(urls_file, "r", encoding="utf-8") as f:
        target_urls = [line.strip() for line in f if line.strip()]

    print(f"Found {len(target_urls)} URLs to scrape.")

    if not target_urls:
        print("No URLs found in urls.txt. Exiting.")
        return

    # Initialize the scraper with an absolute path for the Chrome session
    print("Initializing Facebook Scraper...")
    from acuity.scraper.scraper import ScraperConfig
    absolute_data_dir = os.path.abspath("data/chrome_session")
    os.makedirs(absolute_data_dir, exist_ok=True)
    
    config = ScraperConfig(
        chrome_user_data_dir=absolute_data_dir,
        chrome_version_main=None  # Auto-detect Chrome version
    )
    scraper = FacebookScraper(config=config)

    # Run the scraper
    # We set max_posts to a small number for testing purposes
    print("Starting scrape process...")
    posts = scraper.run(
        target_urls=target_urls,
        headless=False,
        max_posts=1  # Adjust this as needed for testing
    )

    print(f"\nScraping complete. Successfully scraped {len(posts)} posts.")
    
    # Just print the first few posts to verify it works
    print("\n--- Sample Output ---")
    for i, post in enumerate(posts[:3]):
        print(f"\nPost {i+1}:")
        print(f"URL: {post.get('source_url', 'N/A')}")
        print(f"Text: {post.get('text', 'N/A')[:100]}...")

    # NOTE: Code to save to data/raw/posts.csv is omitted for now 
    # until you verify this works!

if __name__ == "__main__":
    main()
