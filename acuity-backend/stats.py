import json

orig = json.load(open('data/processed/frontend_businesses.json', encoding='utf-8'))
norm = json.load(open('data/processed/frontend_businesses_normalized.json', encoding='utf-8'))

def to_list(val):
    if val is None: return []
    if isinstance(val, list): return val
    return [str(val)]

gained_phone = 0
gained_price = 0
gained_location = 0
gained_any = 0

for o, n in zip(orig, norm):
    o_phones = to_list(o.get('phones')) + to_list(o.get('contact'))
    n_phones = to_list(n.get('phones'))
    gp = len(n_phones) > len(o_phones)
    if gp: gained_phone += 1
    
    o_prices = to_list(o.get('prices'))
    n_prices = to_list(n.get('prices'))
    gpr = len(n_prices) > len(o_prices)
    if gpr: gained_price += 1
    
    o_locs = to_list(o.get('locations')) + to_list(o.get('address'))
    n_locs = to_list(n.get('locations'))
    gl = len(n_locs) > len(o_locs)
    if gl: gained_location += 1
    
    if gp or gpr or gl: gained_any += 1

print(f'Gained phones: {gained_phone}')
print(f'Gained prices: {gained_price}')
print(f'Gained locations: {gained_location}')
print(f'Total entries that gained at least one: {gained_any}')
