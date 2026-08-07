import numpy as np

def extract_features(row):
    # raw scores
    s = list(row[22:26])
    t = list(row[26:30])

    # replace None with safe defaults
    # if time missing → assume slow (8 sec)
    t = [8 if x is None else float(x) for x in t]

    # if score missing → treat as wrong
    s = [0 if x is None else int(x) for x in s]

    avg = np.mean(t)
    var = np.std(t)
    impulsivity = 1 / avg
    visual = (s[0] + s[2]) / 2
    logic = s[3]
    memory = s[1]

    return [
        s[0], s[1], s[2], s[3],
        t[0], t[1], t[2], t[3],
        avg, var, impulsivity, visual, logic, memory
    ]
