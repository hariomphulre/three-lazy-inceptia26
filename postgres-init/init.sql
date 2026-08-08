CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_role_check CHECK (
    role IN ('parent', 'educator', 'researcher', 'teacher', 'doctor', 'psychologist')
  )
);

-- ─── Child Assessment Features ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_assessment_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  age INT NOT NULL,
  gender TEXT,
  session_timestamp TIMESTAMP DEFAULT now(),

  test1_q1 FLOAT, test1_q1_time BIGINT,
  test1_q2 FLOAT, test1_q2_time BIGINT,
  test1_q3 FLOAT, test1_q3_time BIGINT,
  test1_q4 FLOAT, test1_q4_time BIGINT,
  test1_q5 FLOAT, test1_q5_time BIGINT,
  test1_q6 FLOAT, test1_q6_time BIGINT,

  test2_audio1 TEXT,
  test2_audio2 TEXT,

  test3_image TEXT,

  test4_q1 FLOAT, test4_q1_time BIGINT,
  test4_q2 FLOAT, test4_q2_time BIGINT,
  test4_q3 FLOAT, test4_q3_time BIGINT,
  test4_q4 FLOAT, test4_q4_time BIGINT,

  test5_q1_r1 BIGINT, test5_q1_r2 BIGINT, test5_q1_r3 BIGINT,
  test5_q1_r4 BIGINT, test5_q1_r5 BIGINT,
  test5_q2_time BIGINT, test5_q2_score BIGINT,
  test5_q3_time BIGINT, test5_q3_score BIGINT,

  test6_q1_time BIGINT, test6_q1_score BIGINT,
  test6_q2_time BIGINT, test6_q2_score BIGINT,
  test6_q3_time BIGINT, test6_q3_score BIGINT,
  test6_q4_time BIGINT, test6_q4_score BIGINT,

  status TEXT DEFAULT 'in_progress',
  school_grade TEXT,
  language TEXT DEFAULT 'english',
  report_url TEXT,
  video_link TEXT,
  detected_disabilities TEXT,
  disabilities JSONB DEFAULT '[]'
);

-- ─── Students (managed by teachers) ──────────────────────────────────────────
-- Keeps assessment tracking directly on the student record,
-- while referral logistics live in the separate referrals table.
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Which teacher owns this student record
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Linked parent/user account (set after they register via referral)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Assessment fields kept here as requested
  referral_assessment_type TEXT,   -- e.g. 'dyslexia', 'adhd'
  assessment_status TEXT DEFAULT 'not_started'
    CHECK (assessment_status IN ('not_started', 'in_progress', 'completed')),
  assessment_id UUID REFERENCES child_assessment_features(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (email, teacher_id)       -- same student can't be added twice by same teacher
);

-- ─── Referrals ────────────────────────────────────────────────────────────────
-- Separate table for managing invitation links securely.
-- One referral per (student, assessment type) assignment event.
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Cryptographically random token embedded in the invitation link
  code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),

  -- What assessment this referral is for
  assessment_type TEXT NOT NULL,

  -- Lifecycle tracking
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'registered', 'started', 'completed')),
  sent_at TIMESTAMP DEFAULT NOW(),
  registered_at TIMESTAMP,   -- when the parent/student registered via this link
  completed_at TIMESTAMP,    -- when the assessment was completed

  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- ─── Notes (unified) ─────────────────────────────────────────────────────────
-- Single table for all note types. author_role distinguishes the source.
-- Role-based access enforced at the API layer:
--   teacher  → can INSERT where student is in their class; can SELECT own notes
--   parent   → can INSERT/SELECT for their own child only
--   doctor   → can INSERT/SELECT for students where they have an accepted doctor_request
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL
    CHECK (author_role IN ('teacher', 'parent', 'doctor', 'psychologist')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Doctor Requests ──────────────────────────────────────────────────────────
-- Parents request a consultation from a specific doctor.
-- Once accepted, doctor gains read/write access to that student's data.
CREATE TABLE IF NOT EXISTS doctor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE (student_id, doctor_id)   -- one request per student-doctor pair
);

-- ─── Notify trigger (fires on completion) ───────────────────────────────────
CREATE OR REPLACE FUNCTION notify_neurobloom()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('neurobloom', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE child_assessment_features ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';
ALTER TABLE child_assessment_features ADD COLUMN IF NOT EXISTS school_grade TEXT;
ALTER TABLE child_assessment_features ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'english';
DROP TRIGGER IF EXISTS new_child_trigger ON child_assessment_features;
DROP TRIGGER IF EXISTS notify_on_completion ON child_assessment_features;
CREATE TRIGGER notify_on_completion
  AFTER UPDATE OF status ON child_assessment_features
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION notify_neurobloom();

-- ─── Screening responses (per-task training data) ────────────────────────────
CREATE TABLE IF NOT EXISTS screening_responses (
  id                   SERIAL PRIMARY KEY,
  session_id           TEXT,
  task_id              TEXT NOT NULL,
  domain               TEXT NOT NULL,
  construct            TEXT NOT NULL,
  task_type            TEXT,
  questionnaire_group  TEXT,
  age_years            INT,
  school_grade         TEXT,
  language             TEXT,
  response_json        JSONB,
  reaction_time_ms     INT,
  raw_score            NUMERIC(5,4),
  normalized_score     INT,
  flags                TEXT[],
  ai_scoring_provider  TEXT DEFAULT 'ai_agent_interim',
  rubric_version       TEXT DEFAULT 'prototype-heuristic-v1',
  evidence_status      TEXT DEFAULT 'prototype_heuristic',
  created_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_responses_session
  ON screening_responses(session_id);

CREATE INDEX IF NOT EXISTS idx_screening_responses_domain
  ON screening_responses(domain, construct);

-- ─── Screening reports (final aggregated session report) ─────────────────────
CREATE TABLE IF NOT EXISTS screening_reports (
  id                   SERIAL PRIMARY KEY,
  session_id           TEXT UNIQUE,
  questionnaire_group  TEXT,
  domain_scores        JSONB,
  narrative            JSONB,
  flags_for_assessment TEXT[],
  evidence_status      TEXT DEFAULT 'prototype_heuristic',
  rubric_version       TEXT DEFAULT 'prototype-heuristic-v1',
  scoring_provider     TEXT DEFAULT 'ai_agent_interim',
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_reports_session
  ON screening_reports(session_id);

