"""
screening_ai.py
Research-Aligned Screening Engine (Interim AI-Agent Mode)

Architecture:
  Phase 1 – Deterministic group selection + task plan
  Phase 2 – Per-task scoring via AIAgentScoringProvider (interim)
  Phase 2.5 – Deterministic weighted aggregation (NEVER AI)
  Phase 3 – Narrative generation only (AI given frozen domain_scores)
  Phase 4 – Persistence to screening_responses + screening_reports tables

Every score carries:
  evidence_status: "prototype_heuristic"
  rubric_version: SCORING_RUBRIC_VERSION

IMPORTANT: This is NOT a clinical diagnostic system. It is a screening
aid to flag children who may benefit from formal professional assessment.
"""

from __future__ import annotations

import json
import logging
import os
import statistics
import time
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Versioning — bump when you change any threshold or prompt
# ---------------------------------------------------------------------------
SCORING_RUBRIC_VERSION = "prototype-heuristic-v1"
EVIDENCE_STATUS = "prototype_heuristic"

# ---------------------------------------------------------------------------
# Groq config — round-robin key pool to maximise free-tier throughput
# ---------------------------------------------------------------------------
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

class _GroqKeyPool:
    """
    Thread-safe round-robin pool for up to N Groq API keys.
    Reads GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3 from env.
    With K keys the effective RPM budget is K × 30.
    """
    def __init__(self) -> None:
        raw = [
            os.getenv("GROQ_API_KEY",   "").strip(),
            os.getenv("GROQ_API_KEY_2", "").strip(),
            os.getenv("GROQ_API_KEY_3", "").strip(),
        ]
        self._keys = [k for k in raw if k]
        self._idx  = 0
        if self._keys:
            logger.info("[GroqKeyPool] %d key(s) loaded", len(self._keys))
        else:
            logger.warning("[GroqKeyPool] No Groq API keys found — AI scoring disabled")

    @property
    def available(self) -> bool:
        return bool(self._keys)

    def next_key(self) -> str:
        """Return the next key in round-robin order."""
        if not self._keys:
            return ""
        idx = self._idx % len(self._keys)
        key = self._keys[idx]
        logger.info("[GroqKeyPool] Using key index %d of %d", idx, len(self._keys))
        self._idx += 1
        return key

    @property
    def inter_call_sleep_s(self) -> float:
        """
        Sleep between consecutive LLM calls.
        With 1 key: 2.5 s  → ≤24 RPM (safe under 30 RPM limit)
        With 2 keys: 1.2 s → effectively ≤50 RPM split across 2 keys
        With 3 keys: 0.8 s → effectively ≤75 RPM split across 3 keys
        """
        n = max(len(self._keys), 1)
        return round(2.5 / n, 2)

# Module-level singleton
GROQ_POOL = _GroqKeyPool()
# Backward-compat alias used by old checks
GROQ_API_KEY = GROQ_POOL.next_key if GROQ_POOL.available else ""

# ---------------------------------------------------------------------------
# Age-group boundaries
# ---------------------------------------------------------------------------
GROUP_A_MAX_AGE = 7    # Preschool – Grade 1  (age 4–7)
GROUP_B_MAX_AGE = 12   # Grades 2–6           (age 7–12)
# Group C: Grade 6+ / age 12+

GRADE_TO_GROUP = {
    "preschool": "A", "prep": "A", "pre-k": "A", "kg": "A", "grade_1": "A",
    "grade_2": "B", "grade_3": "B", "grade_4": "B", "grade_5": "B", "grade_6": "B",
    "grade_7": "C", "grade_8": "C", "grade_9": "C", "grade_10": "C",
    "grade_11": "C", "grade_12": "C",
}

# ---------------------------------------------------------------------------
# Prototype-heuristic thresholds (labelled, versioned)
# ---------------------------------------------------------------------------
THRESHOLDS = {
    "rubric_version": SCORING_RUBRIC_VERSION,
    "evidence_status": EVIDENCE_STATUS,
    "reading": {
        "phonological_awareness":  {"low_risk": 0.80, "moderate_risk": 0.55},
        "decoding_fluency":         {"low_risk": 0.75, "moderate_risk": 0.50},
        "rapid_naming":             {"low_risk": 0.75, "moderate_risk": 0.50},
        "comprehension":            {"low_risk": 0.80, "moderate_risk": 0.55},
    },
    "math": {
        "number_sense":             {"low_risk": 0.80, "moderate_risk": 0.55},
        "number_line_representation": {"low_risk": 0.75, "moderate_risk": 0.50},
        "arithmetic_fluency":       {"low_risk": 0.75, "moderate_risk": 0.50},
        "math_reasoning":           {"low_risk": 0.70, "moderate_risk": 0.45},
    },
    "writing": {
        "graphomotor_speed":        {"low_risk": 0.70, "moderate_risk": 0.45},
        "legibility":               {"low_risk": 0.75, "moderate_risk": 0.50},
        "visuomotor_integration":   {"low_risk": 0.75, "moderate_risk": 0.50},
        "written_expression_mechanics": {"low_risk": 0.70, "moderate_risk": 0.45},
    },
    "attention": {
        "sustained_attention":      {"low_risk": 0.70, "moderate_risk": 0.45},
        "impulsivity_inhibition":   {"low_risk": 0.75, "moderate_risk": 0.50},
        "selective_attention":      {"low_risk": 0.70, "moderate_risk": 0.45},
    },
}

