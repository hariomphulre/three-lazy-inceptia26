"""
utils/video_analysis.py
Core video behavioral analysis — integrates with existing Flask session system.

Usage in app.py:
    from utils.video_analysis import run_video_analysis_for_session

    @app.route("/predict/video_analysis", methods=["POST"])
    @require_session
    def video_analysis(session_id, row):
        return run_video_analysis_for_session(session_id, row)
"""

import logging
import math
import time
import json
from collections import deque, Counter
from dataclasses import dataclass, field, asdict
from typing import Optional, Tuple, Dict, List

import cv2
import numpy as np
from flask import jsonify

from utils.video_download import cleanup_video, download_video_from_url

logger = logging.getLogger(__name__)

# ── MediaPipe (lazy import so app still starts if not installed) ──
try:
    import mediapipe as mp

    # mediapipe >= 0.10 moved solutions — probe and fallback
    try:
        _solutions = mp.solutions
        _ = _solutions.face_mesh          # raises AttributeError on newer builds
    except AttributeError:
        from mediapipe.python import solutions as _solutions

    _mp_face_mesh      = _solutions.face_mesh
    _mp_face_detection = _solutions.face_detection
    MEDIAPIPE_OK = True

except ImportError:
    MEDIAPIPE_OK = False
    logger.warning("MediaPipe not installed — pip install mediapipe==0.10.21")
except Exception as e:
    MEDIAPIPE_OK = False
    logger.warning("MediaPipe init failed: %s", e)

# ── Deep-learning inference engine (optional) ─────────────────────
try:
    import onnxruntime as ort
    import torch
    import torch.nn.functional as F
    ONNX_OK = True
except ImportError:
    ONNX_OK = False
    logger.warning("onnxruntime/torch not installed — running heuristic-only mode")


# ─────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────

MODELS_DIR          = "models"          # folder containing .onnx files
VIDEO_URL_ROW_INDEX = -1               # which column in your DB row holds the video URL
                                        # change to match your actual schema
SAMPLE_EVERY_N      = 3                # analyse every Nth frame (speed/accuracy tradeoff)
MAX_FRAMES          = 9000             # safety cap (~5 min @ 30fps)
BLINK_EAR_THRESH    = 0.20
LOOK_AWAY_YAW_DEG   = 25

# MediaPipe iris landmark indices (refine_landmarks=True required)
LEFT_IRIS   = [474, 475, 476, 477]
RIGHT_IRIS  = [469, 470, 471, 472]
LEFT_EYE_EAR_IDX  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_EAR_IDX = [33,  160, 158, 133, 153, 144]
NOSE_TIP    = 1
LEFT_EYEBROW  = [70, 63, 105, 66, 107]
RIGHT_EYEBROW = [300, 293, 334, 296, 336]
MOUTH_OPEN  = [13, 14]
LEFT_EYE_CORNER  = [133, 33]
RIGHT_EYE_CORNER = [362, 263]

HEAD_POSE_3D = np.array([
    (0.0, 0.0, 0.0), (0.0, -330.0, -65.0),
    (-225.0, 170.0, -135.0), (225.0, 170.0, -135.0),
    (-150.0, -150.0, -125.0), (150.0, -150.0, -125.0),
], dtype=np.float64)
HEAD_POSE_LM = [1, 152, 263, 33, 287, 57]

EMOTION_LABELS    = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
ASD_LABELS        = ["non_autism", "autism"]
ENGAGEMENT_LABELS = ["bored", "confused", "engaged", "not_engaged"]


# ─────────────────────────────────────────────────────────────────
# GEOMETRY HELPERS
# ─────────────────────────────────────────────────────────────────

def _dist(p1, p2) -> float:
    # ✅ FIX 1: Support both (x, y) tuples and MediaPipe NormalizedLandmark objects
    x1, y1 = (p1.x, p1.y) if hasattr(p1, 'x') else (p1[0], p1[1])
    x2, y2 = (p2.x, p2.y) if hasattr(p2, 'x') else (p2[0], p2[1])
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


def _ear(lm, indices) -> float:
    p = [lm[i] for i in indices]
    return (_dist(p[1], p[5]) + _dist(p[2], p[4])) / (2.0 * _dist(p[0], p[3]) + 1e-6)


