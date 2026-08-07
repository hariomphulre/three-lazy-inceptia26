import os

import joblib

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "test6_model.pkl")

_model = None


def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"test6 model not found at {MODEL_PATH}. "
                "The trained model files are not included in this repo (see .gitignore); "
                "obtain the models/ directory or run train_test6_model.py (needs test6_synthetic.csv) to regenerate it."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_test6(features):
    model = get_model()
    return model.predict([features])[0]
