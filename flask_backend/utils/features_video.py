"""
features.py — Complete Feature Extraction Pipeline
Child Learning Disability Detection System

Extracts 40+ behavioral and facial features per frame:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACIAL STRUCTURE:    facial landmarks, symmetry, AU (Action Units)
EMOTION:             7-class emotion + intensity timeline
GAZE / ATTENTION:    eye gaze vector, blink rate, look-away events
ENGAGEMENT:          engagement score, boredom, confusion markers
STRESS:              facial tension, eye strain, micro-expressions
HYPERACTIVITY:       head movement velocity, fidget score
ASD MARKERS:         reduced eye contact, flat affect, social gaze
ADHD MARKERS:        sustained attention drops, impulsivity proxy
TEMPORAL:            per-second aggregates + full-video summary
"""

import cv2
import numpy as np
import mediapipe as mp
import time
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from collections import deque
import math

# MediaPipe solution references
mp_face_mesh = mp.solutions.face_mesh
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


# ─────────────────────────────────────────────────────────────────
# CONSTANTS & LANDMARK INDICES (MediaPipe 468-point mesh)
# ─────────────────────────────────────────────────────────────────

# Eye landmarks (MediaPipe 468-point)
LEFT_EYE_INDICES   = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE_INDICES  = [33,  7,   163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
LEFT_IRIS_INDICES  = [474, 475, 476, 477]
RIGHT_IRIS_INDICES = [469, 470, 471, 472]

# Blink landmarks (EAR calculation)
LEFT_EYE_EAR  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_EAR = [33,  160, 158, 133, 153, 144]

# Mouth landmarks
MOUTH_INDICES       = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
MOUTH_OPEN_INDICES  = [13, 14]  # upper/lower lip center

# Nose
NOSE_TIP = 1
NOSE_BRIDGE = 6

# Face contour
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
             397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
             172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]

# Eyebrow
LEFT_EYEBROW  = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]

# Head pose reference points
HEAD_POSE_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),       # nose tip
    (0.0, -330.0, -65.0),  # chin
    (-225.0, 170.0, -135.0),  # left eye corner
    (225.0, 170.0, -135.0),   # right eye corner
    (-150.0, -150.0, -125.0), # left mouth
    (150.0, -150.0, -125.0),  # right mouth
], dtype=np.float64)

HEAD_POSE_LANDMARK_IDS = [1, 152, 263, 33, 287, 57]


# ─────────────────────────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────────────────────────

@dataclass
class FrameFeatures:
    """All extracted features for a single frame."""
    timestamp_sec: float = 0.0
    frame_idx: int = 0

    # Face presence
    face_detected: bool = False
    face_confidence: float = 0.0
    face_bbox: Optional[List[float]] = None          # [x, y, w, h] normalized

    # Emotion
    emotion: str = "unknown"
    emotion_confidence: float = 0.0
    emotion_probabilities: Dict[str, float] = field(default_factory=dict)

    # Engagement
    engagement: str = "unknown"
    engagement_score: float = 0.0                    # 0–1 continuous
    engagement_probabilities: Dict[str, float] = field(default_factory=dict)

    # ASD markers
    asd_risk: str = "unknown"
    asd_confidence: float = 0.0
    eye_contact_score: float = 0.0                   # 0–1 (1 = direct gaze)
    social_smile_detected: bool = False
    repetitive_motion_score: float = 0.0

    # ADHD markers
    adhd_risk: str = "unknown"
    adhd_confidence: float = 0.0
    sustained_attention_score: float = 0.0           # 0–1
    impulsivity_score: float = 0.0
    task_switching_rate: float = 0.0

    # Stress
    stress_level: str = "unknown"
    stress_score: float = 0.0                        # 0–1
    facial_tension_score: float = 0.0
    micro_expression_detected: bool = False

    # Attention
    attention_state: str = "unknown"
    attention_score: float = 0.0                     # 0–1
    look_away: bool = False
    distraction_duration_sec: float = 0.0

    # Gaze
    gaze_direction: str = "unknown"
    gaze_yaw: float = 0.0                            # degrees
    gaze_pitch: float = 0.0
    left_iris_position: Optional[Tuple[float, float]] = None
    right_iris_position: Optional[Tuple[float, float]] = None

    # Blink
    blink_detected: bool = False
    left_ear: float = 0.0                            # Eye Aspect Ratio
    right_ear: float = 0.0
    avg_ear: float = 0.0

    # Head pose
    head_pitch: float = 0.0                          # nodding
    head_yaw: float = 0.0                            # turning
    head_roll: float = 0.0                           # tilting
    head_pose_label: str = "forward"                 # forward/down/side/away

    # Hyperactivity
    hyperactivity_level: str = "unknown"
    head_movement_velocity: float = 0.0              # pixels/sec
    fidget_score: float = 0.0

    # Facial geometry
    face_symmetry_score: float = 0.0                 # 0–1
    eyebrow_raise_score: float = 0.0
    mouth_open_ratio: float = 0.0
    jaw_tension_score: float = 0.0

    # Computed composite
    composite_disability_risk: float = 0.0           # 0–1 overall risk
    alert_flags: List[str] = field(default_factory=list)