def _mouth_open(lm) -> float:
    upper = lm[MOUTH_OPEN[0]]
    lower = lm[MOUTH_OPEN[1]]
    left  = lm[61]
    right = lm[291]
    return _dist(upper, lower) / (_dist(left, right) + 1e-6)


def _head_pose(lm, w, h) -> Tuple[float, float, float]:
    img_pts = np.array(
        [(int(lm[i].x * w), int(lm[i].y * h)) for i in HEAD_POSE_LM],
        dtype=np.float64
    )
    focal = w
    cam   = np.array([[focal, 0, w/2], [0, focal, h/2], [0, 0, 1]], dtype=np.float64)
    ok, rvec, _ = cv2.solvePnP(HEAD_POSE_3D, img_pts, cam, np.zeros((4,1)),
                                flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return 0.0, 0.0, 0.0
    rmat, _ = cv2.Rodrigues(rvec)
    sy = math.sqrt(rmat[0,0]**2 + rmat[1,0]**2)
    pitch = math.degrees(math.atan2(rmat[2,1], rmat[2,2]))
    yaw   = math.degrees(math.atan2(-rmat[2,0], sy))
    roll  = math.degrees(math.atan2(rmat[1,0], rmat[0,0]))
    return round(pitch,2), round(yaw,2), round(roll,2)


def _gaze(lm, w, h) -> Tuple[float, float, str]:
    try:
        li = np.mean([[lm[i].x*w, lm[i].y*h] for i in LEFT_IRIS],  axis=0)
        ri = np.mean([[lm[i].x*w, lm[i].y*h] for i in RIGHT_IRIS], axis=0)
        l_inner = (lm[133].x*w, lm[133].y*h)
        l_outer = (lm[33].x*w,  lm[33].y*h)
        r_inner = (lm[362].x*w, lm[362].y*h)
        r_outer = (lm[263].x*w, lm[263].y*h)
        lh = (li[0] - l_inner[0]) / (l_outer[0] - l_inner[0] + 1e-6)
        rh = (ri[0] - r_inner[0]) / (r_outer[0] - r_inner[0] + 1e-6)
        gh = (lh + rh) / 2.0
        lt  = (lm[159].x*w, lm[159].y*h)
        lb  = (lm[145].x*w, lm[145].y*h)
        gv  = (li[1] - lt[1]) / (lb[1] - lt[1] + 1e-6)
        if gh < 0.35 or gh > 0.65:
            direction = "looking_away"
        elif gv > 0.70:
            direction = "looking_down"
        else:
            direction = "forward"
        return round(float(gh), 4), round(float(gv), 4), direction
    except Exception:
        return 0.5, 0.5, "unknown"


def _eye_contact(gaze_h, gaze_v, yaw, pitch) -> float:
    gs = 1.0 - abs(gaze_h - 0.5)*2.0 - abs(gaze_v - 0.5)*1.5
    ps = 1.0 - abs(yaw)/45.0 - abs(pitch)/45.0
    return round(max(0.0, min(gs*0.6 + ps*0.4, 1.0)), 4)


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max())
    return e / e.sum()


# ─────────────────────────────────────────────────────────────────
# ONNX INFERENCE ENGINE
# ─────────────────────────────────────────────────────────────────