# ---------------------------------------------------------------------------
# Task definitions per group
# ---------------------------------------------------------------------------
TASK_PLAN: Dict[str, Dict[str, List[Dict]]] = {
    "A": {
        "reading": [
            {"task_id": "A-reading-sound_friends-1",   "task_type": "sound_friends",        "construct": "phonological_awareness", "label": "Sound Friends (rhyme matching)"},
            {"task_id": "A-reading-first_sound-1",     "task_type": "first_sound",           "construct": "phonological_awareness", "label": "First Sound Treasure Hunt"},
            {"task_id": "A-reading-syllable_jumps-1",  "task_type": "syllable_jumps",        "construct": "phonological_awareness", "label": "Syllable Jumps"},
            {"task_id": "A-reading-letter_sound-1",    "task_type": "letter_sound_bridges",  "construct": "decoding_fluency",       "label": "Letter-Sound Bridges"},
        ],
        "math": [
            {"task_id": "A-math-bug_garden-1",         "task_type": "bug_garden",            "construct": "number_sense",           "label": "Bug Garden (dot counting)"},
            {"task_id": "A-math-magnitude-1",          "task_type": "which_plate_more",      "construct": "number_sense",           "label": "Which Plate Has More?"},
            {"task_id": "A-math-feed_monster-1",       "task_type": "feed_monster",          "construct": "arithmetic_fluency",     "label": "Feed the Monster (addition)"},
        ],
        "writing": [
            {"task_id": "A-writing-big_path-1",        "task_type": "big_path_tracing",      "construct": "graphomotor_speed",      "label": "Big Path Tracing"},
            {"task_id": "A-writing-shape_copy-1",      "task_type": "shape_copy",            "construct": "visuomotor_integration", "label": "Shape Copy"},
        ],
        "attention": [
            {"task_id": "A-attention-cloud_patrol-1",  "task_type": "cloud_patrol",          "construct": "sustained_attention",    "label": "Cloud Patrol (Go/No-Go)"},
        ],
    },
    "B": {
        "reading": [
            {"task_id": "B-reading-phoneme_switch-1",  "task_type": "phoneme_switch_lab",    "construct": "phonological_awareness", "label": "Phoneme Switch Lab"},
            {"task_id": "B-reading-nonword-1",         "task_type": "nonword_conveyor",      "construct": "decoding_fluency",       "label": "Nonword Conveyor Belt"},
            {"task_id": "B-reading-ran-1",             "task_type": "rapid_naming_race",     "construct": "rapid_naming",           "label": "Rapid Naming Race (digits/colors)"},
            {"task_id": "B-reading-sentence-1",        "task_type": "sentence_comprehension","construct": "comprehension",          "label": "Sentence Comprehension Tiles"},
        ],
        "math": [
            {"task_id": "B-math-number_line-1",        "task_type": "number_line_bridge",    "construct": "number_line_representation","label": "Number Line Bridge (0–100)"},
            {"task_id": "B-math-arithmetic-1",         "task_type": "arithmetic_quest",      "construct": "arithmetic_fluency",     "label": "Arithmetic Quest"},
            {"task_id": "B-math-story-1",              "task_type": "story_problem_islands", "construct": "math_reasoning",         "label": "Story Problem Islands"},
        ],
        "writing": [
            {"task_id": "B-writing-copy_scroll-1",     "task_type": "copy_scroll",           "construct": "written_expression_mechanics","label": "Copy Scroll"},
            {"task_id": "B-writing-maze-1",            "task_type": "trace_maze",            "construct": "graphomotor_speed",      "label": "Trace the Maze"},
            {"task_id": "B-writing-word_form-1",       "task_type": "word_form_practice",    "construct": "legibility",             "label": "Word Form Practice"},
        ],
        "attention": [
            {"task_id": "B-attention-cpt-1",           "task_type": "space_patrol_cpt",      "construct": "sustained_attention",    "label": "Space Patrol – Extended CPT (6–8 min)"},
            {"task_id": "B-attention-stroop-1",        "task_type": "color_wizard_stroop",   "construct": "selective_attention",    "label": "Color Wizard (Stroop-like)"},
        ],
    },
    "C": {
        "reading": [
            {"task_id": "C-reading-adv_phoneme-1",     "task_type": "advanced_phoneme_lab",  "construct": "phonological_awareness", "label": "Advanced Phoneme Lab"},
            {"task_id": "C-reading-paragraph-1",       "task_type": "paragraph_summary",     "construct": "comprehension",          "label": "Paragraph Reading & Summary"},
            {"task_id": "C-reading-ran_mixed-1",       "task_type": "ran_mixed_category",    "construct": "rapid_naming",           "label": "RAN – Mixed Category Race"},
        ],
        "math": [
            {"task_id": "C-math-number_line-1",        "task_type": "number_line_1000",      "construct": "number_line_representation","label": "Number Line – 0–1000"},
            {"task_id": "C-math-multistep-1",          "task_type": "multistep_quest",       "construct": "math_reasoning",         "label": "Multi-step Math Quest"},
            {"task_id": "C-math-patterns-1",           "task_type": "pattern_logic_puzzles", "construct": "math_reasoning",         "label": "Pattern & Logic Puzzles"},
        ],
        "writing": [
            {"task_id": "C-writing-timed_copy-1",      "task_type": "timed_copy_paragraph",  "construct": "graphomotor_speed",      "label": "Timed Copy Paragraph"},
            {"task_id": "C-writing-essay-1",           "task_type": "essay_starter",         "construct": "written_expression_mechanics","label": "Essay Starter"},
            {"task_id": "C-writing-precision-1",       "task_type": "precision_tracing",     "construct": "visuomotor_integration", "label": "Precision Tracing / Signature Path"},
        ],
        "attention": [
            {"task_id": "C-attention-full_cpt-1",      "task_type": "full_cpt_session",      "construct": "sustained_attention",    "label": "Full CPT Session (8–10 min)"},
            {"task_id": "C-attention-adv_stroop-1",    "task_type": "advanced_stroop",       "construct": "selective_attention",    "label": "Advanced Stroop / Dual-task"},
        ],
    },
}

