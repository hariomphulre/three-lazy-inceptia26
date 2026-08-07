"""
metrics_engine.py
Computes 12 high-level cognitive metrics from fused EEG, behavioural, and vision data.

All output values are in deterministic, bounded ranges documented per-metric.
"""
import logging

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

def _safe_div(numerator: float, denominator: float, fallback: float = 0.0) -> float:
    """Division that returns *fallback* instead of raising ZeroDivisionError."""
    return numerator / denominator if denominator > 0 else fallback


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Clamp *value* to [lo, hi]."""
    return max(lo, min(hi, value))


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class MetricsEngine:
    """
    Static computation engine.  All methods are pure functions – no state is kept.

    Expected input schemas
    ----------------------
    eeg_power : dict
        Keys (all float):
            delta, theta, low_alpha, high_alpha,
            low_beta, high_beta, low_gamma, mid_gamma
    behavior_metrics : dict
        Keys (all float):
            velocity_avg, jerk_avg, idle_ratio,
            flight_time_var, error_rate, dwell_time_avg
    vision_metrics : dict
        Keys (all float):
            yaw_velocity, gaze_deviation, blink_count

    Output
    ------
    dict with 12 float keys (see *compute_all* docstring).
    """

    # Motor-fatigue normalisation constant (empirically calibrated)
    _ALPHA_MOTOR_NORM = 20_000.0
    # Distraction estimate: seconds of distraction per minute of session
    _DISTRACTION_WINDOW_SEC = 60.0

    @staticmethod
    def compute_all(
        eeg_power: dict[str, float],
        behavior_metrics: dict[str, float],
        vision_metrics: dict[str, float],
    ) -> dict[str, float]:
        """
        Compute all 12 cognitive metrics and return them as a flat dict.

        Metric descriptions
        -------------------
        engagement_score        : 0–∞  higher = more engaged (beta / (theta+alpha))
        motor_fatigue_rate      : 0–1  higher = more fatigue during active movement
        focus_ratio             : 0–1  higher = more focused
        hyperactivity_index     : 0–∞  higher = more motor restlessness
        theta_beta_ratio        : 0–∞  ADHD marker; clinical norm ≈ 1.0–2.5
        lookaway_frequency      : 0–∞  estimated look-away events per minute
        cognitive_load_index    : 0–∞  higher = heavier cognitive load (gamma/theta)
        stress_index            : 0–∞  higher = more stress (high_beta / alpha)
        head_stability          : 0–100 higher = steadier head
        writing_consistency_score : 0–1 higher = more consistent writing
        blink_variability       : 0–1  placeholder; requires time-series expansion
        distraction_time_sec    : 0–60 estimated distracted seconds per minute
        """
        # ------------------------------------------------------------------
        # 1.  EEG band extraction
        # ------------------------------------------------------------------
        theta     = float(eeg_power.get("theta", 0))
        low_beta  = float(eeg_power.get("low_beta", 0))
        high_beta = float(eeg_power.get("high_beta", 0))
        low_alpha = float(eeg_power.get("low_alpha", 0))
        high_alpha = float(eeg_power.get("high_alpha", 0))
        low_gamma = float(eeg_power.get("low_gamma", 0))
        mid_gamma = float(eeg_power.get("mid_gamma", 0))

        alpha = low_alpha + high_alpha
        gamma = low_gamma + mid_gamma

        # ------------------------------------------------------------------
        # 2.  Behaviour extraction
        # ------------------------------------------------------------------
        velocity_avg    = float(behavior_metrics.get("velocity_avg", 0))
        jerk_avg        = float(behavior_metrics.get("jerk_avg", 0))
        idle_ratio      = float(behavior_metrics.get("idle_ratio", 0))
        flight_time_var = float(behavior_metrics.get("flight_time_var", 0))
        error_rate      = float(behavior_metrics.get("error_rate", 0))

        # ------------------------------------------------------------------
        # 3.  Vision extraction
        # ------------------------------------------------------------------
        yaw_velocity   = abs(float(vision_metrics.get("yaw_velocity", 0)))
        gaze_deviation = float(vision_metrics.get("gaze_deviation", 0))

        # ------------------------------------------------------------------
        # 4.  Metric calculations
        # ------------------------------------------------------------------

        # Theta/Beta Ratio — ADHD marker (higher → worse)
        tbr = _safe_div(theta, low_beta)

        # Cognitive Load Index — gamma (processing) vs theta (drift)
        cli = _safe_div(gamma, theta)

        # Stress Index — high beta (anxiety) vs alpha (relaxation)
        stress_index = _safe_div(high_beta, alpha)

        # Engagement Score — beta / (theta + alpha)
        engagement = _safe_div(low_beta, theta + alpha)

        # Motor Fatigue — alpha elevation during active hand movement
        motor_fatigue = 0.0
        if velocity_avg > 1.0:
            motor_fatigue = _clamp(alpha / MetricsEngine._ALPHA_MOTOR_NORM)

        # Hyperactivity Index — mouse jerk + head movement
        hyperactivity = (jerk_avg * 10.0) + yaw_velocity

        # Focus Ratio — reduced by gaze deviation and mouse idleness
        lookaway_penalty = gaze_deviation * 0.5
        idle_penalty     = idle_ratio * 0.3
        focus_ratio      = _clamp(1.0 - (lookaway_penalty + idle_penalty))

        # Writing Consistency — high error rate + high flight-time variance → worse
        writing_inconsistency   = (error_rate * 2.0) + (flight_time_var / 1_000.0)
        writing_consistency_score = _clamp(1.0 - writing_inconsistency)

        # Head Stability — inverted yaw velocity (0–100)
        head_stability = _clamp(100.0 - yaw_velocity, 0.0, 100.0)

        # Lookaway Frequency — proxy events per minute
        lookaway_frequency = round(gaze_deviation * 10.0, 1)

        # Distraction Time — fraction of a minute spent distracted
        distraction_time_sec = round(
            (1.0 - focus_ratio) * MetricsEngine._DISTRACTION_WINDOW_SEC, 1
        )

        # ------------------------------------------------------------------
        # 5.  Return structured result
        # ------------------------------------------------------------------
        return {
            "engagement_score":           round(engagement, 2),
            "motor_fatigue_rate":         round(motor_fatigue, 2),
            "focus_ratio":                round(focus_ratio, 2),
            "hyperactivity_index":        round(hyperactivity, 2),
            "theta_beta_ratio":           round(tbr, 2),
            "lookaway_frequency":         lookaway_frequency,
            "cognitive_load_index":       round(cli, 2),
            "stress_index":               round(stress_index, 2),
            "head_stability":             round(head_stability, 1),
            "writing_consistency_score":  round(writing_consistency_score, 2),
            "blink_variability":          0.5,   # Placeholder – needs time-series expansion
            "distraction_time_sec":       distraction_time_sec,
        }