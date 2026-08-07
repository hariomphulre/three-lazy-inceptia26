import random
import pandas as pd

def generate_child(label):
    data = {}

    if label == "Normal":
        acc_prob = [0.9, 0.9, 0.85, 0.85]
        rt_range = (1.0, 3.0)

    elif label == "LessSocial":
        acc_prob = [0.75, 0.7, 0.6, 0.6]
        rt_range = (3.0, 6.0)

    else:  # Disability (Autism-like)
        acc_prob = [0.6, 0.5, 0.35, 0.3]
        rt_range = (5.0, 12.0)

    emotions = ["happy", "sad", "angry", "crying"]

    for i, emo in enumerate(emotions):
        data[f"{emo}_correct"] = 1 if random.random() < acc_prob[i] else 0
        data[f"{emo}_rt"] = round(random.uniform(*rt_range), 2)

    data["label"] = label
    return data

def generate_dataset(n=1000):
    dataset = []

    for _ in range(n):
        label = random.choice(["Normal", "LessSocial", "Disability"])
        dataset.append(generate_child(label))

    return pd.DataFrame(dataset)

# Generate dataset
df = generate_dataset(3000)

# Save
df.to_csv("emotion_social_dataset.csv", index=False)

print(df.head())
