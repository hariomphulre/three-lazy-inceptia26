"""
full_pipeline.py
Standalone pipeline runner – calls all prediction sub-services for a session,
generates an LLM report, creates a PDF, uploads it, and persists the result.

Can be imported and called programmatically (run_pipeline) or executed directly
from the command line:

    python full_pipeline.py <session_id>
"""
from __future__ import annotations

import json
import logging
import sys
from typing import Optional

import requests

from groq_client import ask_groq
from pdf_generator import make_pdf
from cloudinary_uploader import upload_pdf
from utils.db import get_connection

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL = "http://localhost:5000/predict"
REQUEST_TIMEOUT_SEC = 120

# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def ensure_disabilities_column() -> None:
    """Add the *disabilities* JSONB column to the features table if absent."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                ALTER TABLE child_assessment_features
                ADD COLUMN IF NOT EXISTS disabilities JSONB DEFAULT '[]'
            """)
        conn.commit()
    except Exception as exc:
        logger.error("Failed to ensure disabilities column: %s", exc)
        conn.rollback()
        raise
    finally:
        conn.close()


def save_report_url(
    session_id: str | int,
    url: str,
    disabilities: Optional[list[str]] = None,
) -> None:
    """Persist the generated PDF URL (and optionally detected disabilities) to DB."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if disabilities is not None:
                cur.execute(
                    """
                    UPDATE child_assessment_features
                       SET report_url = %s,
                           disabilities = %s
                     WHERE id = %s
                    """,
                    (url, json.dumps(disabilities), session_id),
                )
            else:
                cur.execute(
                    "UPDATE child_assessment_features SET report_url = %s WHERE id = %s",
                    (url, session_id),
                )
        conn.commit()
    except Exception as exc:
        logger.error("Failed to save report URL for session %s: %s", session_id, exc)
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Disability detection
# ---------------------------------------------------------------------------

def detect_disabilities(data: dict) -> list[str]:
    """
    Derive a list of suspected learning disabilities from aggregated results.

    Checks:
    - Dyscalculia  → math prediction label contains 'dyscalculia' or 'at risk'
    - Dyslexia     → reading risk label contains 'risk'
    - Dysgraphia   → handwriting diagnosis is not 'NORMAL'
    """
    found: list[str] = []

    math_pred = str(data.get("math", {}).get("prediction", "")).lower()
    if "dyscalculia" in math_pred or "at_risk" in math_pred or "at risk" in math_pred:
        found.append("dyscalculia")

    reading_risk = str(data.get("reading", {}).get("reading_risk", "")).lower()
    if "at risk" in reading_risk or "risk" in reading_risk:
        found.append("dyslexia")

    hw_risk = str(data.get("handwriting", {}).get("handwriting_risk", "NORMAL")).upper()
    if hw_risk != "NORMAL":
        found.append("dysgraphia")

    return found


# ---------------------------------------------------------------------------
# Sub-service caller
# ---------------------------------------------------------------------------

def _call(endpoint: str, session_id: str | int) -> dict:
    """POST to a prediction endpoint and return parsed JSON, or an error dict."""
    url = f"{BASE_URL}/{endpoint}"
    try:
        resp = requests.post(url, json={"session_id": session_id}, timeout=REQUEST_TIMEOUT_SEC)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        logger.error("Sub-call to %s failed for session %s: %s", endpoint, session_id, exc)
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(session_id: str | int) -> dict:
    """
    Execute the full assessment pipeline for *session_id*.

    Steps:
    1. Call all six prediction endpoints.
    2. Detect disabilities from aggregated results.
    3. Generate LLM narrative report via Groq.
    4. Create and upload PDF.
    5. Persist URL and disabilities in DB.

    Returns a summary dict with keys: status, report_url, disabilities.
    """
    logger.info("Pipeline started for session: %s", session_id)

    ensure_disabilities_column()

    data = {
        "session_id": session_id,
        "math":        _call("dyscalculia",         session_id),
        "reading":     _call("reading_disability",  session_id),
        "emotion":     _call("emotion",             session_id),
        "hearing":     _call("test5",               session_id),
        "cognition":   _call("test6",               session_id),
        "handwriting": _call("handwriting",         session_id),
    }

    disabilities = detect_disabilities(data)
    logger.info("Disabilities detected: %s", disabilities)

    try:
        llm_report = ask_groq(data)
    except Exception as exc:
        logger.error("Groq API error: %s", exc)
        llm_report = "LLM narrative unavailable due to an API error."

    pdf_path = make_pdf(data, llm_report)
    url      = upload_pdf(pdf_path)

    save_report_url(session_id, url, disabilities)

    logger.info("Report ready for session %s: %s", session_id, url)
    return {
        "status":       "completed",
        "report_url":   url,
        "disabilities": disabilities,
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )

    if len(sys.argv) != 2:
        print("Usage: python full_pipeline.py <session_id>")
        sys.exit(1)

    result = run_pipeline(sys.argv[1])
    print("Report URL   :", result["report_url"])
    print("Disabilities :", result["disabilities"])