# Construct → domain weights for deterministic aggregation (Phase 2.5)
CONSTRUCT_WEIGHTS: Dict[str, Dict[str, float]] = {
    "reading": {
        "phonological_awareness": 0.35,
        "decoding_fluency":       0.25,
        "rapid_naming":           0.25,
        "comprehension":          0.15,
    },
    "math": {
        "number_sense":               0.30,
        "number_line_representation": 0.25,
        "arithmetic_fluency":         0.25,
        "math_reasoning":             0.20,
    },
    "writing": {
        "graphomotor_speed":                0.30,
        "legibility":                       0.25,
        "visuomotor_integration":           0.25,
        "written_expression_mechanics":     0.20,
    },
    "attention": {
        "sustained_attention":    0.45,
        "impulsivity_inhibition": 0.35,
        "selective_attention":    0.20,
    },
}

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class TaskScore:
    task_id: str
    construct: str
    domain: str
    raw_score: float                # 0.0–1.0
    normalized_score: float         # 0–100
    reaction_time_ms: Optional[int]
    flags: List[str]
    evidence_status: str = EVIDENCE_STATUS
    rubric_version: str = SCORING_RUBRIC_VERSION
    scoring_provider: str = "ai_agent_interim"
    notes: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class SubScore:
    construct: str
    score_0_to_1: float
    n_tasks: int
    flags: List[str]
    evidence_status: str = EVIDENCE_STATUS
    rubric_version: str = SCORING_RUBRIC_VERSION

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class DomainScore:
    domain: str
    subscores: Dict[str, SubScore]
    composite_score: float          # 0.0–1.0 (deterministic weighted average)
    risk_level: str = "unknown"     # filled in Phase 3
    justification: str = ""         # filled in Phase 3
    suggested_followup: str = ""    # filled in Phase 3

    def to_dict(self) -> dict:
        return {
            "domain": self.domain,
            "subscores": {k: v.to_dict() for k, v in self.subscores.items()},
            "composite_score": self.composite_score,
            "risk_level": self.risk_level,
            "justification": self.justification,
            "suggested_followup": self.suggested_followup,
        }


# ---------------------------------------------------------------------------
# ScoringProvider interface
# ---------------------------------------------------------------------------

class ScoringProvider(ABC):
    """Abstract scoring interface — swap implementations via config."""

    @abstractmethod
    def score_task(
        self,
        task_response: dict,
        age_group: str,
        child_profile: dict,
    ) -> TaskScore:
        """Score a single task response and return a TaskScore."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...


# ---------------------------------------------------------------------------
# AIAgentScoringProvider (Interim — used until trained models are ready)
# ---------------------------------------------------------------------------

_TASK_SCORING_SYSTEM = (
    "You are a specialist in pediatric learning disability screening. "
    "You score ONE game task response. Respond ONLY with valid JSON — no prose, no markdown."
)

_TASK_SCORING_PROMPT = """\
Score the following child task response for SLD screening.
Questionnaire group: {age_group}
Child age: {age_years}, grade: {school_grade}

Task:
{task_json}

Return ONLY this JSON (no extra text):
{{
  "raw_score": <float 0.0–1.0, 1.0=fully correct/fast, 0.0=fully wrong/timed-out>,
  "normalized_score": <int 0–100, normed for this age group>,
  "flags": [<zero or more of: "slow_response","very_slow","many_errors","some_errors","strong_skill","impulsive_response","missed_target">],
  "notes": "<one short sentence explaining the score, no jargon>"
}}

