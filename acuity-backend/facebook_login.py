import time
import os
import undetected_chromedriver as uc

def main():
    absolute_data_dir = os.path.abspath("data/chrome_session")
    os.makedirs(absolute_data_dir, exist_ok=True)
    
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    
    print(f"Opening Chrome with session dir: {absolute_data_dir}")
    driver = uc.Chrome(
        options=options,
        user_data_dir=absolute_data_dir
    )
    
    driver.get("https://www.facebook.com")
    print("Please log into Facebook in the opened browser window.")
    print("You have 60 seconds. The session will save automatically...")
    
    time.sleep(60)
    driver.quit()
    print("Session saved! You can now run the scraper.")

if __name__ == "__main__":
    main()
