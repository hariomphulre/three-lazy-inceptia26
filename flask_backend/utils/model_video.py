"""
model.py — Production Model Definitions
Child Learning Disability Detection System
Models: Emotion, ASD, ADHD, Engagement, Stress, Attention, Gaze, Hyperactivity
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import onnxruntime as ort

# ─────────────────────────────────────────────────────────────────
# LABEL DEFINITIONS (ground truth for all tasks)
# ─────────────────────────────────────────────────────────────────

EMOTION_LABELS    = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
ENGAGEMENT_LABELS = ["engaged", "not_engaged", "bored", "confused"]
ASD_LABELS        = ["non_autism", "autism"]
ADHD_LABELS       = ["non_adhd", "adhd"]
STRESS_LABELS     = ["low", "medium", "high"]
ATTENTION_LABELS  = ["attentive", "distracted"]
HYPERACT_LABELS   = ["normal", "slightly_hyperactive", "hyperactive"]
GAZE_LABELS       = ["forward", "looking_away", "looking_down"]


# ─────────────────────────────────────────────────────────────────
# FOCAL LOSS (handles class imbalance)
# ─────────────────────────────────────────────────────────────────

class FocalLoss(nn.Module):
    def __init__(self, alpha: float = 1.0, gamma: float = 2.0, reduction: str = "mean"):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce = F.cross_entropy(inputs, targets, reduction="none")
        pt = torch.exp(-ce)
        loss = self.alpha * (1 - pt) ** self.gamma * ce
        return loss.mean() if self.reduction == "mean" else loss.sum()


# ─────────────────────────────────────────────────────────────────
# SQUEEZE-EXCITATION BLOCK (attention over channels)
# ─────────────────────────────────────────────────────────────────

class SEBlock(nn.Module):
    def __init__(self, channels: int, reduction: int = 16):
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.shape
        y = self.pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y


# ─────────────────────────────────────────────────────────────────
# SHARED FEATURE EXTRACTOR
# ─────────────────────────────────────────────────────────────────

class SharedBackbone(nn.Module):
    """
    Shared CNN backbone + feature projection.
    Used by the multitask model.
    """
    def __init__(self, backbone_name: str = "efficientnet_b3", pretrained: bool = True,
                 output_dim: int = 256):
        super().__init__()
        self.encoder = timm.create_model(backbone_name, pretrained=pretrained,
                                          num_classes=0, global_pool="avg")
        feat_dim = self.encoder.num_features

        self.projector = nn.Sequential(
            nn.Linear(feat_dim, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(0.4),
            nn.Linear(512, output_dim),
            nn.LayerNorm(output_dim),
            nn.GELU(),
            nn.Dropout(0.25),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        raw = self.encoder(x)
        return self.projector(raw)


# ─────────────────────────────────────────────────────────────────
# TASK HEAD (reusable classification head)
# ─────────────────────────────────────────────────────────────────

class TaskHead(nn.Module):
    def __init__(self, in_dim: int, num_classes: int, hidden: int = 128,
                 dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.BatchNorm1d(hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


# ─────────────────────────────────────────────────────────────────
# MULTITASK MODEL (Main Production Model)
# ─────────────────────────────────────────────────────────────────

class DisabilityDetectionModel(nn.Module):
    """
    Multi-task model for child learning disability detection.

    Outputs (all logits, apply softmax for probabilities):
      - emotion:       7 classes  (angry/disgust/fear/happy/neutral/sad/surprise)
      - engagement:    4 classes  (engaged/not_engaged/bored/confused)
      - asd:           2 classes  (non_autism/autism)
      - adhd:          2 classes  (non_adhd/adhd)
      - stress:        3 classes  (low/medium/high)
      - attention:     2 classes  (attentive/distracted)
      - hyperactivity: 3 classes  (normal/slightly_hyperactive/hyperactive)
      - gaze:          3 classes  (forward/looking_away/looking_down)
    """

    TASKS = {
        "emotion":       (EMOTION_LABELS,    7),
        "engagement":    (ENGAGEMENT_LABELS, 4),
        "asd":           (ASD_LABELS,        2),
        "adhd":          (ADHD_LABELS,       2),
        "stress":        (STRESS_LABELS,     3),
        "attention":     (ATTENTION_LABELS,  2),
        "hyperactivity": (HYPERACT_LABELS,   3),
        "gaze":          (GAZE_LABELS,       3),
    }

    def __init__(self, backbone: str = "efficientnet_b3", pretrained: bool = True,
                 feat_dim: int = 256):
        super().__init__()
        self.backbone = SharedBackbone(backbone, pretrained, feat_dim)

        # Build one head per task
        self.heads = nn.ModuleDict({
            task: TaskHead(feat_dim, n_classes)
            for task, (_, n_classes) in self.TASKS.items()
        })

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        feats = self.backbone(x)
        return {task: head(feats) for task, head in self.heads.items()}

    def predict(self, x: torch.Tensor) -> Dict[str, Dict]:
        """Returns human-readable predictions with probabilities."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)

        results = {}
        for task, task_logits in logits.items():
            probs = F.softmax(task_logits, dim=-1)
            pred_idx = probs.argmax(dim=-1).item()
            labels, _ = self.TASKS[task]
            results[task] = {
                "prediction": labels[pred_idx],
                "confidence": round(probs[0, pred_idx].item(), 4),
                "probabilities": {
                    label: round(probs[0, i].item(), 4)
                    for i, label in enumerate(labels)
                }
            }
        return results


