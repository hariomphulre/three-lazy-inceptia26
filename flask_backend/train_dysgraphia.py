import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
from utils.features import extract_features

# Load synthetic dataset
df = pd.read_csv("realistic_synthetic_dysgraphia.csv")

X_raw = df.drop("label", axis=1).values
y = df["label"].values

# Convert raw Q + Time → cognitive features
X = np.array([extract_features(row) for row in X_raw])

# Train model
model = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42)
model.fit(X, y)

joblib.dump(model, "models/dysgraphia.pkl")

print("Model trained on synthetic data")
