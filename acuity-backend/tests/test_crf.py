import sys
import os
import json
import pytest

# Add the acuity-backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../acuity-backend')))

from acuity.extraction.ner_crf import extract_entities_crf, load_crf_model

_CRF_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../crf_model.pkl'))
_crf_model = load_crf_model(_CRF_MODEL_PATH) if os.path.exists(_CRF_MODEL_PATH) else None

def extract_entities(text: str) -> dict:
    return extract_entities_crf(text, _crf_model)

sample_posts = [
    # Original
    "4 DAYS & 3 NIGHTS of pure travel vibes From scenic spots to unforgettable experiences - sulit bawat moment! SECURE YOUR SLOT FOR ONLY ₱10,000 Limited slots lang kaya don’t wait! CBAxpress Travel and Tours - Santa Rosa Main Office got you covered easy booking, easy payment, more travel goals Ano pa hinihintay mo? Tara na! For inquiries, We are located at GFloor Target Mall, Balibago Complex, Santa Rosa Laguna Monday to Sunday 9AM-8PM Contact us: 049 5343130 09231295347 (SUN) 09543571062 (GLOBE) 09310604997 (SMART) You can also visit or inquire in our Other branch: CBAxpress Travel and Tours - Cabuyao Branch Located @ Centro Mall Barangay Pulo Cabuyao Laguna DOT ACCREDITATION NO. DOT-R4A-TTA-02087-2025",
    # 10 New
    "Thania Beauty Salon And Spa Hi ladies! Hair promo this month of July are available We're open for walk in client Home service / appointment / schedule / are available Just given of reservation fee (300.00). Yes po, para iwas po tayo sa cancel at pasaway na client Location: Blk 11 Lot 10, St. Joseph, Winfield 1, Brgy. Gulod, Cabuyao, Laguna Just kindly DM/PM me in my page: @Thania Laviña / Home Base Studio Fur Babies Lover Classic Eyelash Extension Regular Manicure Regular Pedicure Nail Gel Polish Soft Nail Extension Massage; Sweddish Massage Thai Massage Signature Massage Ear Candeling Ventussa (for appointment only) Salon Treatment Available",
    "Your vehicle is an investment — keep it protected with professional-grade car care services. At Papa P’s Auto Car Care Service, we provide premium solutions designed to maintain your vehicle’s appearance, comfort, and value. Get the glossy finish, deep shine, and long-lasting protection your vehicle deserves with our expert car care services. Paint Protection Film Ceramic Coating Nano Ceramic Tint Interior & Exterior Detailing Professional results • Trusted quality • Long-lasting protection Send us a message today for inquiries and bookings. 0936 957 9624  /  0915 142 0717 Or you may visit us at Blk 17 Lot 21 Pulo, Cabuyao, Laguna",
    "Wednesday feels better with a Sea Salt Latte The perfect balance of sweet, salty, and smooth. Just what you need to get through the week. P1 B18 L1 St. Joseph 7, Marinig, Cabuyao, Laguna Tuesday–Sunday | 3:30 PM – 12:00 MN See you at Le Café Bayan.",
    "May okasyon ka pero wala nang time magluto? Huwag na ma-stress — Tapau Kitchen Co. na bahala sa handaan mo! Masasarap na party trays perfect para sa inyong espesyal na okasyon Mapa-birthday, binyag, reunion, office meeting, family gathering, o simpleng salo-salo — siguradong busog at happy ang lahat Lutong-bahay favorites Freshly prepared Sulit at masarap Perfect pang handaan Habang ine-enjoy mo ang moments kasama ang pamilya at friends, kami naman ang bahala sa pagkain Message us now for orders & reservations 0927 936 0085 Tapau Kitchen Co. — handaan made easier",
    "Your Dream Jersey, Made Real! Basketball Full Sublimation Jersey for Every Team! ‎ ‎Body: Create the ultimate team identity with our fully customizable full sublimation jerseys! From intricate logos to bold patterns, we bring your vision to life on high-performance sportswear. ‎ ‎ Fully Customized - Your Design, Your Way! ‎ Long-lasting, vibrant colors ‎ Comfortable for peak performance ‎ Great value for teams and clubs! ‎ ‎Let's design your perfect jersey. Click the link to get started or send us a message! Located Cabuyao Laguna",
    "Available chocolate crinkles red velvet crinkles chocolate lava crinkles available po sa store Toyong's Garage Food Place We are located at Purok 5, Marinig Cabuyao Laguna 3pm onwards po delivery",
    "Sira ba ang aircon mo? Ipagawa muna sakin tiyak at garantisadong maayos ko yan kaya anong pang inaantay mo? Just message and call me na! Aircon Condition & Ref/ Washing Machine Repair Aircon Cleaning Window type & Split type Ceiling Cassete & Ceeling Concealed Floor Mounted & Floor Standing Portable Aircon Deep Clean Washing Machine Repair Freon Charging Water Leak System Reprocess Spare parts Replacements PCB Installation OTHERS; A Dismantel Relocation Re Installation We also accept repair Ref Washing Machine & automatic Washing Dryer Water Dispenser Aircooler etc.",
    "Thank You for Trusting us! Another successful DFA Passport Assistance completed! A heartfelt thank you for choosing us to assist with your passport application. We're truly grateful for your trust and are honored to make your application process smooth, hassle-free, and convenient. Your support inspires us to continue providing reliable, professional, and quality travel services. We look forward to assisting you again on your future journeys! 136 Banlic Cabuyao Laguna Have travel plans? Thank you once again for trusting us. We look forward to being part of your next adventure!",
    "First weekend of the month! Start your weekend right—ipaalaga na ang labada habang nagre-relax ka. Thank you sa lahat ng patuloy na nagtitiwala sa Ace Laundry Shop. We’re ready to serve you this weekend! ₱25 per kilo Brgy. Send us a message to book your laundry today!",
    " ",
    "OPEN @ AVAILABLE Flying Saucer(ham&cheese) HOME MADE CHEESE STICK(4pcs-₱20) TAKOYAKI na binabalikbalikan ILocos style empanada (3pm-12mid) satisfied your cravings now"
]

def test_crf_extraction():
    print("\nRunning CRF Model on Sample Posts...")
    for i, post in enumerate(sample_posts, 1):
        print(f"\n--- Test Case {i} ---")
        print(f"Post: '{post}'")
        try:
            results = extract_entities(post)
            assert isinstance(results, dict), "Result should be a dictionary"
            print(json.dumps(results, indent=2))
            
            # Check how many extracted entities got filled out
            filled_entities_count = sum(1 for v in results.values() if v)
            if filled_entities_count >= 2:
                print(f"Status: MADE INTO A BUSINESS PROFILE")
            else:
                print(f"Status: NOT MADE INTO A PROFILE")
                
        except Exception as e:
            print(f"Error running model: {e}")
            pytest.fail(f"CRF extraction failed for post {i}: {e}")