class _InferenceEngine:
    """Loads ONNX models once and runs fast inference per face crop."""

    MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def __init__(self, models_dir: str):
        self.sessions: Dict[str, object] = {}
        if not ONNX_OK:
            return
        mapping = {
            "emotion":    "emotion_model.onnx",
            "asd":        "asd_model.onnx",
            "engagement": "engagement_model.onnx",
        }
        import os
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        for task, fname in mapping.items():
            path = os.path.join(models_dir, fname)
            if os.path.exists(path):
                self.sessions[task] = ort.InferenceSession(
                    path, sess_options=opts,
                    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
                )
                logger.info("✅ ONNX loaded: %s", task)
            else:
                logger.warning("⚠️  ONNX not found: %s", path)

    def preprocess(self, face_bgr: np.ndarray) -> np.ndarray:
        img = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        img = (img - self.MEAN) / self.STD
        return np.expand_dims(np.transpose(img, (2,0,1)), 0).astype(np.float32)

    def run(self, task: str, face_bgr: np.ndarray) -> Optional[Dict]:
        if task not in self.sessions:
            return None
        inp_name = self.sessions[task].get_inputs()[0].name
        logits   = self.sessions[task].run(None, {inp_name: self.preprocess(face_bgr)})[0][0]
        probs    = _softmax(logits)
        idx      = int(probs.argmax())
        labels_map = {"emotion": EMOTION_LABELS, "asd": ASD_LABELS, "engagement": ENGAGEMENT_LABELS}
        labels = labels_map.get(task, [str(i) for i in range(len(probs))])
        return {
            "prediction":    labels[idx] if idx < len(labels) else str(idx),
            "confidence":    round(float(probs[idx]), 4),
            "probabilities": {l: round(float(p), 4) for l, p in zip(labels, probs)},
        }


# ─────────────────────────────────────────────────────────────────
# PER-FRAME STATE TRACKER
# ─────────────────────────────────────────────────────────────────

@dataclass
class _State:
    blink_counter:       int   = 0
    total_blinks:        int   = 0
    look_away_frames:    int   = 0
    look_away_events:    int   = 0
    consec_distracted:   int   = 0
    distraction_start:   Optional[float] = None
    prev_nose:           Optional[Tuple] = None
    head_velocities:     deque = field(default_factory=lambda: deque(maxlen=30))
    attention_buf:       deque = field(default_factory=lambda: deque(maxlen=90))


# ─────────────────────────────────────────────────────────────────
# FRAME PROCESSOR
# ─────────────────────────────────────────────────────────────────

