import os

import torch
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pt")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

THRESHOLD = 0.0778   # from training


class Autoencoder(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = torch.nn.Sequential(
            torch.nn.Linear(5,16), torch.nn.ReLU(),
            torch.nn.Linear(16,8), torch.nn.ReLU(),
            torch.nn.Linear(8,3)
        )
        self.decoder = torch.nn.Sequential(
            torch.nn.Linear(3,8), torch.nn.ReLU(),
            torch.nn.Linear(8,16), torch.nn.ReLU(),
            torch.nn.Linear(16,5)
        )

    def forward(self,x):
        return self.decoder(self.encoder(x))


_model = None
_scaler = None


def _load():
    global _model, _scaler
    if _model is None or _scaler is None:
        for path in (MODEL_PATH, SCALER_PATH):
            if not os.path.exists(path):
                raise RuntimeError(
                    f"Reading-disability model file not found at {path}. "
                    "The trained model files are not included in this repo (see .gitignore); "
                    "obtain the models/ directory (autoencoder.pt + scaler.pkl) to enable this endpoint."
                )
        model = Autoencoder()
        model.load_state_dict(torch.load(MODEL_PATH))
        model.eval()
        _model = model
        _scaler = joblib.load(SCALER_PATH)
    return _model, _scaler


def predict(features):
    model, scaler = _load()
    x = np.array([[
        features["avg_pause"],
        features["max_pause"],
        features["pause_count"],
        features["wpm"],
        features["total_words"]
    ]])

    x = scaler.transform(x)
    x = torch.tensor(x, dtype=torch.float32)

    with torch.no_grad():
        recon = model(x)
        error = torch.mean((x - recon)**2).item()

    return {
        "LD_score": error,
        "threshold": THRESHOLD,
        "status": "ABNORMAL" if error > THRESHOLD else "NORMAL"
    }
