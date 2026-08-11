import pytest
from acuity.scraper.utils import clean_post_text, is_valid_post

def test_clean_post_text():
    print("\n\n--- SCRAPER: CLEAN TEXT TEST ---")
    
    test_cases = [
        # (input_text, expected_output)
        ("Group Banner\nLike\nComment\nShare\nThis is the actual meaningful post body that is the longest line in the scrape.\n1 hr ago", 
         "This is the actual meaningful post body that is the longest line in the scrape."),
        ("Like\nComment\nShare\nHere is a very long text that represents the real post body.\nShort", 
         "Here is a very long text that represents the real post body."),
        ("No UI elements here, just plain text from a post.", 
         "No UI elements here, just plain text from a post."),
        ("Like\nComment\nShare\nThis is a short post.\nThis line is longer than the short post but fake.", 
         "This line is longer than the short post but fake."),
        ("Like\nComment\nShare\nPost body with some unicode 𝕿𝖊𝖝𝖙 𝖍𝖊𝖗𝖊 to clean.", 
         "Post body with some unicode Text here to clean."),
        ("Like\nComment\nShare\n1 hr ago\nLine 1 is short\nLine 2 is definitely much longer and will be selected\nSee more", 
         "Line 2 is definitely much longer and will be selected"),
        ("Like\nComment\nShare\n\nEmpty lines will not be picked because they are short\nThis is the real text", 
         "Empty lines will not be picked because they are short"),
        ("Like\nComment\nShare\nA long sentence here without any other competing lines in the string.", 
         "A long sentence here without any other competing lines in the string."),
        ("Regular text without like comment or share.\nWill it just return the stripped version?", 
         "Regular text without like comment or share.\nWill it just return the stripped version?"),
        ("Like\nComment\nShare\n12 mins\nA medium sized line.\nA very very very very long line that should be picked.\nAnother short line.", 
         "A very very very very long line that should be picked.")
    ]
    
    for i, (dirty, expected) in enumerate(test_cases, 1):
        cleaned = clean_post_text(dirty)
        print(f"Case {i}: '{expected}'")
        assert cleaned == expected, f"Expected '{expected}', got '{cleaned}'"

def test_is_valid_post():
    print("\n\n--- SCRAPER: POST FILTER TEST ---")
    
    test_cases = [
        # (text, expected_valid)
        ("Hello neighbors! We just opened a new reliable plumbing service in Banay-Banay. Please visit us!", True),
        ("Too short", False), # len < 20
        ("Good morning! We have a brand new laptop for sale. DM if interested.", False), # 'for sale'
        ("LF: apartment near the plaza. Please DM me.", False), # 'lf'
        ("Check out our new restaurant menu! We deliver to Banay-Banay area.", True),
        ("Looking for a babysitter in Cabuyao area. Must be trustworthy.", False), # 'looking for'
        ("Tech Fix Cellphone Repair is open today! Visit us for free checkups.", True),
        ("fs: used shoes size 9, no issues. meet up at centro mall.", False), # 'fs', 'no issues'
        ("Laundry service now available! We pick up and deliver.", True),
        ("We are hiring! Cashier needed for sari-sari store.", False), # 'hiring'
        ("Visit Banay-Banay Water Station for your drinking water needs. Stay hydrated!", True),
        ("Naghahanap po kami ng tubero, please message me directly.", False), # 'naghahanap'
        ("Brand new items on hand! Get yours now.", False), # 'on hand'
        ("Our bakery is offering 50% discount on all cakes today! See you!", True)
    ]
    
    for i, (text, expected) in enumerate(test_cases, 1):
        res = is_valid_post(text)
        print(f"Case {i}: Valid? {res} - '{text[:30]}...'")
        assert res == expected, f"Failed case {i}: expected {expected}, got {res}"