def _process_frame(frame: np.ndarray, ts: float, fps: float,
                   face_mesh, face_det,
                   engine: _InferenceEngine, st: _State) -> Dict:
    """Extract all metrics from one frame. Returns flat dict."""

    h, w = frame.shape[:2]
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rec   = {"timestamp_sec": round(ts, 3), "face_detected": False}

    # ── Face detection ────────────────────────────────────────────
    det_res = face_det.process(rgb)
    if not det_res.detections:
        return rec
    rec["face_detected"]    = True
    rec["face_confidence"]  = round(det_res.detections[0].score[0], 4)

    # ── Face mesh ────────────────────────────────────────────────
    mesh_res = face_mesh.process(rgb)
    if not mesh_res.multi_face_landmarks:
        return rec
    lm = mesh_res.multi_face_landmarks[0].landmark

    # ── EAR / blink ───────────────────────────────────────────────
    l_ear = _ear(lm, LEFT_EYE_EAR_IDX)
    r_ear = _ear(lm, RIGHT_EYE_EAR_IDX)
    avg_ear = (l_ear + r_ear) / 2.0
    rec["left_ear"]  = round(l_ear, 4)
    rec["right_ear"] = round(r_ear, 4)
    rec["avg_ear"]   = round(avg_ear, 4)

    blink_now = False
    if avg_ear < BLINK_EAR_THRESH:
        st.blink_counter += 1
    else:
        if st.blink_counter >= 2:
            st.total_blinks += 1
            blink_now = True
        st.blink_counter = 0
    rec["blink_detected"] = blink_now

    # ── Mouth ─────────────────────────────────────────────────────
    rec["mouth_open_ratio"] = round(_mouth_open(lm), 4)

    # ── Head pose ─────────────────────────────────────────────────
    pitch, yaw, roll = _head_pose(lm, w, h)
    rec["head_pitch"] = pitch
    rec["head_yaw"]   = yaw
    rec["head_roll"]  = roll
    rec["head_pose_label"] = (
        "looking_side" if abs(yaw) > 25 else
        "looking_down" if pitch > 20 else
        "looking_up"   if pitch < -15 else
        "head_tilt"    if abs(roll) > 20 else "forward"
    )

    # ── Gaze ─────────────────────────────────────────────────────
    gaze_h, gaze_v, gaze_dir = _gaze(lm, w, h)
    rec["gaze_direction"] = gaze_dir
    rec["gaze_yaw"]   = round((gaze_h - 0.5) * 90.0, 2)
    rec["gaze_pitch"] = round((gaze_v - 0.5) * 60.0, 2)

    # ── Look-away ────────────────────────────────────────────────
    look_away = abs(yaw) > LOOK_AWAY_YAW_DEG or gaze_dir == "looking_away"
    rec["look_away"] = look_away
    if look_away:
        st.look_away_frames += 1
        if st.look_away_frames == 1:
            st.look_away_events += 1
            st.distraction_start = ts
        st.consec_distracted += 1
    else:
        rec["distraction_duration_sec"] = round(ts - st.distraction_start, 2) if st.distraction_start else 0.0
        st.look_away_frames  = 0
        st.distraction_start = None
        st.consec_distracted = 0
    rec.setdefault("distraction_duration_sec", 0.0)

    # ── Eye contact score (ASD marker) ───────────────────────────
    rec["eye_contact_score"] = _eye_contact(gaze_h, gaze_v, yaw, pitch)

    # ── Face symmetry ────────────────────────────────────────────
    nose_x = lm[NOSE_TIP].x * w
    left_pts  = np.array([[lm[i].x*w, lm[i].y*h] for i in [362,382,381,380,374,373]])
    right_pts = np.array([[lm[i].x*w, lm[i].y*h] for i in [33, 7,  163,144,145,153]])
    right_mir = right_pts.copy(); right_mir[:,0] = 2*nose_x - right_mir[:,0]
    diff = np.mean(np.linalg.norm(left_pts - right_mir, axis=1))
    face_w = abs(lm[234].x - lm[454].x) * w
    rec["face_symmetry_score"] = round(max(0.0, 1.0 - diff/(face_w+1e-6)), 4)

    # ── Eyebrow raise ────────────────────────────────────────────
    brow_y = np.mean([lm[i].y for i in LEFT_EYEBROW])
    eye_y  = np.mean([lm[i].y for i in LEFT_EYE_EAR_IDX[:4]])
    gap    = (eye_y - brow_y) * h
    rec["eyebrow_raise_score"] = round(min(gap / 30.0, 1.0), 4)

    # ── Head velocity (hyperactivity) ────────────────────────────
    nose_px = (lm[NOSE_TIP].x * w, lm[NOSE_TIP].y * h)
    if st.prev_nose:
        vel = math.sqrt((nose_px[0]-st.prev_nose[0])**2 + (nose_px[1]-st.prev_nose[1])**2) * fps
    else:
        vel = 0.0
    st.prev_nose = nose_px
    st.head_velocities.append(vel)
    rec["head_movement_velocity"] = round(vel, 2)
    fidget = round(min(float(np.mean(list(st.head_velocities))) / 30.0, 1.0), 4)
    rec["fidget_score"] = fidget
    rec["hyperactivity_level"] = (
        "hyperactive" if fidget > 0.65 else
        "slightly_hyperactive" if fidget > 0.30 else "normal"
    )

    # ── Heuristic scores ─────────────────────────────────────────
    stress = 0.0
    if avg_ear < 0.22:          stress += 0.30
    if rec["eyebrow_raise_score"] > 0.5: stress += 0.20
    if rec["face_symmetry_score"] < 0.7: stress += 0.20
    if rec["mouth_open_ratio"] > 0.3:    stress += 0.10
    if abs(pitch) > 20:         stress += 0.20
    rec["stress_score"]  = round(min(stress, 1.0), 4)
    rec["stress_level"]  = "high" if stress > 0.66 else "medium" if stress > 0.33 else "low"

    engagement = 1.0
    if abs(yaw) > 20:           engagement -= 0.40
    if pitch > 25:              engagement -= 0.30
    if avg_ear < 0.18:          engagement -= 0.30
    if rec["mouth_open_ratio"] > 0.35: engagement -= 0.15
    rec["engagement_score"] = round(max(0.0, min(engagement, 1.0)), 4)

    st.attention_buf.append(rec["engagement_score"])
    attn = rec["engagement_score"]
    if look_away: attn -= 0.4
    if avg_ear < 0.18: attn -= 0.3
    if st.consec_distracted > 5: attn -= 0.2
    rec["attention_score"] = round(max(0.0, min(attn, 1.0)), 4)
    rec["attention_state"] = "attentive" if rec["attention_score"] > 0.5 else "distracted"

    rec["sustained_attention_score"] = round(float(np.mean(list(st.attention_buf))), 4)
    rec["impulsivity_score"] = round(min(vel/50.0 + (1.0-rec["attention_score"])*0.3, 1.0), 4)

    # ── Face crop for model inference ────────────────────────────
    xs = [lm[i].x for i in range(468)]
    ys = [lm[i].y for i in range(468)]
    pad = 0.2
    x1 = max(0, int((min(xs)-pad)*w)); y1 = max(0, int((min(ys)-pad)*h))
    x2 = min(w, int((max(xs)+pad)*w)); y2 = min(h, int((max(ys)+pad)*h))
    face_crop = cv2.resize(frame[y1:y2, x1:x2], (224,224)) if x2>x1 and y2>y1 else None

    # ── Model inference ───────────────────────────────────────────
    if face_crop is not None and engine:
        em = engine.run("emotion", face_crop)
        if em:
            rec["emotion"]             = em["prediction"]
            rec["emotion_confidence"]  = em["confidence"]
            rec["emotion_probs"]       = em["probabilities"]

        asd = engine.run("asd", face_crop)
        if asd:
            rec["asd_prediction"]  = asd["prediction"]
            rec["asd_confidence"]  = asd["probabilities"].get("autism", 0.0)

        eng_res = engine.run("engagement", face_crop)
        if eng_res:
            rec["engagement_label"]  = eng_res["prediction"]
            rec["engagement_probs"]  = eng_res["probabilities"]

    # Defaults if model not loaded
    rec.setdefault("emotion",            "neutral")
    rec.setdefault("emotion_confidence", 0.0)
    rec.setdefault("asd_prediction",     "unknown")
    rec.setdefault("asd_confidence",     0.0)
    rec.setdefault("engagement_label",   "engaged" if rec["engagement_score"] > 0.5 else "not_engaged")

    # ── ASD heuristic markers ─────────────────────────────────────
    rec["social_smile"] = (rec["emotion"] == "happy" and rec["eye_contact_score"] > 0.6)

    # ── Composite risk ────────────────────────────────────────────
    asd_w  = rec["asd_confidence"] if rec.get("asd_prediction") == "autism" else 0.0
    risk   = (
        asd_w * 0.25 +
        0.0   * 0.25 +   # adhd — no dedicated model yet, filled by heuristic
        rec["stress_score"]        * 0.10 +
        rec["fidget_score"]        * 0.15 +
        (1.0 - rec["eye_contact_score"]) * 0.15 +
        (1.0 - rec["engagement_score"])  * 0.10 +
        (1.0 - rec["attention_score"])   * 0.10
    )
    rec["composite_risk"] = round(min(risk, 1.0), 4)

    # ── Alert flags ───────────────────────────────────────────────
    flags = []
    if rec["eye_contact_score"] < 0.3:      flags.append("LOW_EYE_CONTACT")
    if rec["stress_score"] > 0.7:           flags.append("HIGH_STRESS")
    if rec["fidget_score"] > 0.7:           flags.append("HIGH_HYPERACTIVITY")
    if rec["sustained_attention_score"] < 0.3: flags.append("POOR_SUSTAINED_ATTENTION")
    if rec.get("asd_confidence", 0) > 0.7:  flags.append("ASD_RISK_HIGH")
    rec["alert_flags"] = flags

    return rec