Rules:
- raw_score 1.0 only if response is clearly correct AND reaction time is age-appropriate.
- Flag "slow_response" if reaction_time_ms > 4000 for Group A, > 3000 for B, > 2500 for C.
- Flag "very_slow" if reaction_time_ms > 8000 for A, > 6000 for B, > 5000 for C.
- Flag "impulsive_response" if reaction_time_ms < 200.
- Flag "missed_target" if response_data indicates no response was given.
- Do NOT produce a risk_level; do NOT make a diagnosis. Score only this one task.
"""


class AIAgentScoringProvider(ScoringProvider):
    """
    Uses the Groq LLM to score individual task responses against a strict rubric.
    Each call scores exactly ONE task — narrow scope minimises hallucination risk
    and makes each score auditable independently.
    """

    @property
    def provider_name(self) -> str:
        return "ai_agent_interim"

    def score_task(
        self,
        task_response: dict,
        age_group: str,
        child_profile: dict,
    ) -> TaskScore:
        if not GROQ_POOL.available:
            logger.warning("No Groq API keys configured — returning neutral task score")
            return self._neutral_score(task_response)

        api_key = GROQ_POOL.next_key()
        prompt = _TASK_SCORING_PROMPT.format(
            age_group=age_group,
            age_years=child_profile.get("age_years", "unknown"),
            school_grade=child_profile.get("school_grade", "unknown"),
            task_json=json.dumps(task_response, indent=2),
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type":  "application/json",
        }
        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": _TASK_SCORING_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            "temperature": 0.05,
            "max_tokens": 256,
        }

        # Adaptive sleep: 2.5s ÷ number_of_keys (round-robin spreads RPM load)
        time.sleep(GROQ_POOL.inter_call_sleep_s)

        max_retries = 3
        for attempt in range(max_retries):
            try:
                resp = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
                if resp.status_code == 429 and attempt < max_retries - 1:
                    # On 429, switch to a fresh key for the retry
                    api_key = GROQ_POOL.next_key()
                    headers["Authorization"] = f"Bearer {api_key}"
                    time.sleep((attempt + 1) * 3)
                    continue
                resp.raise_for_status()
                raw = resp.json()["choices"][0]["message"]["content"].strip()
                if raw.startswith("```"):
                    raw = raw.split("```", 2)[-1].replace("json", "", 1).strip().rstrip("`").strip()
                result = json.loads(raw)
                break
            except Exception as exc:
                if attempt < max_retries - 1:
                    time.sleep((attempt + 1) * 3)
                    continue
                logger.error("AI scoring failed for task %s: %s", task_response.get("task_id"), exc)
                return self._neutral_score(task_response)

        return TaskScore(
            task_id=task_response.get("task_id", "unknown"),
            construct=task_response.get("construct", ""),
            domain=task_response.get("domain", ""),
            raw_score=float(result.get("raw_score", 0.5)),
            normalized_score=int(result.get("normalized_score", 50)),
            reaction_time_ms=task_response.get("reaction_time_ms"),
            flags=result.get("flags", []),
            notes=result.get("notes", ""),
            scoring_provider=self.provider_name,
        )

    @staticmethod
    def _neutral_score(task_response: dict) -> TaskScore:
        """Fallback when AI is unavailable — neutral mid-score, flagged."""
        return TaskScore(
            task_id=task_response.get("task_id", "unknown"),
            construct=task_response.get("construct", ""),
            domain=task_response.get("domain", ""),
            raw_score=0.5,
            normalized_score=50,
            reaction_time_ms=task_response.get("reaction_time_ms"),
            flags=["ai_scoring_unavailable"],
            notes="AI scoring was unavailable; neutral score assigned.",
            scoring_provider="fallback_neutral",
        )


# ---------------------------------------------------------------------------
# TrainedModelScoringProvider (placeholder — swap in later)
# ---------------------------------------------------------------------------

class TrainedModelScoringProvider(ScoringProvider):
    """
    Future implementation: loads task-specific trained sklearn/torch models.
    Swap by setting SCORING_BACKEND=trained_model in env.
    """

    @property
    def provider_name(self) -> str:
        return "trained_model_v1"

    def score_task(self, task_response, age_group, child_profile) -> TaskScore:
        raise NotImplementedError("TrainedModelScoringProvider not yet trained.")


# ---------------------------------------------------------------------------
# Provider factory
# ---------------------------------------------------------------------------

def get_scoring_provider() -> ScoringProvider:
    backend = os.getenv("SCORING_BACKEND", "ai_agent_interim").lower()
    if backend == "ai_agent_interim":
        return AIAgentScoringProvider()
    if backend == "trained_model":
        return TrainedModelScoringProvider()
    logger.warning("Unknown SCORING_BACKEND '%s'; defaulting to ai_agent_interim", backend)
    return AIAgentScoringProvider()


# ---------------------------------------------------------------------------
# Phase 1 — Deterministic group selection + task plan (NO AI)
# ---------------------------------------------------------------------------

def run_phase1(child_profile: dict) -> dict:
    """
    Determine questionnaire group and return the task plan.
    Pure deterministic logic — no LLM involved.
    """
    age   = child_profile.get("age_years", 0)
    grade = str(child_profile.get("school_grade", "")).lower().replace(" ", "_")

    # Grade takes precedence; age is the tiebreaker / consistency check
    group_from_grade = GRADE_TO_GROUP.get(grade)

    if group_from_grade:
        group = group_from_grade
        if age and (
            (group == "A" and age > GROUP_B_MAX_AGE) or
            (group == "C" and age < GROUP_A_MAX_AGE)
        ):
            logger.warning(
                "Grade→Group '%s' inconsistent with age %s — keeping grade-based group",
                group, age
            )
    else:
        # Fallback to age
        if age <= GROUP_A_MAX_AGE:
            group = "A"
        elif age <= GROUP_B_MAX_AGE:
            group = "B"
        else:
            group = "C"
        logger.info("Grade '%s' not recognised; using age %s → Group %s", grade, age, group)

    task_plan = TASK_PLAN[group]

    # Build image requests for UI (developer adds these later)
    image_requests = _build_image_requests(group, task_plan)

    phase_state = {
        "questionnaire_group": group,
        "task_plan": task_plan,
        "thresholds_version": SCORING_RUBRIC_VERSION,
        "grade_used": grade or None,
        "age_used": age or None,
    }

    return {
        "phase": "PHASE_1",
        "questionnaire_group": group,
        "list_of_tasks_per_domain": {
            domain: [
                {"task_id": t["task_id"], "label": t["label"], "construct": t["construct"]}
                for t in tasks
            ]
            for domain, tasks in task_plan.items()
        },
        "image_requests": image_requests,
        "phase_state_for_resume": phase_state,
    }


def _build_image_requests(group: str, task_plan: dict) -> List[dict]:
    """Build minimal image request objects for each task type the frontend will need."""
    images = []
    seen = set()
    for domain, tasks in task_plan.items():
        for task in tasks:
            tt = task["task_type"]
            if tt in seen:
                continue
            seen.add(tt)
            images.append({
                "id": f"{group.lower()}_{tt}",
                "task_type": tt,
                "age_group": group,
                "description": f"Mario-style cartoon scene for '{task['label']}' game, Group {group}.",
                "usage_context": f"{domain} assessment — {task['label']}",
            })
    return images


# ---------------------------------------------------------------------------
# Domain & Data Sufficiency Definitions
# ---------------------------------------------------------------------------

CORE_SLD_DOMAINS = ["reading", "math", "writing", "attention"]
ALL_EXPECTED_DOMAINS = ["reading", "math", "writing", "attention", "socioemotional"]

N_MIN_TASKS: Dict[str, int] = {
    "reading": 3,
    "math": 3,
    "writing": 2,
    "attention": 1,
    "socioemotional": 1,
}

CONSTRUCT_WEIGHTS: Dict[str, Dict[str, float]] = {
    "reading": {
        "phonological_awareness": 0.35,
        "decoding_fluency": 0.35,
        "rapid_naming": 0.15,
        "comprehension": 0.15,
    },
    "math": {
        "number_sense": 0.30,
        "number_line_representation": 0.25,
        "arithmetic_fluency": 0.25,
        "math_reasoning": 0.20,
    },
    "writing": {
        "graphomotor_speed": 0.30,
        "legibility": 0.25,
        "visuomotor_integration": 0.25,
        "written_expression_mechanics": 0.20,
    },
    "attention": {
        "sustained_attention": 0.40,
        "impulsivity_inhibition": 0.30,
        "selective_attention": 0.30,
    },
    "socioemotional": {
        "emotion_recognition": 1.0,
    },
}

# ---------------------------------------------------------------------------
# Phase 2 — Per-task AI scoring  +  Phase 2.5 — Deterministic aggregation
# ---------------------------------------------------------------------------

def run_phase2(
    raw_responses: dict,
    phase_state: dict,
    child_profile: dict,
    provider: Optional[ScoringProvider] = None,
) -> dict:
    """
    Score each task response via the configured ScoringProvider.
    Aggregate subscores deterministically (Phase 2.5 — no AI).
    Returns domain_scores dict and updated phase_state.
    """
    if provider is None:
        provider = get_scoring_provider()

    group = phase_state.get("questionnaire_group", "B")
    all_task_scores: List[TaskScore] = []

    # ── Score each task ──────────────────────────────────────────────────
    for domain, responses in raw_responses.items():
        if not isinstance(responses, list):
            continue
        for resp in responses:
            resp["domain"] = domain
            ts = provider.score_task(resp, group, child_profile)
            all_task_scores.append(ts)

    # ── Phase 2.5: deterministic aggregation (NEVER AI) ──────────────────
    domain_scores = _aggregate_scores(all_task_scores, group)

    phase_state["all_task_scores"] = [ts.to_dict() for ts in all_task_scores]
    phase_state["domain_scores_raw"] = domain_scores

    return {
        "phase": "PHASE_2",
        "questionnaire_group": group,
        "domain_scores": domain_scores,
        "task_scores": [ts.to_dict() for ts in all_task_scores],
        "phase_state_for_resume": phase_state,
        "scoring_provider": provider.provider_name,
        "rubric_version": SCORING_RUBRIC_VERSION,
    }


def _aggregate_scores(task_scores: List[TaskScore], group: str) -> Dict[str, dict]:
    """
    Phase 2.5 — Deterministic weighted aggregation with Data-Sufficiency Guard.
    """
    buckets: Dict[str, Dict[str, List[float]]] = {}
    flag_buckets: Dict[str, Dict[str, List[str]]] = {}

    for ts in task_scores:
        dom = ts.domain
        con = ts.construct
        if not dom or not con:
            continue
        buckets.setdefault(dom, {}).setdefault(con, []).append(ts.raw_score)
        flag_buckets.setdefault(dom, {}).setdefault(con, []).extend(ts.flags)

    all_domains = list(dict.fromkeys(CORE_SLD_DOMAINS + list(buckets.keys())))
    domain_scores: Dict[str, dict] = {}

    for domain in all_domains:
        construct_scores = buckets.get(domain, {})
        total_tasks_in_domain = sum(len(s) for s in construct_scores.values())
        min_required = N_MIN_TASKS.get(domain, 1)

        # DATA-SUFFICIENCY GUARD
        if total_tasks_in_domain < min_required:
            domain_scores[domain] = {
                "status": "insufficient_data",
                "domain": domain,
                "n_tasks": total_tasks_in_domain,
                "composite_score": None,
                "risk_level": None,
                "subscores": None,
                "justification": f"Insufficient data to assess {domain} (received {total_tasks_in_domain} valid tasks, minimum required is {min_required}).",
                "suggested_followup": f"Complete assessment tasks for {domain}."
            }
            continue

        weights = CONSTRUCT_WEIGHTS.get(domain, {})
        subscores: Dict[str, dict] = {}
        composite_num = 0.0
        composite_den = 0.0

        for construct, scores in construct_scores.items():
            mean_score = statistics.mean(scores) if scores else 0.5
            unique_flags = list(set(flag_buckets.get(domain, {}).get(construct, [])))
            subscores[construct] = {
                "construct": construct,
                "score_0_to_1": round(mean_score, 4),
                "n_tasks": len(scores),
                "flags": unique_flags,
                "evidence_status": EVIDENCE_STATUS,
                "rubric_version": SCORING_RUBRIC_VERSION,
            }
            w = weights.get(construct, 1.0 / max(len(construct_scores), 1))
            composite_num += mean_score * w
            composite_den += w

        composite = composite_num / composite_den if composite_den > 0 else 0.5
        domain_scores[domain] = {
            "status": "complete",
            "domain": domain,
            "n_tasks": total_tasks_in_domain,
            "subscores": subscores,
            "composite_score": round(composite, 4),
        }

    return domain_scores


# ---------------------------------------------------------------------------
# Phase 3 — Narrative generation ONLY (AI given frozen domain_scores)
# ---------------------------------------------------------------------------

_NARRATIVE_SYSTEM = (
    "You are a specialist in pediatric learning disability screening and child development. "
    "You explain screening results to parents and teachers in warm, simple language. "
    "Respond ONLY with valid JSON — no markdown fences, no preamble. "
    "CRITICAL: You may NOT change any numeric scores. You explain them."
)

_NARRATIVE_PROMPT = """\
You have received pre-computed, frozen domain scores from a research-aligned
screening engine. Your ONLY job is to write warm explanations and suggestions.
You MUST NOT alter any numeric values or change any risk_level — those are
already computed and set. Explain them.

