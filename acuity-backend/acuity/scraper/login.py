"""
ACUITY — Facebook Login & Session Manager
Opens a Chrome window for manual Facebook login. The authenticated session
is persisted in the Chrome user-data directory for reuse by the scraper.

Usage:
    python -m scraper.login
"""
import time
import undetected_chromedriver as uc  # type: ignore

from .config import CHROME_USER_DATA_DIR, CHROME_VERSION_MAIN  # type: ignore


def login():
    """Launch Chrome for manual Facebook login and session persistence."""
    print(f"Using user data directory: {CHROME_USER_DATA_DIR}")
    print("Launching undetected Chrome...")

    options = uc.ChromeOptions()
    options.add_argument(f"--user-data-dir={CHROME_USER_DATA_DIR}")

    driver = uc.Chrome(options=options, version_main=CHROME_VERSION_MAIN)

    try:
        print("Navigating to Facebook...")
        driver.get("https://www.facebook.com")

        print("\n" + "=" * 50)
        print("MANUAL LOGIN MODE (Undetected)")
        print("1. Please log in to Facebook in the launched browser.")
        print("2. Complete any Two-Factor Authentication (2FA).")
        print("3. Ensure you land on the home feed.")
        print("4. Close the browser window when finished.")
        print("=" * 50 + "\n")

        # Keep script running until browser is closed
        while True:
            try:
                _ = driver.window_handles
                time.sleep(1)
            except Exception:
                break

        print("Browser closed. Session saved.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    login()
