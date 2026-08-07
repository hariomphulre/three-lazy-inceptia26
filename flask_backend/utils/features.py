import numpy as np

def extract_features(row):
    # Math answers
    q = np.array(row[0:6], dtype=float)

    # Math reaction times
    t = np.array(row[6:12], dtype=float)

    accuracy = np.mean(q)
    mean_time = np.mean(t)
    std_time = np.std(t)
    fatigue = t[5] - t[0]
    switch_cost = np.mean(t[3:6]) - np.mean(t[0:3])
    efficiency = accuracy / max(mean_time, 0.1)

    count_error = 1 - q[0]
    compare_error = 1 - q[1]
    add_error = 1 - q[3]
    money_error = 1 - q[4]
    subtract_error = 1 - q[5]

    return [
        accuracy,
        mean_time,
        std_time,
        fatigue,
        switch_cost,
        efficiency,
        count_error,
        compare_error,
        add_error,
        money_error,
        subtract_error
    ]
