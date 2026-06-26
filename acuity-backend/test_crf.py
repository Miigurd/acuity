import sys
import os
import json

# Add the acuity-backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../acuity-backend')))

from acuity.extraction.ner_crf import extract_entities

sample_post = """FRESHWATER AQUATIC PET KEEPING SUPPLIES AND ACCESORIES AVAILABLE
WE ARE ALWAYS OPEN FROM MONDAY TO SUNDAY!
10AM TO 8PM! SEE YOU PO 
84 Manila South Road Brgy Pulo Cabuyao Laguna
LOCATION IS ALSO AVAILABLE VIA WAZE AND GOOGLE MAP!!
EM EM AQUATIC
THIS IS OUR OFFICIAL PAGE
TRUSTED FOR YOUR AQUATIC PET KEEPING NEEDS
10am to 8pm MONDAY to SUNDAY
WE OFFER AQUATIC PET KEEPING ACCESORIES AND MORE
YES WE ARE OPEN EVERYDAY, MONDAY TO SUNDAY UP TO 8PM
  
COME AND VISIT US FOR EXCLUSIVE DEALS AND PROMOS
Aquarium Filter and Pump
Aquarium Hose and Connectors
Trickle Filter
Air Stones 
Fish Net
Aquarium Heater
Aquatic Plants
Aqua Soil
Rocks and Pebbles
Water Conditioners
Fish Medicine and Vitamins
Fish Foods
Filter Medias
Aquarium And Stand
Aquarium LED light
Decorations and Wallpaper
Artificial Plants
Aquatic Tropical Freshwater"""

print("Running CRF Model on Sample Post:")
print(f"Post: '{sample_post}'\n")

try:
    results = extract_entities(sample_post)
    print(json.dumps(results, indent=2))
except Exception as e:
    print(f"Error running model: {e}")