# ─────────────────────────────────────────────────────────────────
# VIDEO PROCESSOR
# ─────────────────────────────────────────────────────────────────

def _process_video(video_path: str, engine: _InferenceEngine) -> Dict:
    if not MEDIAPIPE_OK:
        return {"error": "MediaPipe not installed"}

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": f"Cannot open video: {video_path}"}

    fps           = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec  = total_frames / fps

    face_mesh = _mp_face_mesh.FaceMesh(
        static_image_mode=False, max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5, min_tracking_confidence=0.5
    )
    face_det = _mp_face_detection.FaceDetection(
        model_selection=1, min_detection_confidence=0.5
    )

    st        = _State()
    frame_idx = 0
    processed = 0
    all_frames: List[Dict] = []

    try:
        while cap.isOpened() and processed < MAX_FRAMES:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % SAMPLE_EVERY_N == 0:
                ts  = frame_idx / fps
                rec = _process_frame(frame, ts, fps, face_mesh, face_det, engine, st)
                all_frames.append(rec)
                processed += 1
            frame_idx += 1
    finally:
        cap.release()
        face_mesh.close()
        face_det.close()

    # ── Aggregate summary ─────────────────────────────────────────
    # face_frames: detected a face (used for detection rate count)
    face_frames = [f for f in all_frames if f.get("face_detected")]

    # ✅ FIX 2: full_frames — only frames that completed the full mesh pipeline
    # (face_detected=True but mesh failed leaves frames without metric keys)
    full_frames = [f for f in face_frames if "engagement_score" in f]

    def _mean(key):
        vals = [f[key] for f in full_frames if isinstance(f.get(key), (int, float))]
        return round(float(np.mean(vals)), 4) if vals else 0.0

    def _dominant(key):
        vals = [f[key] for f in full_frames
                if isinstance(f.get(key), str) and f[key] not in ("unknown","")]
        return Counter(vals).most_common(1)[0][0] if vals else "unknown"

    blink_rate = round(st.total_blinks / max(duration_sec / 60.0, 0.01), 2)
    mean_asd   = _mean("asd_confidence")
    mean_attn  = _mean("attention_score")
    mean_eng   = _mean("engagement_score")
    mean_stress= _mean("stress_score")
    mean_ec    = _mean("eye_contact_score")
    mean_hyp   = _mean("fidget_score")
    mean_risk  = _mean("composite_risk")

    risk_cat = "high" if mean_risk >= 0.60 else "moderate" if mean_risk >= 0.30 else "low"

    # Recommendations
    recs = []
    if mean_ec < 0.35:                        recs.append("ASD_EVALUATION: Reduced eye contact detected")
    if mean_attn < 0.40:                      recs.append("ADHD_EVALUATION: Poor sustained attention")
    if mean_stress > 0.60:                    recs.append("ANXIETY_SCREENING: High stress indicators")
    if mean_hyp > 0.60:                       recs.append("ADHD_EVALUATION: High hyperactivity/fidgeting")
    if blink_rate < 8:                        recs.append("EYE_HEALTH: Low blink rate (screen fatigue)")
    if _mean("impulsivity_score") > 0.60:     recs.append("ADHD_EVALUATION: Elevated impulsivity markers")

    # All alert flags across video — use full_frames only
    all_flags = []
    for f in full_frames:
        all_flags.extend(f.get("alert_flags", []))
    flag_counts = Counter(all_flags)

    # Per-second timeline — use full_frames only to avoid KeyError
    timeline = []
    for sec in range(int(duration_sec) + 1):
        sf = [f for f in full_frames if int(f.get("timestamp_sec", -1)) == sec]
        if sf:
            timeline.append({
                "second":        sec,
                "engagement":    round(np.mean([f["engagement_score"] for f in sf]), 3),
                "attention":     round(np.mean([f["attention_score"]  for f in sf]), 3),
                "stress":        round(np.mean([f["stress_score"]     for f in sf]), 3),
                "eye_contact":   round(np.mean([f["eye_contact_score"]for f in sf]), 3),
                "hyperactivity": round(np.mean([f["fidget_score"]     for f in sf]), 3),
                "look_away":     any(f.get("look_away") for f in sf),
                "emotion":       Counter([f.get("emotion","neutral") for f in sf]).most_common(1)[0][0],
            })

    return {
        # ── Video metadata ──────────────────────────────────────
        "duration_sec":          round(duration_sec, 2),
        "total_frames_analyzed": processed,
        "face_detection_rate":   round(len(face_frames) / max(processed, 1), 4),

        # ── Mean scores (0–1) ───────────────────────────────────
        "mean_engagement_score":    mean_eng,
        "mean_attention_score":     mean_attn,
        "mean_stress_score":        mean_stress,
        "mean_eye_contact_score":   mean_ec,
        "mean_hyperactivity_score": mean_hyp,
        "mean_asd_confidence":      mean_asd,
        "mean_adhd_confidence":     0.0,       # populated when ADHD model added

        # ── Dominant labels ─────────────────────────────────────
        "dominant_emotion":    _dominant("emotion"),
        "dominant_engagement": _dominant("engagement_label"),
        "dominant_attention":  _dominant("attention_state"),
        "dominant_stress":     _dominant("stress_level"),

        # ── Event counts ────────────────────────────────────────
        "look_away_events":       st.look_away_events,
        "look_away_total_sec":    round(st.look_away_frames / fps, 2),
        "blink_rate_per_min":     blink_rate,
        "distraction_events":     st.look_away_events,
        "hyperactivity_episodes": sum(1 for f in full_frames if f.get("hyperactivity_level") == "hyperactive"),

        # ── ASD markers ─────────────────────────────────────────
        "eye_contact_deficit":       mean_ec < 0.35,
        "flat_affect_detected":      (_dominant("emotion") == "neutral" and mean_ec < 0.4),
        "repetitive_motion_detected":mean_hyp > 0.60,

        # ── ADHD markers ────────────────────────────────────────
        "sustained_attention_failure": mean_attn < 0.40,
        "high_impulsivity":            _mean("impulsivity_score") > 0.60,
        "attention_switch_rate":       round(st.look_away_events / max(duration_sec/60.0, 0.01), 2),

        # ── Overall risk ─────────────────────────────────────────
        "composite_disability_risk": round(mean_risk, 4),
        "risk_category":             risk_cat,
        "recommended_followup":      recs,
        "alert_flags":               [f"{k}(×{v})" for k,v in flag_counts.most_common(10)],

        # ── Timeline ─────────────────────────────────────────────
        "timeline": timeline,
    }


