"""
utils/groq_api.py
Sends aggregated neuro-cognitive assessment data to the Groq LLM and
returns a rich, structured JSON diagnostic report.
"""
from __future__ import annotations

import json
import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
MODEL        = "llama-3.1-8b-instant"

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = (
    "You are a Senior Child Neuropsychologist and Developmental Specialist. "
    "You only respond with valid JSON — no markdown fences, no preamble."
)

_USER_PROMPT_TEMPLATE = """
You are analyzing a child's neuro-cognitive assessment data collected from six
digital test modules: Mathematics, Reading/Speech, Emotion Recognition, Memory &
Visual Cognition, Auditory Processing, and Handwriting Analysis.

Your task is to produce a deeply personalised, clinically accurate, and warmly
written developmental report structured as the JSON schema below.

═══════════════════════════════════════════════════════════════════════════════
RAW ASSESSMENT DATA
═══════════════════════════════════════════════════════════════════════════════
{report_json}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

SECTION 1 — RISK SCREENINGS
Evaluate ALL eight conditions: Dyslexia, Dysgraphia, Dyscalculia,
Auditory Processing Disorder (APD), ADHD, Non-Verbal Learning Disability (NVLD),
Autism Spectrum Disorder (ASD), and Anxiety.

For each condition provide:
  • status          : "Not Detected" | "Low Risk" | "Medium Risk" | "High Risk"
  • finding         : A specific, data-driven sentence referencing actual scores
  • biological_cause: One-sentence neurological/cognitive mechanism ("why")

SECTION 2 — CHILD INTEREST PROFILE
Based on performance patterns, infer:
  • areas_of_natural_interest: e.g. Arts & Creativity, Science & Logic,
    Sports & Movement, Music & Rhythm, Language & Storytelling
  • Each interest must include the data cue that suggests it
  • interest_note: A warm, 2-3 sentence paragraph for the parent explaining
    what this child's brain naturally gravitates toward

SECTION 3 — DETAILED DEVELOPMENTAL PROFILE
  strengths (4-5 items):
    • area: brief label
    • detail: 2-3 sentences explaining what the child does well and why it matters
    • excels_in: a concrete real-world example ("e.g., would likely excel at...")

  areas_for_growth (4-5 items):
    • area: brief label
    • detail: 2-3 sentences explaining the specific cognitive bottleneck
    • lags_behind: a concrete observation of where this shows up in daily life

  special_note: A warm, affirming 3-4 sentence paragraph starting with
    "Every child is unique..." that celebrates this specific child's profile
    without minimising their challenges. Reference their actual strengths.

SECTION 4 — PARENTAL GUIDANCE
  parent_instructions (5-7 items):
    • Each is a concrete, actionable do/don't with a brief "because..." explanation
    • Written in plain, warm language (not medical jargon)
    • Example: "Give one instruction at a time — because multi-step verbal
      directions can overwhelm auditory processing."

  environmental_adjustments (3-4 items):
    • Physical or routine changes for the home/school environment

SECTION 5 — REAL-LIFE ACTIVITY PLAN (6-8 activities)
  Each activity must be:
    • Gamified, fun, and doable at home
    • Mapped to a specific cognitive deficit found in the data
    • Written as parent-friendly step-by-step instructions (3-5 steps)
    • Assigned a frequency (daily / 3x week / weekly)
    • Given a "fun_name" that a child would enjoy
    • Include expected_benefit: what cognitive skill this builds

SECTION 6 — PROFESSIONAL THERAPY RECOMMENDATIONS (3-5 items)
  For each therapy:
    • therapy_name
    • session_frequency: e.g. "2x per week"
    • reason: Why this child specifically needs it (data-driven)
    • what_to_tell_therapist: 1-2 sentences for the parent to communicate

SECTION 7 — RISK SUMMARY
  • overall_risk_level: "Low" | "Moderate" | "High"
  • priority_areas: Top 2-3 areas needing immediate attention
  • positive_outlook: 2-3 sentences about prognosis if interventions are followed

═══════════════════════════════════════════════════════════════════════════════
REQUIRED JSON SCHEMA (return ONLY this JSON, nothing else)
═══════════════════════════════════════════════════════════════════════════════
{{
  "screenings": [
    {{
      "disability": "string",
      "status": "string",
      "finding": "string",
      "biological_cause": "string"
    }}
  ],
  "child_interest_profile": {{
    "areas_of_natural_interest": [
      {{ "interest": "string", "data_cue": "string" }}
    ],
    "interest_note": "string"
  }},
  "child_profile": {{
    "strengths": [
      {{
        "area": "string",
        "detail": "string",
        "excels_in": "string"
      }}
    ],
    "areas_for_growth": [
      {{
        "area": "string",
        "detail": "string",
        "lags_behind": "string"
      }}
    ],
    "special_note": "string"
  }},
  "parental_guidance": {{
    "parent_instructions": [
      {{ "instruction": "string", "because": "string" }}
    ],
    "environmental_adjustments": ["string"]
  }},
  "intervention_plan": {{
    "daily_activities": [
      {{
        "fun_name": "string",
        "goal": "string",
        "targets_deficit": "string",
        "frequency": "string",
        "instructions": ["string"],
        "expected_benefit": "string"
      }}
    ],
    "therapeutic_recommendations": [
      {{
        "therapy": "string",
        "session_frequency": "string",
        "reason": "string",
        "what_to_tell_therapist": "string"
      }}
    ]
  }},
  "risk_summary": {{
    "overall_risk_level": "string",
    "priority_areas": ["string"],
    "positive_outlook": "string"
  }}
}}
"""