# ─────────────────────────────────────────────────────────────────
# LIGHTWEIGHT SINGLE-TASK MODELS (for specialized inference)
# ─────────────────────────────────────────────────────────────────

class EmotionModel(nn.Module):
    """Dedicated emotion recognition model — fast, lightweight."""
    LABELS = EMOTION_LABELS

    def __init__(self, backbone: str = "mobilenetv3_small_100", pretrained: bool = True):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=pretrained, num_classes=0)
        feat_dim = self.backbone.num_features
        self.classifier = nn.Sequential(
            nn.Linear(feat_dim, 256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, len(self.LABELS))
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.backbone(x))


class ASDModel(nn.Module):
    """Binary ASD detection model."""
    LABELS = ASD_LABELS

    def __init__(self, backbone: str = "efficientnet_b0", pretrained: bool = True):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=pretrained, num_classes=0)
        feat_dim = self.backbone.num_features
        self.classifier = nn.Sequential(
            nn.Linear(feat_dim, 128), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(128, len(self.LABELS))
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.backbone(x))


class GazeEstimator(nn.Module):
    """
    Gaze direction estimator. Outputs:
      - yaw, pitch (continuous) for gaze vector
      - classification: forward / away / down
    """
    LABELS = GAZE_LABELS

    def __init__(self, backbone: str = "resnet34", pretrained: bool = True):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=pretrained, num_classes=0)
        feat_dim = self.backbone.num_features
        self.regressor = nn.Sequential(nn.Linear(feat_dim, 64), nn.ReLU(), nn.Linear(64, 2))
        self.classifier = nn.Sequential(nn.Linear(feat_dim, 64), nn.ReLU(), nn.Linear(64, 3))

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        feats = self.backbone(x)
        return self.regressor(feats), self.classifier(feats)


# ─────────────────────────────────────────────────────────────────
# ONNX INFERENCE RUNTIME (fast CPU inference)
# ─────────────────────────────────────────────────────────────────

