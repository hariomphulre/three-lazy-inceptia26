class MetricsEngine:
    @staticmethod
    def compute_all(eeg, behavior, vision):
        theta = eeg["theta"]
        beta = eeg["low_beta"]
        alpha = eeg["low_alpha"] + eeg["high_alpha"]

        tbr = theta / beta if beta else 0
        focus = 1 - (vision["gaze_deviation"] * 0.5 + behavior["idle_ratio"] * 0.3)

        return {
            "theta_beta_ratio": round(tbr, 2),
            "focus_ratio": round(max(0, min(1, focus)), 2),
            "hyperactivity_index": round(
                behavior["jerk_avg"] * 10 + vision["yaw_velocity"], 2
            )
        }
