"""
EEG Analyzer for NeuroSky Data
Analyzes brainwave data and provides detailed child brain metrics in JSON.
"""

import pandas as pd
import numpy as np
import json


# ─────────────────────────────────────────────
# 1. DATA LOADING
# ─────────────────────────────────────────────

def load_eeg_csv(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    df.columns = [c.strip() for c in df.columns]
    return df


# ─────────────────────────────────────────────
# 2. SYNTHETIC DATA GENERATOR
# ─────────────────────────────────────────────

def generate_synthetic_eeg(n_samples: int = 300, profile: str = "normal") -> pd.DataFrame:
    """
    Generate synthetic NeuroSky-style EEG data.
    profile: 'normal' | 'focused' | 'sleepy' | 'hyperactive'
    """
    np.random.seed(42)

    profiles = {
        "normal":      dict(delta=150000, theta=50000, alpha1=30000, alpha2=20000,
                            beta1=20000,  beta2=15000,  gamma1=8000,  gamma2=10000),
        "focused":     dict(delta=80000,  theta=30000, alpha1=25000, alpha2=18000,
                            beta1=50000,  beta2=35000,  gamma1=15000, gamma2=18000),
        "sleepy":      dict(delta=350000, theta=120000, alpha1=60000, alpha2=30000,
                            beta1=10000,  beta2=8000,   gamma1=4000,  gamma2=5000),
        "hyperactive": dict(delta=60000,  theta=25000, alpha1=15000, alpha2=10000,
                            beta1=60000,  beta2=50000,  gamma1=25000, gamma2=30000),
    }

    base = profiles.get(profile, profiles["normal"])
    data = {}
    for band, mean in base.items():
        noise = np.random.lognormal(mean=np.log(mean), sigma=0.5, size=n_samples)
        data[band.capitalize()] = noise.astype(int)

    return pd.DataFrame(data)


# ─────────────────────────────────────────────
# 3. CORE ANALYSIS ENGINE
# ─────────────────────────────────────────────

def analyze_eeg(df: pd.DataFrame) -> dict:
    """Main function: takes a dataframe, returns full detailed metrics dict."""

    df.columns = [c.strip() for c in df.columns]

    required = ["Delta", "Theta", "Alpha1", "Alpha2", "Beta1", "Beta2", "Gamma1", "Gamma2"]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing column: {col}. Expected: {required}")

    n = len(df)

    # ── Raw band series ────────────────────────────
    D  = df["Delta"].values.astype(float)
    T  = df["Theta"].values.astype(float)
    A1 = df["Alpha1"].values.astype(float)
    A2 = df["Alpha2"].values.astype(float)
    B1 = df["Beta1"].values.astype(float)
    B2 = df["Beta2"].values.astype(float)
    G1 = df["Gamma1"].values.astype(float)
    G2 = df["Gamma2"].values.astype(float)

    A  = A1 + A2
    B  = B1 + B2
    G  = G1 + G2

    # ── Stats helper ──────────────────────────────
    def band_stats(arr):
        return {
            "mean":            round(float(np.mean(arr)),   2),
            "median":          round(float(np.median(arr)), 2),
            "std":             round(float(np.std(arr)),    2),
            "min":             round(float(np.min(arr)),    2),
            "max":             round(float(np.max(arr)),    2),
            "cv_percent":      round(float(np.std(arr) / (np.mean(arr) + 1e-9)) * 100, 2),
        }

    band_statistics = {
        "delta":          band_stats(D),
        "theta":          band_stats(T),
        "alpha1":         band_stats(A1),
        "alpha2":         band_stats(A2),
        "alpha_combined": band_stats(A),
        "beta1":          band_stats(B1),
        "beta2":          band_stats(B2),
        "beta_combined":  band_stats(B),
        "gamma1":         band_stats(G1),
        "gamma2":         band_stats(G2),
        "gamma_combined": band_stats(G),
    }

    # ── Global averages ────────────────────────────
    delta = float(np.mean(D))
    theta = float(np.mean(T))
    alpha = float(np.mean(A))
    beta  = float(np.mean(B))
    gamma = float(np.mean(G))
    total = delta + theta + alpha + beta + gamma + 1e-9

    # ── Band power percentages ─────────────────────
    brainwave_percentages = {
        "delta_percent": round(delta / total * 100, 2),
        "theta_percent": round(theta / total * 100, 2),
        "alpha_percent": round(alpha / total * 100, 2),
        "beta_percent":  round(beta  / total * 100, 2),
        "gamma_percent": round(gamma / total * 100, 2),
    }

    dominant_band = max(brainwave_percentages, key=brainwave_percentages.get).replace("_percent","").upper()

    band_meanings = {
        "DELTA":  "Deep slow-wave activity. Normally seen during deep sleep. High delta while awake suggests low arousal, drowsiness, or reduced cognitive engagement.",
        "THETA":  "Associated with daydreaming, light sleep, and creative thinking. Elevated theta in children can indicate inattention or a relaxed, unfocused state.",
        "ALPHA":  "Reflects a calm, relaxed, and alert state. Present when the child is resting or lightly focused. Good baseline for learning readiness.",
        "BETA":   "Linked to active thinking, concentration, and problem-solving. Higher beta means the brain is engaged and working on a task.",
        "GAMMA":  "High-frequency wave tied to peak concentration, information binding, and cognitive processing. Bursts of gamma indicate intense mental activity.",
    }

    # ── Key neuroscience ratios ────────────────────
    engagement_index  = round(beta  / (alpha + theta + 1e-9), 4)
    relaxation_index  = round(alpha / (beta  + 1e-9),         4)
    cognitive_load    = round(theta / (alpha + 1e-9),         4)
    focus_ratio       = round(beta  / (theta + 1e-9),         4)
    fatigue_index     = round((delta + theta) / (beta + 1e-9),4)
    arousal_index     = round(beta  / (alpha + 1e-9),         4)
    theta_alpha_ratio = round(theta / (alpha + 1e-9),         4)
    delta_beta_ratio  = round(delta / (beta  + 1e-9),         4)

    # ── Derived scores (0–100) ─────────────────────
    raw_attention   = (focus_ratio * 0.5 + engagement_index * 0.5)
    attention_score = round(float(np.clip(raw_attention * 20,    0, 100)), 1)
    relaxation_score = round(float(np.clip(relaxation_index * 25, 0, 100)), 1)
    workload_score  = round(float(np.clip(cognitive_load * 40,   0, 100)), 1)
    fatigue_score   = round(float(np.clip(fatigue_index * 15,    0, 100)), 1)
    arousal_score   = round(float(np.clip(arousal_index * 25,    0, 100)), 1)
    gamma_score     = round(float(np.clip((gamma / total) * 500, 0, 100)), 1)

    # ── Attention span ─────────────────────────────
    if attention_score >= 75:
        attention_label = "Excellent"
        attention_meaning = "The child's brain shows strong, sustained engagement. Beta waves are dominant over theta, meaning the brain is actively processing rather than drifting."
    elif attention_score >= 50:
        attention_label = "Good"
        attention_meaning = "The child is generally focused with occasional lapses. Beta activity is present but competes with some theta drift."
    elif attention_score >= 30:
        attention_label = "Moderate"
        attention_meaning = "Focus is inconsistent. The child's brain shows equal periods of engagement and mind-wandering. Theta is rising relative to beta."
    else:
        attention_label = "Low"
        attention_meaning = "The child's brain is in a low-engagement state. Delta and theta are dominating, which means the brain is not actively attending to tasks."

    est_focus_min = round(attention_score / 100 * 30, 1)
    if est_focus_min < 5:
        focus_duration = "Less than 5 minutes"
    elif est_focus_min < 20:
        focus_duration = f"Approximately {int(est_focus_min)} minutes"
    else:
        focus_duration = "20 to 30 minutes or more"

    # ── Relaxation ────────────────────────────────
    if relaxation_score >= 70:
        relaxation_label = "Very Relaxed"
        relaxation_meaning = "Alpha waves are strong. The child's nervous system is calm. This is the ideal pre-learning state."
    elif relaxation_score >= 45:
        relaxation_label = "Calm"
        relaxation_meaning = "The child appears relaxed. Alpha activity is healthy and balanced with beta."
    elif relaxation_score >= 25:
        relaxation_label = "Mildly Stressed"
        relaxation_meaning = "Some tension is present. Alpha is suppressed, suggesting the brain is slightly aroused or anxious."
    else:
        relaxation_label = "Stressed or Anxious"
        relaxation_meaning = "Alpha is very low. The child's brain shows signs of stress or hyperarousal."

    # ── Mental workload ───────────────────────────
    if workload_score >= 70:
        workload_label = "High Mental Effort"
        workload_meaning = "Theta is elevated relative to alpha. The brain is working hard — could be genuine deep processing or struggling with difficulty."
    elif workload_score >= 40:
        workload_label = "Moderate Mental Effort"
        workload_meaning = "Balanced theta-alpha ratio. The child is applying reasonable mental effort without being overwhelmed."
    else:
        workload_label = "Low Mental Effort"
        workload_meaning = "Theta is low relative to alpha. The task may be too easy, or the child is not mentally engaged."

    # ── Fatigue ────────────────────────────────────
    if fatigue_score >= 70:
        fatigue_label = "Very Fatigued"
        fatigue_meaning = "Delta and theta together far exceed beta. A strong sign of drowsiness or mental exhaustion."
    elif fatigue_score >= 45:
        fatigue_label = "Somewhat Tired"
        fatigue_meaning = "Slow waves are moderately elevated. The child may be losing stamina or approaching fatigue."
    else:
        fatigue_label = "Alert"
        fatigue_meaning = "Beta is strong relative to slow waves. The child's brain is awake and active."

    # ── Arousal ────────────────────────────────────
    if arousal_score >= 70:
        arousal_label = "Highly Aroused"
        arousal_meaning = "Beta strongly dominates alpha. High-activation state — could be excitement, anxiety, or intense focus."
    elif arousal_score >= 40:
        arousal_label = "Moderately Aroused"
        arousal_meaning = "Healthy balance of beta and alpha. The child is alert but not overstimulated."
    else:
        arousal_label = "Low Arousal"
        arousal_meaning = "Alpha dominates beta. The brain is in a calm or under-stimulated state."

    # ── Gamma / higher cognition ──────────────────
    if gamma_score >= 60:
        gamma_label = "High Cognitive Processing"
        gamma_meaning = "Gamma is elevated, indicating active information integration or intense concentration."
    elif gamma_score >= 30:
        gamma_label = "Moderate Cognitive Processing"
        gamma_meaning = "Gamma is at a healthy level — normal background cognitive activity."
    else:
        gamma_label = "Low Cognitive Processing"
        gamma_meaning = "Gamma is minimal, consistent with a relaxed or drowsy state."

    # ── Temporal analysis: session thirds ─────────
    third = max(n // 3, 1)
    def seg_score(b_arr, t_arr):
        b = np.mean(b_arr); t = np.mean(t_arr)
        return round(float(np.clip((b / (t + 1e-9)) * 20, 0, 100)), 1)

    early_score = seg_score(B[:third],        T[:third])
    mid_score   = seg_score(B[third:2*third], T[third:2*third])
    late_score  = seg_score(B[2*third:],      T[2*third:])

    if late_score > early_score + 10:
        attention_trend = "Improving — attention got better as the session went on."
    elif early_score > late_score + 10:
        attention_trend = "Declining — attention started higher and dropped over time."
    else:
        attention_trend = "Stable — attention stayed roughly consistent throughout."

    # ── Attention stability (beta variability) ────
    beta_cv = float(np.std(B) / (np.mean(B) + 1e-9))
    if beta_cv < 0.4:
        stability_label = "Stable"
        stability_meaning = "Beta power stayed consistent throughout — the child maintained steady engagement."
    elif beta_cv < 0.8:
        stability_label = "Somewhat Variable"
        stability_meaning = "Beta fluctuated moderately — periods of good focus interspersed with brief drifts."
    else:
        stability_label = "Highly Variable"
        stability_meaning = "Beta jumped around a lot — the child's focus was inconsistent, possibly distracted or restless."

    # ── Peak and low attention samples ────────────
    peak_idx   = int(np.argmax(B))
    trough_idx = int(np.argmin(B))

    # ── Overall brain state ───────────────────────
    if attention_score >= 65 and relaxation_score >= 40:
        overall_state = "Focused and Calm"
        overall_meaning = "The child's brain is in an optimal learning state. Beta is active for focus while alpha provides a relaxed foundation — the best zone for absorbing new information."
    elif attention_score >= 65 and relaxation_score < 40:
        overall_state = "Focused but Tense"
        overall_meaning = "The child is concentrating, but low alpha and high beta suggest stress or anxiety is present alongside the focus."
    elif attention_score < 40 and fatigue_score >= 60:
        overall_state = "Fatigued and Unfocused"
        overall_meaning = "Delta and theta are dominating. The child appears mentally exhausted — cognitive performance will be significantly reduced in this state."
    elif theta / total > 0.25:
        overall_state = "Daydreaming or Mind-Wandering"
        overall_meaning = "Theta is unusually high. The child's mind is in a passive, inward state — not actively engaging with external tasks."
    elif arousal_score >= 70 and relaxation_score < 30:
        overall_state = "Overstimulated or Anxious"
        overall_meaning = "High beta with very low alpha suggests hyperarousal — too much stimulation, too little calm."
    else:
        overall_state = "Moderate Engagement"
        overall_meaning = "Mixed brain activity — not fully focused, not fully relaxed."

    # ── Build final output ─────────────────────────
    result = {
        "session_info": {
            "total_samples": n,
            "overall_brain_state": overall_state,
            "what_it_means": overall_meaning,
            "dominant_brainwave": dominant_band,
            "dominant_brainwave_explanation": band_meanings[dominant_band],
        },

        "attention_span": {
            "score_out_of_100": attention_score,
            "label": attention_label,
            "estimated_continuous_focus_duration": focus_duration,
            "what_it_means": attention_meaning,
            "trend_over_session": attention_trend,
            "score_by_segment": {
                "early_session":  early_score,
                "mid_session":    mid_score,
                "late_session":   late_score,
            },
        },

        "attention_stability": {
            "label": stability_label,
            "coefficient_of_variation_percent": round(beta_cv * 100, 2),
            "what_it_means": stability_meaning,
            "peak_attention_at_sample":   peak_idx,
            "lowest_attention_at_sample": trough_idx,
        },

        "relaxation": {
            "score_out_of_100": relaxation_score,
            "label": relaxation_label,
            "alpha_to_beta_ratio": relaxation_index,
            "what_it_means": relaxation_meaning,
        },

        "fatigue": {
            "score_out_of_100": fatigue_score,
            "label": fatigue_label,
            "slow_to_fast_wave_ratio": fatigue_index,
            "what_it_means": fatigue_meaning,
        },

        "mental_workload": {
            "score_out_of_100": workload_score,
            "label": workload_label,
            "theta_to_alpha_ratio": cognitive_load,
            "what_it_means": workload_meaning,
        },

        "arousal_level": {
            "score_out_of_100": arousal_score,
            "label": arousal_label,
            "beta_to_alpha_ratio": arousal_index,
            "what_it_means": arousal_meaning,
        },

        "higher_cognition_gamma": {
            "score_out_of_100": gamma_score,
            "label": gamma_label,
            "gamma_percent_of_total": brainwave_percentages["gamma_percent"],
            "what_it_means": gamma_meaning,
        },

        "brainwave_distribution": {
            "delta_percent": brainwave_percentages["delta_percent"],
            "theta_percent": brainwave_percentages["theta_percent"],
            "alpha_percent": brainwave_percentages["alpha_percent"],
            "beta_percent":  brainwave_percentages["beta_percent"],
            "gamma_percent": brainwave_percentages["gamma_percent"],
            "band_explanations": {
                "delta": band_meanings["DELTA"],
                "theta": band_meanings["THETA"],
                "alpha": band_meanings["ALPHA"],
                "beta":  band_meanings["BETA"],
                "gamma": band_meanings["GAMMA"],
            },
        },

        "neuroscience_ratios": {
            "engagement_index":      engagement_index,
            "relaxation_index":      relaxation_index,
            "cognitive_load_index":  cognitive_load,
            "focus_ratio":           focus_ratio,
            "fatigue_index":         fatigue_index,
            "arousal_index":         arousal_index,
            "theta_alpha_ratio":     theta_alpha_ratio,
            "delta_beta_ratio":      delta_beta_ratio,
            "ratio_meanings": {
                "engagement_index":     "Beta / (Alpha + Theta). Higher = more cognitively engaged.",
                "relaxation_index":     "Alpha / Beta. Higher = more relaxed.",
                "cognitive_load_index": "Theta / Alpha. Higher = more mental effort being applied.",
                "focus_ratio":          "Beta / Theta. Higher = more focused, less mind-wandering.",
                "fatigue_index":        "(Delta + Theta) / Beta. Higher = more tired.",
                "arousal_index":        "Beta / Alpha. Higher = more stimulated.",
                "theta_alpha_ratio":    "Theta / Alpha. Above 1 means leaning toward drowsiness.",
                "delta_beta_ratio":     "Delta / Beta. High value = deep slow-wave dominance.",
            },
        },

        "detailed_band_statistics": band_statistics,
    }

    return result


# ─────────────────────────────────────────────
# 4. MAIN — run directly
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
        print(f"\n📂 Loading EEG data from: {csv_path}")
        df = load_eeg_csv(csv_path)
    else:
        print("\n🧪 No CSV provided — generating synthetic EEG data (profile: normal)...")
        df = generate_synthetic_eeg(n_samples=300, profile="normal")
        df.to_csv("synthetic_eeg.csv", index=False)
        print("   Saved to synthetic_eeg.csv")

    print(f"   Rows: {len(df)}  |  Columns: {list(df.columns)}\n")

    result = analyze_eeg(df)

    print("=" * 60)
    print("         EEG ANALYSIS REPORT")
    print("=" * 60)
    print(json.dumps(result, indent=2))

    out = "eeg_analysis_result.json"
    with open(out, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\n✅ Saved to {out}")