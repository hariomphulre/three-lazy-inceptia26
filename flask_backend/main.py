"""
main.py - Video-based cognitive feature extraction pipeline.
Processes a recorded session video and returns 12 normalised cognitive metrics.
"""
import logging

import cv2
import numpy as np

from behavioral_processor import BehavioralProcessor
from metrics_engine import MetricsEngine
from signal_generator import EEGSimulator

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FRAME_SKIP = 3          # Process every Nth frame for speed
BLINK_MIN_CLOSED = 2    # Minimum consecutive "eye-closed" frames to count blink
GAZE_DISTRACTED_THR = 0.5  # Gaze deviation threshold for simulated EEG state


def _get_gaze_ratio(eye_roi: np.ndarray) -> float:
    """
    Estimate horizontal gaze position within the eye ROI.

    Returns a value in [0, 1]: 0 = far left, 0.5 = centre, 1 = far right.
    Falls back to 0.5 (neutral) on any error.
    """
    try:
        gray_eye = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)
        h, w = gray_eye.shape
        if h == 0 or w == 0:
            return 0.5
        # Crop top 30 % to remove eyebrow artefacts
        gray_eye = gray_eye[int(h * 0.3):, :]
        gray_eye = cv2.equalizeHist(gray_eye)
        _, _, min_loc, _ = cv2.minMaxLoc(gray_eye)
        return min_loc[0] / w
    except Exception:
        return 0.5


def _load_cascades():
    """Load Haar cascades; raise RuntimeError if files are missing."""
    face_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    eye_path  = cv2.data.haarcascades + "haarcascade_eye.xml"

    face_cascade = cv2.CascadeClassifier(face_path)
    eye_cascade  = cv2.CascadeClassifier(eye_path)

    if face_cascade.empty() or eye_cascade.empty():
        raise RuntimeError("Could not load Haar cascade files from OpenCV data directory.")

    return face_cascade, eye_cascade


def _analyse_frame(
    frame: np.ndarray,
    gray: np.ndarray,
    face_cascade,
    eye_cascade,
    blink_counter: int,
    eyes_closed_frames: int,
) -> tuple[dict, int, int]:
    """
    Extract vision metrics from a single frame.

    Returns:
        vision_metrics  (dict)
        blink_counter   (int, updated)
        eyes_closed_frames (int, updated)
    """
    width = frame.shape[1]
    vision_metrics = {
        "yaw_velocity": 0.0,
        "gaze_deviation": 0.0,
        "blink_count": blink_counter,
    }

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)

    for (x, y, w, h) in faces:
        # Yaw (head turn) estimation via face-centre offset
        face_centre_x = x + w / 2
        yaw_raw = (face_centre_x - width / 2) / (width / 2)
        vision_metrics["yaw_velocity"] = abs(yaw_raw) * 100.0

        roi_gray = gray[y : y + h, x : x + w]
        eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=5)

        if len(eyes) == 0:
            eyes_closed_frames += 1
        else:
            if eyes_closed_frames > BLINK_MIN_CLOSED:
                blink_counter += 1
            eyes_closed_frames = 0

            gaze_offsets = [
                abs(_get_gaze_ratio(frame[y + ey : y + ey + eh, x + ex : x + ex + ew]) - 0.5)
                for (ex, ey, ew, eh) in eyes
                if ey < h / 2  # Only use eyes in upper half of face ROI
            ]
            if gaze_offsets:
                vision_metrics["gaze_deviation"] = float(np.mean(gaze_offsets)) * 2.0

        # Only process the first (largest) detected face
        break

    vision_metrics["blink_count"] = blink_counter
    return vision_metrics, blink_counter, eyes_closed_frames


# ---------------------------------------------------------------------------
# Default behavioural mock (used because no live HID data in video pipeline)
# ---------------------------------------------------------------------------
_MOCK_BEHAVIOR: dict = {
    "velocity_avg":    0.8,
    "jerk_avg":        0.2,
    "idle_ratio":      0.1,
    "flight_time_var": 150.0,
    "error_rate":      0.02,
    "dwell_time_avg":  0.1,
}


def process_video_logic(video_path: str) -> dict:
    """
    Run full cognitive analysis on a session video.

    Args:
        video_path: Absolute path to the downloaded video file.

    Returns:
        dict with 12 normalised cognitive metric keys, or {"error": "..."}.
    """
    logger.info("[VIDEO] Starting analysis: %s", video_path)

    face_cascade, eye_cascade = _load_cascades()
    eeg_sim = EEGSimulator()

    blink_counter      = 0
    eyes_closed_frames = 0
    session_logs: list[dict] = []
    frame_count = 0

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error("Cannot open video file: %s", video_path)
        return {"error": f"Could not open video file: {video_path}"}

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % FRAME_SKIP != 0:
                continue

            # Flip horizontally (mirror) for front-facing cameras
            frame = cv2.flip(frame, 1)
            gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Vision analysis
            vision_metrics, blink_counter, eyes_closed_frames = _analyse_frame(
                frame, gray, face_cascade, eye_cascade,
                blink_counter, eyes_closed_frames,
            )

            # Simulated EEG state based on gaze
            eeg_state = (
                "DISTRACTED"
                if vision_metrics["gaze_deviation"] > GAZE_DISTRACTED_THR
                else "FOCUSED"
            )
            eeg_epoch = eeg_sim.generate_epoch(state=eeg_state)

            # Compute 12 cognitive metrics
            frame_report = MetricsEngine.compute_all(
                eeg_epoch, _MOCK_BEHAVIOR, vision_metrics
            )
            session_logs.append(frame_report)

    except Exception as exc:
        logger.exception("Error during frame processing")
        return {"error": str(exc)}
    finally:
        cap.release()

    if not session_logs:
        logger.warning("No frames were analysed for video: %s", video_path)
        return {"error": "No frames could be analysed from the video"}

    # Aggregate all frame metrics into session averages
    metric_keys = session_logs[0].keys()
    final_analysis = {
        key: round(float(np.mean([log[key] for log in session_logs])), 2)
        for key in metric_keys
    }

    logger.info(
        "[VIDEO] Analysis complete — %d frames processed, %d analysed",
        frame_count,
        len(session_logs),
    )
    return final_analysis