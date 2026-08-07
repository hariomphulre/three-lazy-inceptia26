import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "emotion_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models", "label_encoder.pkl")

_model = None
_encoder = None


def _load():
    global _model, _encoder
    if _model is None or _encoder is None:
        for path in (MODEL_PATH, ENCODER_PATH):
            if not os.path.exists(path):
                raise RuntimeError(
                    f"Emotion model file not found at {path}. "
                    "The trained model files are not included in this repo (see .gitignore); "
                    "obtain the models/ directory (emotion_model.pkl + label_encoder.pkl) to enable this endpoint."
                )
        _model = joblib.load(MODEL_PATH)
        _encoder = joblib.load(ENCODER_PATH)
    return _model, _encoder


def predict(features):
    """
    features = [happy, sad, angry, crying, happy_rt, sad_rt, angry_rt, crying_rt]
    """
    model, encoder = _load()

    X = np.array(features).reshape(1, -1)

    pred = model.predict(X)[0]
    probs = model.predict_proba(X)[0]

    label = encoder.inverse_transform([pred])[0]
    confidence = float(max(probs)) * 100

    return {
        "result": label,
        "confidence": round(confidence, 2)
    }
