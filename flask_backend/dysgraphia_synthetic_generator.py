import numpy as np
import pandas as pd

np.random.seed(42)

def generate_child(label):
    # Latent cognitive traits
    if label == 0:      # Normal
        speed = np.random.normal(1.0, 0.1)
        attention = np.random.normal(1.0, 0.1)
        memory = np.random.normal(1.0, 0.1)
        motor = np.random.normal(1.0, 0.1)
        fatigue = np.random.normal(0.05, 0.02)

    elif label == 1:    # Low risk
        speed = np.random.normal(0.9, 0.1)
        attention = np.random.normal(0.9, 0.1)
        memory = np.random.normal(0.9, 0.1)
        motor = np.random.normal(0.9, 0.1)
        fatigue = np.random.normal(0.08, 0.02)

    elif label == 2:    # Medium
        speed = np.random.normal(0.75, 0.1)
        attention = np.random.normal(0.75, 0.1)
        memory = np.random.normal(0.75, 0.1)
        motor = np.random.normal(0.75, 0.1)
        fatigue = np.random.normal(0.12, 0.03)

    elif label == 3:    # High
        speed = np.random.normal(0.6, 0.1)
        attention = np.random.normal(0.6, 0.1)
        memory = np.random.normal(0.6, 0.1)
        motor = np.random.normal(0.6, 0.1)
        fatigue = np.random.normal(0.18, 0.04)

    else:              # Slow learner
        speed = np.random.normal(0.45, 0.1)
        attention = np.random.normal(0.45, 0.1)
        memory = np.random.normal(0.45, 0.1)
        motor = np.random.normal(0.45, 0.1)
        fatigue = np.random.normal(0.25, 0.05)

    acc = []
    times = []

    base_time = 2.5 / speed

    for i in range(6):
        difficulty = 1 + 0.15 * i

        p_correct = (
            0.4 * attention +
            0.3 * memory +
            0.3 * motor
        ) / difficulty

        p_correct = np.clip(p_correct, 0.05, 0.98)

        acc.append(np.random.binomial(1, p_correct))

        t = base_time * difficulty * (1 + fatigue * i)
        t += np.random.normal(0, 0.3)

        times.append(max(t, 1.0))

    return acc + times

# Generate dataset
rows = []
labels = []

for label in range(5):
    for _ in range(300):
        rows.append(generate_child(label))
        labels.append(label)

columns = (
    [f"test1_q{i+1}" for i in range(6)] +
    [f"test1_q{i+1}_time" for i in range(6)]
)

df = pd.DataFrame(rows, columns=columns)
df["label"] = labels

df.to_csv("realistic_synthetic_dysgraphia.csv", index=False)

print("Dataset created:", df.shape)