@dataclass
class VideoSummary:
    """Aggregated summary over the entire video."""
    duration_sec: float = 0.0
    total_frames: int = 0
    frames_with_face: int = 0
    face_detection_rate: float = 0.0

    # Aggregate scores (mean over all frames)
    mean_engagement_score: float = 0.0
    mean_attention_score: float = 0.0
    mean_stress_score: float = 0.0
    mean_asd_confidence: float = 0.0
    mean_adhd_confidence: float = 0.0
    mean_eye_contact_score: float = 0.0
    mean_hyperactivity_score: float = 0.0

    # Dominant labels
    dominant_emotion: str = "unknown"
    dominant_engagement: str = "unknown"
    dominant_attention: str = "unknown"
    dominant_stress: str = "unknown"

    # Temporal patterns
    look_away_total_sec: float = 0.0
    look_away_events: int = 0
    blink_rate_per_min: float = 0.0
    distraction_events: int = 0
    hyperactivity_episodes: int = 0

    # ASD-specific
    eye_contact_deficit: bool = False
    flat_affect_detected: bool = False
    repetitive_motion_detected: bool = False

    # ADHD-specific
    sustained_attention_failure: bool = False
    high_impulsivity: bool = False
    attention_switch_rate: float = 0.0

    # Composite
    composite_disability_risk: float = 0.0
    risk_category: str = "low"                        # low / moderate / high
    recommended_followup: List[str] = field(default_factory=list)
    alert_flags: List[str] = field(default_factory=list)

    # Timeline (aggregated per second)
    timeline: List[Dict] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────
# GEOMETRIC HELPERS
# ─────────────────────────────────────────────────────────────────

def euclidean(p1, p2) -> float:
    return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

def eye_aspect_ratio(landmarks: list, eye_indices: list) -> float:
    """
    EAR = (||P2-P6|| + ||P3-P5||) / (2 * ||P1-P4||)
    Blink threshold typically EAR < 0.2
    """
    p = [landmarks[i] for i in eye_indices]
    v1 = euclidean(p[1], p[5])
    v2 = euclidean(p[2], p[4])
    h  = euclidean(p[0], p[3])
    return (v1 + v2) / (2.0 * h + 1e-6)

def mouth_aspect_ratio(landmarks: list) -> float:
    """Detects mouth openness for yawning, talking, distress."""
    upper = landmarks[MOUTH_OPEN_INDICES[0]]
    lower = landmarks[MOUTH_OPEN_INDICES[1]]
    left  = landmarks[61]
    right = landmarks[291]
    vertical   = euclidean(upper, lower)
    horizontal = euclidean(left, right)
    return vertical / (horizontal + 1e-6)

def landmark_to_pixel(lm, w: int, h: int) -> Tuple[int, int]:
    return int(lm.x * w), int(lm.y * h)

def normalize_coords(points: np.ndarray, w: int, h: int) -> np.ndarray:
    return points / np.array([w, h])

def face_symmetry(landmarks: list, w: int, h: int) -> float:
    """
    Compute left-right face symmetry.
    Returns 0–1 (1 = perfectly symmetric).
    Asymmetry can indicate stress or neurological markers.
    """
    left_pts  = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in LEFT_EYE_INDICES[:8]])
    right_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in RIGHT_EYE_INDICES[:8]])
    nose_x = landmarks[NOSE_TIP].x * w

    # Mirror right side around nose
    right_mirrored = right_pts.copy()
    right_mirrored[:, 0] = 2 * nose_x - right_mirrored[:, 0]

    diff = np.mean(np.linalg.norm(left_pts - right_mirrored, axis=1))
    face_width = (landmarks[234].x - landmarks[454].x) * w
    symmetry = max(0.0, 1.0 - diff / (face_width + 1e-6))
    return round(float(symmetry), 4)


# ─────────────────────────────────────────────────────────────────
# HEAD POSE ESTIMATION
# ─────────────────────────────────────────────────────────────────

