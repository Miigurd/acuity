def levenshtein_ratio(s1: str, s2: str) -> float:
    """Calculate 1-to-1 levenshtein ratio"""
    if not s1 or not s2:
        return 0.0
    
    rows = len(s1) + 1
    cols = len(s2) + 1
    distance = [[0 for _ in range(cols)] for _ in range(rows)]
    
    for i in range(1, rows):
        distance[i][0] = i
    for k in range(1, cols):
        distance[0][k] = k
        
    for col in range(1, cols):
        for row in range(1, rows):
            cost = 0 if s1[row-1] == s2[col-1] else 1
            distance[row][col] = min(
                distance[row-1][col] + 1,      # Deletion
                distance[row][col-1] + 1,      # Insertion
                distance[row-1][col-1] + cost  # Substitution
            )
                                     
    max_len = max(len(s1), len(s2))
    if max_len == 0:
        return 1.0
    return 1.0 - (distance[len(s1)][len(s2)] / max_len)

def levenshtein_details(s1: str, s2: str) -> dict:
    """Calculate levenshtein ratio and return details"""
    if not s1 or not s2:
        return {"score": 0.0, "edits": 0, "max_len": 0}
    
    rows = len(s1) + 1
    cols = len(s2) + 1
    distance = [[0 for _ in range(cols)] for _ in range(rows)]
    
    for i in range(1, rows):
        distance[i][0] = i
    for k in range(1, cols):
        distance[0][k] = k
        
    for col in range(1, cols):
        for row in range(1, rows):
            cost = 0 if s1[row-1] == s2[col-1] else 1
            distance[row][col] = min(
                distance[row-1][col] + 1,
                distance[row][col-1] + 1,
                distance[row-1][col-1] + cost
            )
                                     
    max_len = max(len(s1), len(s2))
    if max_len == 0:
        return {"score": 1.0, "edits": 0, "max_len": 0}
    edits = distance[len(s1)][len(s2)]
    return {"score": 1.0 - (edits / max_len), "edits": edits, "max_len": max_len}
