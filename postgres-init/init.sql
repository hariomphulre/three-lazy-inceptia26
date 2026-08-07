CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('parent', 'educator', 'researcher')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE child_assessment_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  age INT NOT NULL,
  gender TEXT,
  session_timestamp TIMESTAMP DEFAULT now(),

  test1_q1 FLOAT,
  test1_q1_time BIGINT,
  test1_q2 FLOAT,
  test1_q2_time BIGINT,
  test1_q3 FLOAT,
  test1_q3_time BIGINT,
  test1_q4 FLOAT,
  test1_q4_time BIGINT,
  test1_q5 FLOAT,
  test1_q5_time BIGINT,
  test1_q6 FLOAT,
  test1_q6_time BIGINT,

  test2_audio1 TEXT,
  test2_audio2 TEXT,

  test3_image TEXT,

  test4_q1 FLOAT,
  test4_q1_time BIGINT,
  test4_q2 FLOAT,
  test4_q2_time BIGINT,
  test4_q3 FLOAT,
  test4_q3_time BIGINT,
  test4_q4 FLOAT,
  test4_q4_time BIGINT,

  test5_q1_r1 BIGINT,
  test5_q1_r2 BIGINT,
  test5_q1_r3 BIGINT,
  test5_q1_r4 BIGINT,
  test5_q1_r5 BIGINT,

  test5_q2_time BIGINT,
  test5_q2_score BIGINT,

  test5_q3_time BIGINT,
  test5_q3_score BIGINT,

  test6_q1_time BIGINT,
  test6_q1_score BIGINT,

  test6_q2_time BIGINT,
  test6_q2_score BIGINT,

  test6_q3_time BIGINT,
  test6_q3_score BIGINT,

  test6_q4_time BIGINT,
  test6_q4_score BIGINT,

  report_url TEXT,
  video_link TEXT,
  detected_disabilities TEXT
);


CREATE OR REPLACE FUNCTION notify_neurobloom()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('neurobloom', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_child_trigger
AFTER INSERT ON child_assessment_features
FOR EACH ROW
EXECUTE FUNCTION notify_neurobloom();
