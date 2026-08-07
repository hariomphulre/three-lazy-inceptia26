import json
from utils.db import get_connection

def ensure_disabilities_column():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        ALTER TABLE child_assessment_features
        ADD COLUMN IF NOT EXISTS disabilities JSONB DEFAULT '[]'
    """)
    conn.commit()
    cur.close()
    conn.close()

def save_report_url(session_id, url, disabilities=None):
    conn = get_connection()
    cur = conn.cursor()

    if disabilities is not None:
        cur.execute(
            """
            UPDATE child_assessment_features
            SET report_url = %s, disabilities = %s
            WHERE id = %s
            """,
            (url, json.dumps(disabilities), session_id)
        )
    else:
        cur.execute(
            """
            UPDATE child_assessment_features
            SET report_url = %s
            WHERE id = %s
            """,
            (url, session_id)
        )

    conn.commit()
    cur.close()
    conn.close()
