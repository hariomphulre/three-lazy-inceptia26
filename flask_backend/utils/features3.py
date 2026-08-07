def extract_features(row):
    """
    Extract Test-4 (Emotion) data from DB row
    DB order (from fetch):
    ...
    index 24-27 : test4_q1, q2, q3, q4
    index 28-31 : test4_q1_time, q2_time, q3_time, q4_time
    """

    q1 = row[24]
    q2 = row[25]
    q3 = row[26]
    q4 = row[27]

    t1 = row[28]
    t2 = row[29]
    t3 = row[30]
    t4 = row[31]

    # convert to binary
    q1 = 1 if float(q1 or 0) >= 0.5 else 0
    q2 = 1 if float(q2 or 0) >= 0.5 else 0
    q3 = 1 if float(q3 or 0) >= 0.5 else 0
    q4 = 1 if float(q4 or 0) >= 0.5 else 0

    # convert ms → sec
    t1 = float(t1 or 0) / 1000
    t2 = float(t2 or 0) / 1000
    t3 = float(t3 or 0) / 1000
    t4 = float(t4 or 0) / 1000

    return [q1, q2, q3, q4, t1, t2, t3, t4]
