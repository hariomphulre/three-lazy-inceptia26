import os

import joblib

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "dysgraphia.pkl")

labels = ["Normal", "Low Risk", "Medium Risk", "High Risk", "Slow Learner"]

_model = None


def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"Dysgraphia model not found at {MODEL_PATH}. "
                "The trained model files are not included in this repo (see .gitignore); "
                "obtain the models/ directory or run train_dysgraphia.py to regenerate it."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def predict(features):
    model = get_model()
    probs = model.predict_proba([features])[0]
    pred = probs.argmax()

    return {
        "prediction": labels[pred],
        "confidence": round(float(probs[pred]) * 100, 2),
        "probabilities": {
            labels[i]: round(float(probs[i]) * 100, 2)
            for i in range(len(labels))
        }
    }
