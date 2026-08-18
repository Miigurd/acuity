import sys
import os
import json

# Add the acuity-backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../acuity-backend')))

from acuity.extraction.ner_transformer import extract_entities_transformer, load_transformer_model

_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'best-model'))
ner_model = load_transformer_model(_MODEL_PATH) if os.path.exists(_MODEL_PATH) else None

def extract_entities(text: str) -> dict:
    return extract_entities_transformer(text, ner_model)

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

print("Running Transformer Model on Sample Post:")
print(f"Post: '{sample_post}'\n")

def test_transformer_extraction():
    if ner_model:
        raw_results = ner_model(sample_post[:2000])
        print("--- RAW TRANSFORMER CONFIDENCE SCORES ---")
        for res in raw_results:
            print(f"Word: '{res.get('word')}' | Label: {res.get('entity_group')} | Score: {res.get('score'):.4f}")
        print("-----------------------------------------\n")
    
    results = extract_entities(sample_post)
    print("--- FINAL PIPELINE DICTIONARY ---")
    print(json.dumps(results, indent=2))
    assert isinstance(results, dict)