IMPORTANT CONSTRAINTS:
- NEVER diagnose ADHD, dyslexia, dyscalculia, or dysgraphia. Use phrases like
  "ADHD-like attention pattern" or "reading difficulties similar to dyslexia."
- For parents: short sentences, no jargon.
- For teachers: slightly more detail, concise.
- PA (phonological_awareness) and RAN (rapid_naming) must always be described
  separately — they are independent predictors and must never be collapsed.
- Dyscalculia: distinguish number_sense, arithmetic_fluency, number_line
  separately — not just "bad at math."
- Dysgraphia: distinguish graphomotor_speed (motor) from
  written_expression_mechanics (language) — they have different implications.
- Attention: describe CPT/Stroop/Go-No-Go patterns as attention/inhibition
  markers only; never say "this child has ADHD."

scoring_authority: "phase2_ai_agent_plus_deterministic_aggregation"
rubric_version: "{rubric_version}"
evidence_status: "{evidence_status}"

Child profile:
{child_profile_json}

Questionnaire group: {group}

FROZEN domain scores (do not recalculate):
{domain_scores_json}

Produce ONLY this JSON:
{{
  "domain_scores": {{
    "<domain>": {{
      "risk_level": "<same as input — do not change>",
      "justification": "<1–2 warm sentences for parents>",
      "suggested_followup": "<1–2 actionable suggestions>"
    }}
  }},
  "global_impression": {{
    "overall_pattern": "<1–2 sentences for clinician/expert>",
    "flags_for_formal_assessment": ["<list only domains where risk_level is moderate or high>"],
    "notes_for_teacher": "<short bullet-like text>",
    "notes_for_parent": "<short bullet-like text>",
    "alignment_with_NIMHANS_style": "<brief note on how this profile maps onto reading/writing/arithmetic difficulties as per NIMHANS SLD battery>"
  }},
  "disclaimer": "This is a screening aid, not a clinical diagnosis. Results should be interpreted by a qualified psychologist or special educator."
}}
"""


def run_phase3(
    domain_scores_dict: dict,
    child_profile: dict,
    phase_state: dict,
) -> dict:
    """
    Phase 3 — Narrative generation only.
    The AI receives FROZEN domain_scores and adds human-readable text.
    It cannot alter numeric values or risk_levels.

    NOTE: risk_level is computed deterministically here BEFORE calling the AI,
    so the AI prompt contains the already-decided risk_levels.
    """
    group = phase_state.get("questionnaire_group", "B")

    # ── Deterministic risk_level computation ────────────────────────────
    domain_scores_with_risk = _compute_risk_levels(domain_scores_dict, group)

    if not GROQ_POOL.available:
        logger.warning("No Groq API keys configured — skipping narrative generation")
        return _fallback_phase3(domain_scores_with_risk, group, child_profile, phase_state)

    narrative_key = GROQ_POOL.next_key()
    prompt = _NARRATIVE_PROMPT.format(
        rubric_version=SCORING_RUBRIC_VERSION,
        evidence_status=EVIDENCE_STATUS,
        child_profile_json=json.dumps({
            "name": child_profile.get("name", "child"),
            "age_years": child_profile.get("age_years"),
            "school_grade": child_profile.get("school_grade"),
            "language": child_profile.get("language", "English"),
        }, indent=2),
        group=group,
        domain_scores_json=json.dumps(domain_scores_with_risk, indent=2),
    )

    headers = {
        "Authorization": f"Bearer {narrative_key}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": _NARRATIVE_SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2048,
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
            if resp.status_code == 429 and attempt < max_retries - 1:
                # Switch key on 429
                narrative_key = GROQ_POOL.next_key()
                headers["Authorization"] = f"Bearer {narrative_key}"
                time.sleep((attempt + 1) * 3)
                continue
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
            if raw.startswith("```"):
                raw = raw.split("```", 2)[-1].replace("json", "", 1).strip().rstrip("`").strip()
            narrative = json.loads(raw)
            break
        except Exception as exc:
            if attempt < max_retries - 1:
                time.sleep((attempt + 1) * 3)
                continue
            logger.error("Phase 3 narrative generation failed: %s", exc)
            return _fallback_phase3(domain_scores_with_risk, group, child_profile, phase_state)

    # Merge narrative into domain_scores — but only text fields, never numbers
    merged = _merge_narrative(domain_scores_with_risk, narrative)

    # Collect flags for formal assessment (CORE SLD ONLY)
    flags = [
        f"{d}_risk" for d, ds in domain_scores_with_risk.items()
        if d in CORE_SLD_DOMAINS and ds.get("risk_level") in ("moderate", "high")
    ]

    phase_state["phase3_complete"] = True

    return {
        "phase": "PHASE_3",
        "questionnaire_group": group,
        "domain_scores": merged,
        "global_impression": narrative.get("global_impression", {}),
        "flags_for_formal_assessment": flags,
        "disclaimer": (
            "This is a screening aid, not a clinical diagnosis. "
            "Results should be interpreted by a qualified psychologist or special educator."
        ),
        "rubric_version": SCORING_RUBRIC_VERSION,
        "evidence_status": EVIDENCE_STATUS,
        "phase_state_for_resume": phase_state,
    }


def _compute_risk_levels(domain_scores_dict: dict, group: str) -> dict:
    """
    Deterministically assign risk_level to each domain based on composite_score
    and construct-specific THRESHOLDS.
    Attaches driving_construct, driving_subscore, driving_threshold, and driving_reason.
    """
    result = {}
    for domain, ds in domain_scores_dict.items():
        if ds.get("status") == "insufficient_data" or ds.get("composite_score") is None:
            result[domain] = {
                **ds,
                "risk_level": None,
                "driving_construct": None,
                "driving_reason": "Insufficient data to determine risk level."
            }
            continue

        if domain == "socioemotional":
            result[domain] = {
                **ds,
                "risk_level": None,
                "driving_construct": None,
                "driving_reason": "Socioemotional screening component completed (supplementary context).",
                "justification": ds.get("justification", "Socioemotional screening component completed."),
            }
            continue

        domain_thresholds = THRESHOLDS.get(domain, {})
        subscores = ds.get("subscores") or {}
        composite = float(ds.get("composite_score", 0.5))

        # Check all construct thresholds
        construct_risks = []
        worst_gap = 0.0
        primary_driver = None
        driver_score_pct = 0
        driver_thresh_pct = 0

        # Calculate average domain thresholds for composite evaluation
        all_low  = [v.get("low_risk", 0.75) for v in domain_thresholds.values() if isinstance(v, dict)]
        all_mod  = [v.get("moderate_risk", 0.50) for v in domain_thresholds.values() if isinstance(v, dict)]
        low_thresh = statistics.mean(all_low) if all_low else 0.75
        mod_thresh = statistics.mean(all_mod) if all_mod else 0.50

        if isinstance(subscores, dict):
            for c_name, ss in subscores.items():
                if not isinstance(ss, dict):
                    continue
                score = float(ss.get("score_0_to_1", 0.5))
                c_thresh = domain_thresholds.get(c_name, {})
                c_low = float(c_thresh.get("low_risk", low_thresh)) if isinstance(c_thresh, dict) else low_thresh
                c_mod = float(c_thresh.get("moderate_risk", mod_thresh)) if isinstance(c_thresh, dict) else mod_thresh

                if score < c_mod:
                    c_risk = "high"
                    gap = c_low - score
                elif score < c_low:
                    c_risk = "moderate"
                    gap = c_low - score
                else:
                    c_risk = "low"
                    gap = 0.0

                construct_risks.append((c_risk, gap, c_name, score, c_low))

                if gap > worst_gap:
                    worst_gap = gap
                    primary_driver = c_name
                    driver_score_pct = round(score * 100)
                    driver_thresh_pct = round(c_low * 100)

        # Check composite score risk
        if composite < mod_thresh:
            composite_risk = "high"
        elif composite < low_thresh:
            composite_risk = "moderate"
        else:
            composite_risk = "low"

        # Determine overall domain risk: highest severity among constructs and composite
        all_risks = [r[0] for r in construct_risks] + [composite_risk]
        if "high" in all_risks:
            domain_risk = "high"
        elif "moderate" in all_risks:
            domain_risk = "moderate"
        else:
            domain_risk = "low"

        # Build driving_reason explanation
        if domain_risk == "low":
            driving_construct = None
            driving_reason = f"All subscores passed expected thresholds for Group {group}."
        else:
            if primary_driver:
                readable_c = primary_driver.replace("_", " ").title()
                driving_construct = primary_driver
                driving_reason = f"Flagged due to {readable_c} ({driver_score_pct}%, below {driver_thresh_pct}% threshold for Group {group})."
            else:
                driving_construct = "composite"
                comp_pct = round(composite * 100)
                comp_thresh_pct = round(low_thresh * 100)
                driving_reason = f"Flagged due to Overall Composite Score ({comp_pct}%, below {comp_thresh_pct}% threshold for Group {group})."

        result[domain] = {
            **ds,
            "risk_level": domain_risk,
            "driving_construct": driving_construct,
            "driving_reason": driving_reason,
        }

    return result


def _merge_narrative(domain_scores: dict, narrative: dict) -> dict:
    """
    Merge narrative text into domain_scores, ensuring numeric values are
    NEVER overwritten by the AI — only justification and suggested_followup.
    """
    narrative_domains = narrative.get("domain_scores", {})
    merged = {}
    for domain, ds in domain_scores.items():
        if ds.get("status") == "insufficient_data":
            merged[domain] = {
                **ds,
                "justification": ds.get("justification", "Insufficient data recorded for this domain."),
                "suggested_followup": ds.get("suggested_followup", "Complete tasks for this domain."),
                "risk_level": None,
                "composite_score": None,
            }
            continue

        nd = narrative_domains.get(domain, {})
        merged[domain] = {
            **ds,
            "justification":      nd.get("justification", ds.get("justification", "")),
            "suggested_followup": nd.get("suggested_followup", ds.get("suggested_followup", "")),
            "risk_level":         ds.get("risk_level"),
        }
    return merged


def _fallback_phase3(domain_scores: dict, group: str, child_profile: dict, phase_state: dict) -> dict:
    """Minimal fallback when AI is unavailable."""
    flags = [
        f"{d}_risk" for d, ds in domain_scores.items()
        if d in CORE_SLD_DOMAINS and ds.get("risk_level") in ("moderate", "high")
    ]
    return {
        "phase": "PHASE_3",
        "questionnaire_group": group,
        "domain_scores": domain_scores,
        "global_impression": {
            "overall_pattern": "Narrative unavailable — AI service unreachable.",
            "flags_for_formal_assessment": flags,
            "notes_for_teacher": "Please consult a qualified special educator for interpretation.",
            "notes_for_parent": "We were unable to generate a detailed explanation this time. Please speak with your child's teacher.",
            "alignment_with_NIMHANS_style": "Narrative unavailable.",
        },
        "flags_for_formal_assessment": flags,
        "disclaimer": (
            "This is a screening aid, not a clinical diagnosis. "
            "Results should be interpreted by a qualified psychologist or special educator."
        ),
        "rubric_version": SCORING_RUBRIC_VERSION,
        "evidence_status": EVIDENCE_STATUS,
        "phase_state_for_resume": phase_state,
    }


# ---------------------------------------------------------------------------
# Full pipeline — called by Flask route (server-side orchestration)
# ---------------------------------------------------------------------------

def run_full_pipeline(input_json: dict) -> dict:
    """
    Orchestrates Phase 1 → Phase 2 → Phase 3 server-side.
    Called by POST /predict/screening_ai/run.

    Input shape:
    {
      "child_profile": { id, name, age_years, school_grade, language },
      "raw_responses": { "reading": [...], "math": [...], "writing": [...], "attention": [...] },
      "previous_phase_state": {}   // optional — for resuming mid-pipeline
    }
    """
    child_profile   = input_json.get("child_profile", {})
    raw_responses   = input_json.get("raw_responses", {})
    prev_state      = input_json.get("previous_phase_state", {})

    # ── Phase 1 ──────────────────────────────────────────────────────────
    phase1_result = run_phase1(child_profile)
    phase_state   = phase1_result["phase_state_for_resume"]

    # Merge any previous state (resume support)
    if prev_state:
        phase_state = {**prev_state, **phase_state}

    # ── Phase 2 + 2.5 ────────────────────────────────────────────────────
    provider = get_scoring_provider()
    phase2_result = run_phase2(raw_responses, phase_state, child_profile, provider)
    domain_scores  = phase2_result["domain_scores"]
    phase_state    = phase2_result["phase_state_for_resume"]

    # ── Phase 3 ──────────────────────────────────────────────────────────
    phase3_result = run_phase3(domain_scores, child_profile, phase_state)

    return {
        "session_id":               child_profile.get("id"),
        "questionnaire_group":      phase1_result["questionnaire_group"],
        "list_of_tasks_per_domain": phase1_result["list_of_tasks_per_domain"],
        "domain_scores":            phase3_result["domain_scores"],
        "global_impression":        phase3_result.get("global_impression", {}),
        "flags_for_formal_assessment": phase3_result.get("flags_for_formal_assessment", []),
        "image_requests":           phase1_result.get("image_requests", []),
        "disclaimer":               phase3_result.get("disclaimer", ""),
        "rubric_version":           SCORING_RUBRIC_VERSION,
        "evidence_status":          EVIDENCE_STATUS,
        "scoring_provider":         provider.provider_name,
    }
