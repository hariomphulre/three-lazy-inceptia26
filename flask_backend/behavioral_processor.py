"""
behavioral_processor.py
Extracts biometric keystroke and mouse features from raw HID (Human Interface Device) logs.
"""
import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class BehavioralProcessor:
    """
    Processes raw HID event logs into normalised behavioural feature vectors
    suitable for downstream ML models and cognitive-metrics engines.
    """

    # Thresholds
    _IDLE_VELOCITY_THRESHOLD_PX_MS = 0.1  # px/ms below which mouse is considered idle

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def process_keystrokes(self, key_logs: list[tuple[float, str, str]]) -> dict[str, float]:
        """
        Derive keystroke-dynamics features from raw key event logs.

        Args:
            key_logs: List of (timestamp_ms, key_name, event_type) tuples.
                      event_type must be one of "PRESS" or "RELEASE".

        Returns:
            {
                "flight_time_var":  variance of inter-keystroke intervals (ms²),
                "error_rate":       ratio of BACKSPACE events to total events,
                "dwell_time_avg":   mean key-hold duration (ms),
            }
        """
        _empty: dict[str, float] = {
            "flight_time_var": 0.0,
            "error_rate": 0.0,
            "dwell_time_avg": 0.0,
        }

        if not key_logs or len(key_logs) < 2:
            return _empty

        flight_times: list[float] = []
        dwell_times:  list[float] = []
        errors = 0
        total  = len(key_logs)

        # Build a simple key-down registry to match PRESS → RELEASE pairs
        key_down: dict[str, float] = {}

        for timestamp, key, event_type in key_logs:
            event_type = event_type.upper()

            if event_type == "PRESS":
                key_down[key] = timestamp
                if key == "BACKSPACE":
                    errors += 1

            elif event_type == "RELEASE":
                if key in key_down:
                    dwell = timestamp - key_down.pop(key)
                    if dwell >= 0:
                        dwell_times.append(dwell)

        # Flight times: gap between consecutive events (any type)
        timestamps = [entry[0] for entry in key_logs]
        flight_times = [
            timestamps[i] - timestamps[i - 1]
            for i in range(1, len(timestamps))
            if timestamps[i] - timestamps[i - 1] >= 0
        ]

        return {
            "flight_time_var": float(np.var(flight_times)) if flight_times else 0.0,
            "dwell_time_avg":  float(np.mean(dwell_times)) if dwell_times else 0.0,
            "error_rate":      errors / total if total > 0 else 0.0,
        }

    def process_mouse(self, mouse_logs: list[tuple[float, float, float]]) -> dict[str, float]:
        """
        Derive mouse-dynamics features from raw pointer movement logs.

        Args:
            mouse_logs: List of (timestamp_ms, x_px, y_px) tuples.

        Returns:
            {
                "velocity_avg": mean pointer speed (px/ms),
                "jerk_avg":     mean absolute jerk (rate of acceleration change),
                "idle_ratio":   fraction of time the pointer was stationary,
            }
        """
        _empty: dict[str, float] = {
            "velocity_avg": 0.0,
            "jerk_avg": 0.0,
            "idle_ratio": 1.0,
        }

        if not mouse_logs or len(mouse_logs) < 2:
            return _empty

        velocities:   list[float] = []
        idle_frames = 0

        for i in range(1, len(mouse_logs)):
            t1, x1, y1 = mouse_logs[i - 1]
            t2, x2, y2 = mouse_logs[i]

            dt   = max(t2 - t1, 1e-3)   # avoid division by zero
            dist = float(np.hypot(x2 - x1, y2 - y1))
            vel  = dist / dt

            if vel < self._IDLE_VELOCITY_THRESHOLD_PX_MS:
                idle_frames += 1

            velocities.append(vel)

        # Jerk = second derivative of velocity (change of acceleration)
        accelerations = np.diff(velocities).tolist()
        jerks         = np.diff(accelerations).tolist()

        return {
            "velocity_avg": float(np.mean(velocities)),
            "jerk_avg":     float(np.mean(np.abs(jerks))) if jerks else 0.0,
            "idle_ratio":   idle_frames / len(mouse_logs),
        }