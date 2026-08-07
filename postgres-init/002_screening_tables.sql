-- ============================================================================
-- Migration: Add Research-Aligned Screening Engine tables
-- Run once against your Postgres instance (Docker local or Neon production)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table 1: screening_responses
-- One row per task response submitted during a screening session.
-- This table is the training data reservoir for future ML models.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_responses (
    id                   SERIAL PRIMARY KEY,
    session_id           TEXT,           -- references child_assessment_features(id)
    task_id              TEXT NOT NULL,  -- e.g. "B-reading-phoneme_switch-1"
    domain               TEXT NOT NULL,  -- "reading" | "math" | "writing" | "attention"
    construct            TEXT NOT NULL,  -- e.g. "phonological_awareness"
    task_type            TEXT,           -- e.g. "phoneme_switch_lab"
    questionnaire_group  TEXT,           -- "A" | "B" | "C"
    age_years            INT,
    school_grade         TEXT,
    language             TEXT,
    response_json        JSONB,          -- full task_response object
    reaction_time_ms     INT,
    raw_score            NUMERIC(5,4),   -- AI-assigned 0.0–1.0
    normalized_score     INT,            -- 0–100
    flags                TEXT[],         -- e.g. {"slow_response","many_errors"}
    ai_scoring_provider  TEXT DEFAULT 'ai_agent_interim',
    rubric_version       TEXT DEFAULT 'prototype-heuristic-v1',
    evidence_status      TEXT DEFAULT 'prototype_heuristic',
    created_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_responses_session
    ON screening_responses(session_id);

CREATE INDEX IF NOT EXISTS idx_screening_responses_domain
    ON screening_responses(domain, construct);

-- ----------------------------------------------------------------------------
-- Table 2: screening_reports
-- One row per completed screening session — the final aggregated report.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_reports (
    id                   SERIAL PRIMARY KEY,
    session_id           TEXT UNIQUE,    -- references child_assessment_features(id)
    questionnaire_group  TEXT,           -- "A" | "B" | "C"
    domain_scores        JSONB,          -- full domain_scores object from Phase 3
    narrative            JSONB,          -- global_impression object from Phase 3
    flags_for_assessment TEXT[],         -- e.g. {"reading_risk", "attention_risk"}
    evidence_status      TEXT DEFAULT 'prototype_heuristic',
    rubric_version       TEXT DEFAULT 'prototype-heuristic-v1',
    scoring_provider     TEXT DEFAULT 'ai_agent_interim',
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_reports_session
    ON screening_reports(session_id);

-- ----------------------------------------------------------------------------
-- Backward-compatible: add school_grade and language to existing session table
-- (safe to run even if columns already exist via IF NOT EXISTS pattern)
-- ----------------------------------------------------------------------------
ALTER TABLE child_assessment_features
    ADD COLUMN IF NOT EXISTS school_grade TEXT,
    ADD COLUMN IF NOT EXISTS language     TEXT DEFAULT 'english';

-- ============================================================================
-- End of migration
-- ============================================================================
