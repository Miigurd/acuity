import json

with open('data/processed/frontend_businesses.json', 'r', encoding='utf-8') as f:
    orig = json.load(f)
with open('data/processed/frontend_businesses_normalized.json', 'r', encoding='utf-8') as f:
    crf = json.load(f)
with open('data/processed/frontend_businesses_normalized_transformer.json', 'r', encoding='utf-8') as f:
    trans = json.load(f)

def to_list(val):
    if val is None: return []
    if isinstance(val, list): return val
    return [str(val)]

# Stats we care about:
# 1. Total extracted categories
# 2. Total extracted locations
# 3. Total assigned landmarkIds
# 4. Total business names that differ from original (meaning NLP extracted a name that overrode or was used instead)

def get_stats(normalized, name_lbl):
    gained_cats = 0
    gained_locs = 0
    total_landmarks = 0
    gained_names = 0
    
    total_extracted_locs = 0
    total_extracted_cats = 0

    for o, n in zip(orig, normalized):
        o_locs = to_list(o.get('locations')) + to_list(o.get('address'))
        n_locs = to_list(n.get('locations'))
        
        # how many entities extracted by NLP alone?
        # Well, the lists in the normalized json include original ones.
        # But we can measure the 'gain' easily.
        if len(n_locs) > len(o_locs):
            gained_locs += 1
            
        o_cats = to_list(o.get('categories')) + to_list(o.get('categoryId'))
        n_cats = to_list(n.get('categories'))
        if len(n_cats) > len(o_cats):
            gained_cats += 1
            
        if n.get('landmarkId'):
            total_landmarks += 1
            
        o_name = str(o.get('name') or o.get('business_name') or "")
        n_name = str(n.get('name') or "")
        
        # If NLP extracted a name, the script does `profile.get('business_name') or orig_name`. 
        # We can just see if n_name differs from o_name, and n_name is not empty
        if n_name and n_name != o_name and n_name != "None":
            gained_names += 1
            
    print(f"--- {name_lbl} ---")
    print(f"Entries that gained new locations: {gained_locs}")
    print(f"Entries that gained new categories: {gained_cats}")
    print(f"Entries that gained a new business name: {gained_names}")
    print(f"Total entries successfully mapped to a landmark ID: {total_landmarks} / 139")
    print()

get_stats(crf, "CRF Model")
get_stats(trans, "Transformer Model")

# Let's also print some examples where they differ
print("--- Qualitative Differences (Locations) ---")
diff_count = 0
for i, (o, c, t) in enumerate(zip(orig, crf, trans)):
    c_locs = to_list(c.get('locations'))
    t_locs = to_list(t.get('locations'))
    o_locs = to_list(o.get('locations')) + to_list(o.get('address'))
    
    # Just filter out the originals to see pure NLP extractions
    c_pure = [l for l in c_locs if l not in o_locs]
    t_pure = [l for l in t_locs if l not in o_locs]
    
    if set(c_pure) != set(t_pure):
        diff_count += 1
        if diff_count <= 5: # show first 5
            print(f"Entry {i}:")
            print(f"  Original Address : {o.get('address') or o.get('locations')}")
            print(f"  CRF extracted    : {c_pure}")
            print(f"  Trans extracted  : {t_pure}")

print(f"\nTotal entries with different location extractions: {diff_count}")

