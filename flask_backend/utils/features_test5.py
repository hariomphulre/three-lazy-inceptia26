import numpy as np

def extract_features(row):
    rts = [row[15], row[16], row[17], row[18], row[19]]
    rts = [800 if x is None else float(x) for x in rts]

    mean_rt = np.mean(rts)
    var_rt = np.std(rts)
    missed = sum(1 for x in rts if x >= 800)
    impulsive = sum(1 for x in rts if x < 150)
    slow = sum(1 for x in rts if x > 600)

    q2_time = row[20] if row[20] is not None else 8
    q2_score = row[21] if row[21] is not None else 0
    q3_time = row[22] if row[22] is not None else 8
    q3_score = row[23] if row[23] is not None else 0

    return [
        mean_rt,
        var_rt,
        missed,
        impulsive,
        slow,
        q2_time,
        q2_score,
        q3_time,
        q3_score
    ]