class ONNXInferenceEngine:
    """
    Loads ONNX models for each task and runs fast inference.
    Falls back to PyTorch .pth if ONNX not available.
    """

    TASK_LABELS = {
        "emotion":       EMOTION_LABELS,
        "engagement":    ENGAGEMENT_LABELS,
        "asd":           ASD_LABELS,
        "adhd":          ADHD_LABELS,
        "stress":        STRESS_LABELS,
        "attention":     ATTENTION_LABELS,
        "hyperactivity": HYPERACT_LABELS,
        "gaze":          GAZE_LABELS,
    }

    def __init__(self, models_dir: str = "./models"):
        self.models_dir = Path(models_dir)
        self.sessions: Dict[str, ort.InferenceSession] = {}
        self.torch_models: Dict[str, nn.Module] = {}
        self._load_all()

    def _load_all(self):
        """Load all available ONNX or PyTorch models."""
        task_to_onnx = {
            "emotion":    "emotion_model.onnx",
            "engagement": "engagement_model.onnx",
            "asd":        "asd_model.onnx",
            "adhd":       "adhd_model.onnx",
        }

        for task, fname in task_to_onnx.items():
            onnx_path = self.models_dir / fname
            if onnx_path.exists():
                opts = ort.SessionOptions()
                opts.intra_op_num_threads = 4
                self.sessions[task] = ort.InferenceSession(
                    str(onnx_path),
                    sess_options=opts,
                    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
                )
                print(f"✅ ONNX loaded: {task}")
            else:
                print(f"⚠️  ONNX not found for {task}, will use rule-based fallback")

        # Try multitask PyTorch model
        mt_path = self.models_dir / "multitask_best.pth"
        if mt_path.exists():
            model = DisabilityDetectionModel(pretrained=False)
            ckpt = torch.load(str(mt_path), map_location="cpu")
            model.load_state_dict(ckpt["model_state_dict"], strict=False)
            model.eval()
            self.torch_models["multitask"] = model
            print("✅ PyTorch multitask model loaded")

    def _preprocess(self, face_img: np.ndarray) -> np.ndarray:
        """Normalize face image for model input."""
        img = face_img.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std  = np.array([0.229, 0.224, 0.225])
        img = (img - mean) / std
        img = np.transpose(img, (2, 0, 1))         # HWC → CHW
        return np.expand_dims(img, 0).astype(np.float32)  # NCHW

    def _softmax(self, logits: np.ndarray) -> np.ndarray:
        e = np.exp(logits - logits.max())
        return e / e.sum()

    def run(self, task: str, face_img: np.ndarray) -> Dict:
        """Run inference for a single task on a preprocessed face image."""
        labels = self.TASK_LABELS.get(task, [])
        inp = self._preprocess(face_img)

        if task in self.sessions:
            session = self.sessions[task]
            input_name = session.get_inputs()[0].name
            logits = session.run(None, {input_name: inp})[0][0]
            probs = self._softmax(logits)
            pred_idx = int(probs.argmax())
            return {
                "prediction":    labels[pred_idx] if labels else str(pred_idx),
                "confidence":    round(float(probs[pred_idx]), 4),
                "probabilities": {l: round(float(p), 4) for l, p in zip(labels, probs)},
            }

        if "multitask" in self.torch_models:
            model = self.torch_models["multitask"]
            t = torch.from_numpy(inp)
            with torch.no_grad():
                all_logits = model(t)
            if task in all_logits:
                probs_t = F.softmax(all_logits[task], dim=-1)[0]
                pred_idx = probs_t.argmax().item()
                probs = probs_t.numpy()
                return {
                    "prediction":    labels[pred_idx] if labels else str(pred_idx),
                    "confidence":    round(float(probs[pred_idx]), 4),
                    "probabilities": {l: round(float(p), 4) for l, p in zip(labels, probs)},
                }

        # Pure fallback
        return {
            "prediction": "unknown",
            "confidence": 0.0,
            "probabilities": {l: 0.0 for l in labels},
            "note": f"No model loaded for task: {task}"
        }

    def run_all(self, face_img: np.ndarray) -> Dict[str, Dict]:
        """Run all tasks on one face image."""
        return {task: self.run(task, face_img) for task in self.TASK_LABELS}


# ─────────────────────────────────────────────────────────────────
# TEMPORAL SMOOTHING (for video streams)
# ─────────────────────────────────────────────────────────────────

class TemporalSmoother:
    """
    Smooths per-frame predictions over a sliding window.
    Prevents flickering in live video analysis.
    """
    def __init__(self, window: int = 10):
        self.window = window
        self.buffers: Dict[str, List] = {}

    def update(self, task: str, probs: Dict[str, float]) -> Dict[str, float]:
        if task not in self.buffers:
            self.buffers[task] = []
        self.buffers[task].append(probs)
        if len(self.buffers[task]) > self.window:
            self.buffers[task].pop(0)

        # Average over window
        all_keys = list(probs.keys())
        avg = {k: 0.0 for k in all_keys}
        for frame_probs in self.buffers[task]:
            for k in all_keys:
                avg[k] += frame_probs.get(k, 0.0)
        n = len(self.buffers[task])
        return {k: round(v / n, 4) for k, v in avg.items()}

    def reset(self):
        self.buffers.clear()


# ─────────────────────────────────────────────────────────────────
# MODEL FACTORY
# ─────────────────────────────────────────────────────────────────

def load_model(model_class: type, checkpoint_path: str,
               device: str = "cpu", **kwargs) -> nn.Module:
    """Load a PyTorch model from a checkpoint."""
    model = model_class(**kwargs)
    ckpt = torch.load(checkpoint_path, map_location=device)
    state_dict = ckpt.get("model_state_dict", ckpt)
    model.load_state_dict(state_dict, strict=False)
    model.eval()
    return model


def get_model_info() -> Dict:
    """Return metadata about all model tasks."""
    return {
        task: {"labels": labels, "num_classes": n}
        for task, (labels, n) in DisabilityDetectionModel.TASKS.items()
    }