def estimate_head_pose(landmarks: list, w: int, h: int) -> Tuple[float, float, float]:
    """
    Returns (pitch, yaw, roll) in degrees.
    pitch: head nod (+ = down)
    yaw:   head turn (+ = right)
    roll:  head tilt (+ = right shoulder)
    """
    img_pts = np.array([
        landmark_to_pixel(landmarks[i], w, h)
        for i in HEAD_POSE_LANDMARK_IDS
    ], dtype=np.float64)

    focal = w
    cam_matrix = np.array([
        [focal, 0, w / 2],
        [0, focal, h / 2],
        [0, 0, 1]
    ], dtype=np.float64)
    dist = np.zeros((4, 1))

    success, rvec, tvec = cv2.solvePnP(
        HEAD_POSE_POINTS_3D, img_pts, cam_matrix, dist,
        flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return 0.0, 0.0, 0.0

    rmat, _ = cv2.Rodrigues(rvec)
    # Decompose into Euler angles
    sy = math.sqrt(rmat[0, 0]**2 + rmat[1, 0]**2)
    singular = sy < 1e-6

    if not singular:
        x = math.atan2(rmat[2, 1], rmat[2, 2])   # pitch
        y = math.atan2(-rmat[2, 0], sy)            # yaw
        z = math.atan2(rmat[1, 0], rmat[0, 0])    # roll
    else:
        x = math.atan2(-rmat[1, 2], rmat[1, 1])
        y = math.atan2(-rmat[2, 0], sy)
        z = 0

    pitch = math.degrees(x)
    yaw   = math.degrees(y)
    roll  = math.degrees(z)
    return round(pitch, 2), round(yaw, 2), round(roll, 2)


def head_pose_label(pitch: float, yaw: float, roll: float) -> str:
    """Classify head pose into human-readable direction."""
    if abs(yaw) > 25:
        return "looking_side"
    if pitch > 20:
        return "looking_down"
    if pitch < -15:
        return "looking_up"
    if abs(roll) > 20:
        return "head_tilt"
    return "forward"


# ─────────────────────────────────────────────────────────────────
# GAZE ESTIMATION
# ─────────────────────────────────────────────────────────────────

def estimate_gaze_from_iris(landmarks: list, w: int, h: int) -> Tuple[float, float, str]:
    """
    Estimate gaze using iris position relative to eye corners.
    Returns (gaze_horizontal, gaze_vertical, direction_label)
    gaze_horizontal: -1 (left) to +1 (right)
    gaze_vertical:   -1 (up)   to +1 (down)
    """
    try:
        # Left iris center
        l_iris = np.mean([[landmarks[i].x * w, landmarks[i].y * h]
                           for i in LEFT_IRIS_INDICES], axis=0)
        # Right iris center
        r_iris = np.mean([[landmarks[i].x * w, landmarks[i].y * h]
                           for i in RIGHT_IRIS_INDICES], axis=0)

        # Eye corners (horizontal reference)
        l_inner = (landmarks[133].x * w, landmarks[133].y * h)
        l_outer = (landmarks[33].x * w,  landmarks[33].y * h)
        r_inner = (landmarks[362].x * w, landmarks[362].y * h)
        r_outer = (landmarks[263].x * w, landmarks[263].y * h)

        # Horizontal ratio: 0 = inner corner, 1 = outer corner
        l_h_ratio = (l_iris[0] - l_inner[0]) / (l_outer[0] - l_inner[0] + 1e-6)
        r_h_ratio = (r_iris[0] - r_inner[0]) / (r_outer[0] - r_inner[0] + 1e-6)
        gaze_h = (l_h_ratio + r_h_ratio) / 2.0  # average

        # Vertical ratio
        l_top    = (landmarks[159].x * w, landmarks[159].y * h)
        l_bottom = (landmarks[145].x * w, landmarks[145].y * h)
        l_v_ratio = (l_iris[1] - l_top[1]) / (l_bottom[1] - l_top[1] + 1e-6)
        gaze_v = l_v_ratio

        # Classification
        if gaze_h < 0.35 or gaze_h > 0.65:
            direction = "looking_away"
        elif gaze_v > 0.70:
            direction = "looking_down"
        else:
            direction = "forward"

        return round(float(gaze_h), 4), round(float(gaze_v), 4), direction
    except Exception:
        return 0.5, 0.5, "unknown"


# ─────────────────────────────────────────────────────────────────
# RULE-BASED BEHAVIORAL SCORES (pre-model heuristics)
# ─────────────────────────────────────────────────────────────────

def compute_stress_heuristic(ear: float, mouth_open: float,
                               eyebrow_raise: float, symmetry: float,
                               head_pitch: float) -> float:
    """
    Rule-based stress score 0–1 using facial cues.
    High stress indicators:
      - Low EAR (squinting / strained eyes)
      - Raised eyebrows
      - Low facial symmetry
      - Mouth tension
    """
    score = 0.0
    if ear < 0.22:
        score += 0.3    # eye squinting = eye strain
    if eyebrow_raise > 0.5:
        score += 0.2    # raised brows = concern
    if symmetry < 0.7:
        score += 0.2    # asymmetry = tension
    if mouth_open > 0.3:
        score += 0.1    # open mouth = alarm/surprise
    if abs(head_pitch) > 20:
        score += 0.2    # extreme head angle
    return round(min(score, 1.0), 4)


def compute_engagement_heuristic(ear: float, head_yaw: float,
                                   head_pitch: float, mouth_open: float) -> float:
    """Estimate engagement from pose and eye openness."""
    score = 1.0
    # Looking away drops engagement
    if abs(head_yaw) > 20:
        score -= 0.4
    # Looking down drops engagement
    if head_pitch > 25:
        score -= 0.3
    # Closed eyes = drowsy
    if ear < 0.18:
        score -= 0.3
    # Mouth wide open = distracted/yawning
    if mouth_open > 0.35:
        score -= 0.15
    return round(max(0.0, min(score, 1.0)), 4)


def compute_eye_contact_score(gaze_h: float, gaze_v: float,
                               head_yaw: float, head_pitch: float) -> float:
    """
    ASD marker: reduced eye contact.
    Score 0–1 where 1 = direct eye contact.
    """
    # Ideal gaze centered: h ≈ 0.5, v ≈ 0.4-0.6
    gaze_score = 1.0 - (abs(gaze_h - 0.5) * 2.0) - (abs(gaze_v - 0.5) * 1.5)
    pose_score = 1.0 - abs(head_yaw) / 45.0 - abs(head_pitch) / 45.0
    combined = (gaze_score * 0.6 + pose_score * 0.4)
    return round(max(0.0, min(combined, 1.0)), 4)


def compute_hyperactivity_score(head_velocity: float,
                                 prev_velocities: deque) -> float:
    """
    ADHD marker: high head movement.
    Compares current velocity to rolling average.
    """
    prev_velocities.append(head_velocity)
    if len(prev_velocities) < 3:
        return 0.0
    avg_v = np.mean(list(prev_velocities))
    # High movement threshold: > 15 pixels/frame
    score = min(avg_v / 30.0, 1.0)
    return round(float(score), 4)


def compute_attention_score(look_away: bool, ear: float,
                              engagement: float, consecutive_distracted: int) -> float:
    """Continuous attention score 0–1."""
    score = 1.0
    if look_away:
        score -= 0.4
    if ear < 0.18:
        score -= 0.3    # drowsiness
    score -= (1.0 - engagement) * 0.3
    if consecutive_distracted > 5:
        score -= 0.2    # persistent distraction
    return round(max(0.0, min(score, 1.0)), 4)


# ─────────────────────────────────────────────────────────────────
# COMPOSITE RISK SCORER
# ─────────────────────────────────────────────────────────────────

def compute_composite_risk(features: FrameFeatures) -> float:
    """
    Weighted composite disability risk score 0–1.
    Combines all task predictions and heuristics.
    """
    weights = {
        "asd_confidence":            0.20,
        "adhd_confidence":           0.20,
        "stress_score":              0.10,
        "hyperactivity_score":       0.15,
        "eye_contact_deficit":       0.15,
        "engagement_inverse":        0.10,
        "attention_inverse":         0.10,
    }

    asd_w = features.asd_confidence if features.asd_risk in ["autism"] else 0.0
    adhd_w = features.adhd_confidence if features.adhd_risk in ["adhd"] else 0.0
    hyp_w = features.fidget_score
    ec_w = 1.0 - features.eye_contact_score

    score = (
        asd_w  * weights["asd_confidence"] +
        adhd_w * weights["adhd_confidence"] +
        features.stress_score * weights["stress_score"] +
        hyp_w * weights["hyperactivity_score"] +
        ec_w  * weights["eye_contact_deficit"] +
        (1.0 - features.engagement_score) * weights["engagement_inverse"] +
        (1.0 - features.attention_score)  * weights["attention_inverse"]
    )
    return round(min(score, 1.0), 4)


# ─────────────────────────────────────────────────────────────────
# MAIN FEATURE EXTRACTOR CLASS
# ─────────────────────────────────────────────────────────────────

class FeatureExtractor:
    """
    Main feature extraction pipeline.
    
    Usage:
        extractor = FeatureExtractor(model_engine)
        summary = extractor.process_video(video_path)
    """

    BLINK_EAR_THRESHOLD = 0.20
    BLINK_CONSEC_FRAMES = 2
    MIN_FACE_CONFIDENCE = 0.5

    def __init__(self, model_engine=None):
        """
        Args:
            model_engine: ONNXInferenceEngine instance (or None for heuristic-only mode)
        """
        self.model_engine = model_engine

        # MediaPipe
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,  # enables iris tracking
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.face_detector = mp_face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=self.MIN_FACE_CONFIDENCE
        )

        # State buffers for temporal analysis
        self._blink_counter        = 0
        self._total_blinks         = 0
        self._ear_buffer           = deque(maxlen=5)
        self._head_positions       = deque(maxlen=30)
        self._head_velocities      = deque(maxlen=30)
        self._distraction_start    = None
        self._look_away_frames     = 0
        self._look_away_events     = 0
        self._consecutive_dist     = 0
        self._prev_nose_pos        = None
        self._attention_history    = deque(maxlen=90)   # ~3 sec at 30fps
        self._frame_features_list: List[FrameFeatures] = []

    def reset(self):
        """Reset all state for a new video."""
        self._blink_counter = 0
        self._total_blinks = 0
        self._ear_buffer.clear()
        self._head_positions.clear()
        self._head_velocities.clear()
        self._distraction_start = None
        self._look_away_frames = 0
        self._look_away_events = 0
        self._consecutive_dist = 0
        self._prev_nose_pos = None
        self._attention_history.clear()
        self._frame_features_list.clear()

    def _get_face_crop(self, frame: np.ndarray, landmarks: list,
                        w: int, h: int, padding: float = 0.2) -> Optional[np.ndarray]:
        """Crop and resize face region for model inference."""
        xs = [lm.x for lm in landmarks]
        ys = [lm.y for lm in landmarks]
        x1 = max(0, int((min(xs) - padding) * w))
        y1 = max(0, int((min(ys) - padding) * h))
        x2 = min(w, int((max(xs) + padding) * w))
        y2 = min(h, int((max(ys) + padding) * h))
        if x2 <= x1 or y2 <= y1:
            return None
        crop = frame[y1:y2, x1:x2]
        return cv2.resize(crop, (224, 224))

    def _update_blink(self, avg_ear: float) -> bool:
        """Detect blink events using EAR threshold."""
        self._ear_buffer.append(avg_ear)
        if avg_ear < self.BLINK_EAR_THRESHOLD:
            self._blink_counter += 1
        else:
            if self._blink_counter >= self.BLINK_CONSEC_FRAMES:
                self._total_blinks += 1
                self._blink_counter = 0
                return True
            self._blink_counter = 0
        return False

    def _update_head_velocity(self, nose_x: float, nose_y: float,
                               fps: float) -> float:
        """Compute head movement velocity (pixels/sec)."""
        if self._prev_nose_pos is None:
            self._prev_nose_pos = (nose_x, nose_y)
            return 0.0
        dx = nose_x - self._prev_nose_pos[0]
        dy = nose_y - self._prev_nose_pos[1]
        velocity = math.sqrt(dx**2 + dy**2) * fps
        self._prev_nose_pos = (nose_x, nose_y)
        self._head_velocities.append(velocity)
        return velocity

    def _classify_hyperactivity(self, fidget_score: float) -> str:
        if fidget_score < 0.3:
            return "normal"
        if fidget_score < 0.65:
            return "slightly_hyperactive"
        return "hyperactive"

    def _classify_stress(self, score: float) -> str:
        if score < 0.33:
            return "low"
        if score < 0.66:
            return "medium"
        return "high"

    def extract_frame_features(self, frame: np.ndarray, frame_idx: int,
                                timestamp_sec: float, fps: float) -> FrameFeatures:
        """
        Extract all features from a single video frame.
        Returns FrameFeatures dataclass.
        """
        h, w = frame.shape[:2]
        ff = FrameFeatures(timestamp_sec=timestamp_sec, frame_idx=frame_idx)

        # Convert to RGB for MediaPipe
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # ── FACE DETECTION ───────────────────────────────────────
        detection_result = self.face_detector.process(rgb)
        if detection_result.detections:
            det = detection_result.detections[0]
            ff.face_detected = True
            ff.face_confidence = det.score[0]
            bbox = det.location_data.relative_bounding_box
            ff.face_bbox = [round(bbox.xmin, 4), round(bbox.ymin, 4),
                            round(bbox.width, 4), round(bbox.height, 4)]
        else:
            ff.face_detected = False
            return ff

        # ── FACE MESH ────────────────────────────────────────────
        mesh_result = self.face_mesh.process(rgb)
        if not mesh_result.multi_face_landmarks:
            return ff

        landmarks = mesh_result.multi_face_landmarks[0].landmark

        # ── EAR (BLINK DETECTION) ─────────────────────────────────
        left_ear  = eye_aspect_ratio(landmarks, LEFT_EYE_EAR)
        right_ear = eye_aspect_ratio(landmarks, RIGHT_EYE_EAR)
        avg_ear   = (left_ear + right_ear) / 2.0
        ff.left_ear  = round(left_ear, 4)
        ff.right_ear = round(right_ear, 4)
        ff.avg_ear   = round(avg_ear, 4)
        ff.blink_detected = self._update_blink(avg_ear)

        # ── MOUTH ─────────────────────────────────────────────────
        ff.mouth_open_ratio = round(mouth_aspect_ratio(landmarks), 4)

        # ── HEAD POSE ─────────────────────────────────────────────
        ff.head_pitch, ff.head_yaw, ff.head_roll = estimate_head_pose(landmarks, w, h)
        ff.head_pose_label = head_pose_label(ff.head_pitch, ff.head_yaw, ff.head_roll)

        # ── GAZE ─────────────────────────────────────────────────
        gaze_h, gaze_v, gaze_dir = estimate_gaze_from_iris(landmarks, w, h)
        ff.gaze_direction = gaze_dir
        ff.gaze_yaw       = round((gaze_h - 0.5) * 90.0, 2)
        ff.gaze_pitch     = round((gaze_v - 0.5) * 60.0, 2)
        ff.left_iris_position  = (round(landmarks[LEFT_IRIS_INDICES[0]].x, 4),
                                   round(landmarks[LEFT_IRIS_INDICES[0]].y, 4))
        ff.right_iris_position = (round(landmarks[RIGHT_IRIS_INDICES[0]].x, 4),
                                   round(landmarks[RIGHT_IRIS_INDICES[0]].y, 4))

        # ── LOOK AWAY DETECTION ───────────────────────────────────
        ff.look_away = (abs(ff.head_yaw) > 25 or gaze_dir == "looking_away")
        if ff.look_away:
            self._look_away_frames += 1
            if self._look_away_frames == 1:
                self._look_away_events += 1
                self._distraction_start = timestamp_sec
        else:
            if self._distraction_start is not None:
                ff.distraction_duration_sec = timestamp_sec - self._distraction_start
            self._look_away_frames = 0
            self._distraction_start = None

        # ── FACE SYMMETRY ─────────────────────────────────────────
        ff.face_symmetry_score = face_symmetry(landmarks, w, h)

        # ── EYEBROW RAISE SCORE ────────────────────────────────────
        left_brow_y  = np.mean([landmarks[i].y for i in LEFT_EYEBROW])
        left_eye_y   = np.mean([landmarks[i].y for i in LEFT_EYE_INDICES[:4]])
        brow_gap     = (left_eye_y - left_brow_y) * h  # pixels
        ff.eyebrow_raise_score = round(min(brow_gap / 30.0, 1.0), 4)

        # ── HEAD VELOCITY ─────────────────────────────────────────
        nose_px = landmarks[NOSE_TIP].x * w
        nose_py = landmarks[NOSE_TIP].y * h
        head_v  = self._update_head_velocity(nose_px, nose_py, fps)
        ff.head_movement_velocity = round(head_v, 2)

        # ── HYPERACTIVITY ─────────────────────────────────────────
        ff.fidget_score = compute_hyperactivity_score(head_v, self._head_velocities)
        ff.hyperactivity_level = self._classify_hyperactivity(ff.fidget_score)

        # ── EYE CONTACT (ASD MARKER) ──────────────────────────────
        ff.eye_contact_score = compute_eye_contact_score(
            gaze_h, gaze_v, ff.head_yaw, ff.head_pitch
        )

        # ── STRESS HEURISTIC ──────────────────────────────────────
        ff.stress_score = compute_stress_heuristic(
            avg_ear, ff.mouth_open_ratio,
            ff.eyebrow_raise_score, ff.face_symmetry_score, ff.head_pitch
        )
        ff.stress_level = self._classify_stress(ff.stress_score)
        ff.facial_tension_score = round(1.0 - ff.face_symmetry_score, 4)

        # ── ENGAGEMENT HEURISTIC ───────────────────────────────────
        ff.engagement_score = compute_engagement_heuristic(
            avg_ear, ff.head_yaw, ff.head_pitch, ff.mouth_open_ratio
        )

        # ── ATTENTION ─────────────────────────────────────────────
        if ff.look_away:
            self._consecutive_dist += 1
        else:
            self._consecutive_dist = 0

        ff.attention_score = compute_attention_score(
            ff.look_away, avg_ear, ff.engagement_score, self._consecutive_dist
        )
        ff.attention_state = "attentive" if ff.attention_score > 0.5 else "distracted"
        self._attention_history.append(ff.attention_score)

        # ── ADHD MARKERS ──────────────────────────────────────────
        ff.sustained_attention_score = round(
            float(np.mean(list(self._attention_history))), 4
        )
        ff.impulsivity_score = round(
            min(ff.head_movement_velocity / 50.0 + (1.0 - ff.attention_score) * 0.3, 1.0), 4
        )

        # ── MODEL INFERENCE ───────────────────────────────────────
        face_crop = self._get_face_crop(frame, landmarks, w, h)
        if face_crop is not None and self.model_engine is not None:
            try:
                # Emotion
                em_result = self.model_engine.run("emotion", face_crop)
                ff.emotion = em_result["prediction"]
                ff.emotion_confidence = em_result["confidence"]
                ff.emotion_probabilities = em_result["probabilities"]

                # ASD
                asd_result = self.model_engine.run("asd", face_crop)
                ff.asd_risk = asd_result["prediction"]
                ff.asd_confidence = asd_result["probabilities"].get("autism", 0.0)

                # ADHD (use engagement model as proxy if no dedicated model)
                adhd_result = self.model_engine.run("adhd", face_crop)
                ff.adhd_risk = adhd_result["prediction"]
                ff.adhd_confidence = adhd_result["probabilities"].get("adhd", 0.0)

                # Engagement
                eng_result = self.model_engine.run("engagement", face_crop)
                ff.engagement = eng_result["prediction"]
                ff.engagement_probabilities = eng_result["probabilities"]

            except Exception as e:
                ff.alert_flags.append(f"model_inference_error: {str(e)[:50]}")
        else:
            # No model: derive from heuristics
            ff.emotion = "neutral"
            ff.asd_risk = "unknown"
            ff.adhd_risk = "unknown"
            ff.engagement = "engaged" if ff.engagement_score > 0.5 else "not_engaged"

        # ── ASD HEURISTIC MARKERS ──────────────────────────────────
        ff.social_smile_detected = (ff.emotion == "happy" and ff.eye_contact_score > 0.6)

        # ── COMPOSITE RISK ────────────────────────────────────────
        ff.composite_disability_risk = compute_composite_risk(ff)

        # ── ALERT FLAGS ───────────────────────────────────────────
        if ff.eye_contact_score < 0.3:
            ff.alert_flags.append("LOW_EYE_CONTACT")
        if ff.stress_score > 0.7:
            ff.alert_flags.append("HIGH_STRESS")
        if ff.fidget_score > 0.7:
            ff.alert_flags.append("HIGH_HYPERACTIVITY")
        if ff.sustained_attention_score < 0.3:
            ff.alert_flags.append("POOR_SUSTAINED_ATTENTION")
        if ff.asd_confidence > 0.7:
            ff.alert_flags.append("ASD_RISK_HIGH")
        if ff.adhd_confidence > 0.7:
            ff.alert_flags.append("ADHD_RISK_HIGH")

        return ff

    def process_video(self, video_path: str,
                       sample_every_n_frames: int = 3,
                       max_frames: int = 3000) -> VideoSummary:
        """
        Process a complete video file and return VideoSummary.
        
        Args:
            video_path:            Path to video file
            sample_every_n_frames: Skip frames for speed (3 = analyze every 3rd frame)
            max_frames:            Maximum frames to process
        
        Returns:
            VideoSummary with all aggregated metrics
        """
        self.reset()
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames_video = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = total_frames_video / fps

        frame_idx = 0
        processed = 0
        self._frame_features_list = []

        print(f"📹 Processing video: {duration_sec:.1f}s, {fps:.1f}fps, {total_frames_video} frames")

        try:
            while cap.isOpened() and processed < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % sample_every_n_frames == 0:
                    ts = frame_idx / fps
                    ff = self.extract_frame_features(frame, frame_idx, ts, fps)
                    self._frame_features_list.append(ff)
                    processed += 1

                    if processed % 100 == 0:
                        print(f"  ⚙️  Processed {processed} frames ({ts:.1f}s / {duration_sec:.1f}s)")

                frame_idx += 1
        finally:
            cap.release()

        print(f"✅ Feature extraction complete: {processed} frames analyzed")
        return self._build_summary(duration_sec, fps)

    def _build_summary(self, duration_sec: float, fps: float) -> VideoSummary:
        """Aggregate frame-level features into VideoSummary."""
        ffl = self._frame_features_list
        if not ffl:
            return VideoSummary()

        face_frames = [f for f in ffl if f.face_detected]
        s = VideoSummary()
        s.duration_sec       = round(duration_sec, 2)
        s.total_frames       = len(ffl)
        s.frames_with_face   = len(face_frames)
        s.face_detection_rate = round(len(face_frames) / max(len(ffl), 1), 4)

        if not face_frames:
            s.alert_flags.append("NO_FACE_DETECTED")
            return s

        def mean_field(field_name):
            vals = [getattr(f, field_name) for f in face_frames
                    if isinstance(getattr(f, field_name), (int, float))]
            return round(float(np.mean(vals)), 4) if vals else 0.0

        def dominant(field_name):
            vals = [getattr(f, field_name) for f in face_frames
                    if isinstance(getattr(f, field_name), str) and getattr(f, field_name) not in ("unknown", "")]
            if not vals:
                return "unknown"
            from collections import Counter
            return Counter(vals).most_common(1)[0][0]

        s.mean_engagement_score    = mean_field("engagement_score")
        s.mean_attention_score     = mean_field("attention_score")
        s.mean_stress_score        = mean_field("stress_score")
        s.mean_asd_confidence      = mean_field("asd_confidence")
        s.mean_adhd_confidence     = mean_field("adhd_confidence")
        s.mean_eye_contact_score   = mean_field("eye_contact_score")
        s.mean_hyperactivity_score = mean_field("fidget_score")

        s.dominant_emotion    = dominant("emotion")
        s.dominant_engagement = dominant("engagement")
        s.dominant_attention  = dominant("attention_state")
        s.dominant_stress     = dominant("stress_level")

        s.look_away_total_sec  = round(self._look_away_frames / fps, 2)
        s.look_away_events     = self._look_away_events
        s.blink_rate_per_min   = round(self._total_blinks / max(duration_sec / 60.0, 0.01), 2)
        s.distraction_events   = self._look_away_events

        s.hyperactivity_episodes = sum(
            1 for f in face_frames if f.hyperactivity_level == "hyperactive"
        )

        # ASD
        s.eye_contact_deficit      = s.mean_eye_contact_score < 0.35
        s.flat_affect_detected     = (s.dominant_emotion in ["neutral"] and
                                      s.mean_eye_contact_score < 0.4)
        s.repetitive_motion_detected = s.mean_hyperactivity_score > 0.6

        # ADHD
        s.sustained_attention_failure = s.mean_attention_score < 0.4
        s.high_impulsivity = mean_field("impulsivity_score") > 0.6
        s.attention_switch_rate = round(s.look_away_events / max(duration_sec / 60.0, 0.01), 2)

        # Composite risk
        s.composite_disability_risk = round(
            s.mean_asd_confidence * 0.25 +
            s.mean_adhd_confidence * 0.25 +
            s.mean_stress_score * 0.10 +
            s.mean_hyperactivity_score * 0.15 +
            (1.0 - s.mean_eye_contact_score) * 0.15 +
            (1.0 - s.mean_attention_score) * 0.10,
            4
        )

        # Risk category
        if s.composite_disability_risk < 0.30:
            s.risk_category = "low"
        elif s.composite_disability_risk < 0.60:
            s.risk_category = "moderate"
        else:
            s.risk_category = "high"

        # Recommendations
        if s.eye_contact_deficit:
            s.recommended_followup.append("ASD_EVALUATION: Reduced eye contact detected")
        if s.sustained_attention_failure:
            s.recommended_followup.append("ADHD_EVALUATION: Poor sustained attention")
        if s.mean_stress_score > 0.6:
            s.recommended_followup.append("ANXIETY_SCREENING: High stress indicators")
        if s.repetitive_motion_detected:
            s.recommended_followup.append("ASD_EVALUATION: Repetitive movement patterns")
        if s.high_impulsivity:
            s.recommended_followup.append("ADHD_EVALUATION: High impulsivity markers")
        if s.blink_rate_per_min < 8:
            s.recommended_followup.append("EYE_HEALTH: Low blink rate (screen fatigue)")

        # Alert flags
        all_flags = []
        for f in face_frames:
            all_flags.extend(f.alert_flags)
        from collections import Counter
        flag_counts = Counter(all_flags)
        s.alert_flags = [f"{flag}(×{cnt})" for flag, cnt in flag_counts.most_common(10)]

        # Build timeline (per-second aggregates)
        max_ts = int(duration_sec) + 1
        for sec in range(max_ts):
            sec_frames = [f for f in face_frames
                          if int(f.timestamp_sec) == sec]
            if sec_frames:
                s.timeline.append({
                    "second":       sec,
                    "engagement":   round(np.mean([f.engagement_score for f in sec_frames]), 3),
                    "attention":    round(np.mean([f.attention_score for f in sec_frames]), 3),
                    "stress":       round(np.mean([f.stress_score for f in sec_frames]), 3),
                    "eye_contact":  round(np.mean([f.eye_contact_score for f in sec_frames]), 3),
                    "hyperactivity":round(np.mean([f.fidget_score for f in sec_frames]), 3),
                    "look_away":    any(f.look_away for f in sec_frames),
                    "emotion":      max(set([f.emotion for f in sec_frames]),
                                        key=[f.emotion for f in sec_frames].count),
                })

        return s

    def get_frame_features_list(self) -> List[Dict]:
        """Return all frame features as list of dicts (for JSON serialization)."""
        return [asdict(f) for f in self._frame_features_list]

    def close(self):
        self.face_mesh.close()
        self.face_detector.close()