# ─────────────────────────────────────────────────────────────────
# PUBLIC ENTRY POINT (called from app.py route)
# ─────────────────────────────────────────────────────────────────

# Singleton engine — loaded once on first call
_engine: Optional[_InferenceEngine] = None

def _get_engine() -> _InferenceEngine:
    global _engine
    if _engine is None:
        _engine = _InferenceEngine(MODELS_DIR)
    return _engine


def run_video_analysis_for_session(session_id: str, row) -> object:
    """
    Main entry point called from Flask route.

    Args:
        session_id : str  — from @require_session decorator
        row        : tuple/list — DB row from fetch_session()

    DB Row expectation:
        row[VIDEO_URL_ROW_INDEX] must contain the Cloudinary video URL.
        Default VIDEO_URL_ROW_INDEX = -1  (last column).
        Change VIDEO_URL_ROW_INDEX at top of file to match your schema.

    Returns:
        Flask jsonify() response
    """
    t_start = time.time()

    # ── 1. Get video URL from DB row ──────────────────────────────
    try:
        video_url = row[VIDEO_URL_ROW_INDEX]
    except (IndexError, TypeError):
        return jsonify({"error": "Cannot read video URL from session row"}), 400

    if not video_url:
        return jsonify({"error": "No video URL found in session record"}), 400

    logger.info("[VIDEO_ANALYSIS] session=%s  url=%.80s", session_id, video_url)

    # ── 2. Download video ─────────────────────────────────────────
    local_path = download_video_from_url(video_url)
    if not local_path:
        return jsonify({"error": "Video download failed"}), 500

    # ── 3. Run analysis ───────────────────────────────────────────
    try:
        engine  = _get_engine()
        metrics = _process_video(local_path, engine)

        if "error" in metrics:
            return jsonify({"error": metrics["error"]}), 500

        processing_time = round(time.time() - t_start, 2)

        return jsonify({
            "session_id":          session_id,
            "status":              "completed",
            "processing_time_sec": processing_time,
            **metrics,
        })

    except Exception as exc:
        logger.exception("[VIDEO_ANALYSIS] Failed for session %s", session_id)
        return jsonify({"error": str(exc)}), 500

    finally:
        cleanup_video(local_path)