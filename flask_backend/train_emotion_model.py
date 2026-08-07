import os
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# -----------------------------
# Create models folder if missing
# -----------------------------
os.makedirs("models", exist_ok=True)

# -----------------------------
# Load Dataset
# -----------------------------
df = pd.read_csv("emotion_social_dataset.csv")

# -----------------------------
# Encode Labels
# -----------------------------
le = LabelEncoder()
df["label"] = le.fit_transform(df["label"])

print("Class mapping:")
for i, name in enumerate(le.classes_):
    print(f"{i} → {name}")

# -----------------------------
# Split X & Y
# -----------------------------
X = df.drop("label", axis=1)
y = df["label"]

# -----------------------------
# Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# Train Random Forest
# -----------------------------
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    random_state=42
)

print("\nTraining model...")
model.fit(X_train, y_train)

# -----------------------------
# Evaluate
# -----------------------------
y_pred = model.predict(X_test)

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=le.classes_))

print("\n=== Confusion Matrix ===")
print(confusion_matrix(y_test, y_pred))

# -----------------------------
# Save Model
# -----------------------------
joblib.dump(model, "models/emotion_model.pkl")
joblib.dump(le, "models/label_encoder.pkl")

print("\nModel saved successfully in /models/")