# ---------------------------------------------------------------------------
# Payload trimmer — removes large arrays that blow the 413 token limit
# ---------------------------------------------------------------------------

def _trim_for_llm(data: dict) -> dict:
    """
    Strips verbose/large fields from the aggregated report before sending
    to Groq.  The LLM only needs summary scores and labels — not per-frame
    timelines, probability vectors, or raw audio features.
    """
    import copy
    trimmed = copy.deepcopy(data)

    # ── video_analysis: drop timeline & per-frame arrays ─────────────────
    va = trimmed.get("video_analysis", {})
    for key in ("timeline", "alert_flags", "recommended_followup"):
        va.pop(key, None)
    # Keep only the scalar summary fields
    scalar_keys = {
        "duration_sec", "face_detection_rate",
        "mean_engagement_score", "mean_attention_score", "mean_stress_score",
        "mean_eye_contact_score", "mean_hyperactivity_score",
        "mean_asd_confidence", "mean_adhd_confidence",
        "dominant_emotion", "dominant_engagement", "dominant_attention",
        "dominant_stress", "look_away_events", "look_away_total_sec",
        "blink_rate_per_min", "distraction_events", "hyperactivity_episodes",
        "eye_contact_deficit", "flat_affect_detected", "repetitive_motion_detected",
        "sustained_attention_failure", "high_impulsivity", "attention_switch_rate",
        "composite_disability_risk", "risk_category",
    }
    trimmed["video_analysis"] = {k: v for k, v in va.items() if k in scalar_keys}

    # ── reading: drop raw audio feature dicts (keep combined + risk) ─────
    reading = trimmed.get("reading", {})
    for key in ("audio_1_features", "audio_2_features"):
        reading.pop(key, None)

    # ── emotion: drop per-question breakdown ──────────────────────────────
    trimmed.get("emotion", {}).pop("question_analysis", None)

    # ── math: drop per-question breakdown ─────────────────────────────────
    trimmed.get("math", {}).pop("question_analysis", None)

    # ── cognition / hearing: drop raw feature arrays ──────────────────────
    trimmed.get("cognition", {}).pop("test6_times", None)
    trimmed.get("hearing",   {}).pop("features", None)

    return trimmed


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def send_to_groq(report_json: dict) -> dict | None:
    """
    Send aggregated assessment JSON to Groq and return parsed LLM report dict.

    Returns None on failure so callers can handle gracefully.
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set. Cannot generate LLM report.")
        return None

    # ✅ FIX: trim payload before building prompt to avoid 413 Payload Too Large
    trimmed = _trim_for_llm(report_json)

    prompt = _USER_PROMPT_TEMPLATE.format(
        report_json=json.dumps(trimmed, indent=2)
    )

    # Safety check: warn if prompt is still very large
    prompt_chars = len(prompt)
    if prompt_chars > 20_000:
        logger.warning(
            "Groq prompt is %d chars after trimming — consider reducing further.",
            prompt_chars,
        )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        "temperature": 0.15,
        "max_tokens":  4096,
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error("Groq API request failed: %s", exc)
        return None

    raw_content = response.json()["choices"][0]["message"]["content"]

    # Strip accidental markdown fences
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[-1] if cleaned.count("```") >= 2 else cleaned
        cleaned = cleaned.replace("json", "", 1).strip().rstrip("`").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Groq JSON response: %s\nRaw: %s", exc, raw_content[:500])
        return None