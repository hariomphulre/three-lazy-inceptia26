import time
import requests
from utils.db import get_connection

API_URL = "http://127.0.0.1:5000/predict/full_report"

print("🧠 NeuroBloom Worker running...")

while True:
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id FROM child_assessment_features
            WHERE report_url IS NULL
        """)

        rows = cur.fetchall()
        conn.close()

        if rows:
            print(f"📋 Found {len(rows)} unprocessed children")

        for (session_id,) in rows:
            print("⚙️ Processing:", session_id)

            try:
                r = requests.post(
                    API_URL,
                    json={"session_id": session_id},
                    timeout=120
                )

                if r.status_code == 200:
                    print("✅ Report generated for", session_id)
                else:
                    print("❌ API error", r.text)

            except Exception as e:
                print("❌ Request failed:", e)

    except Exception as e:
        print("DB error:", e)

    time.sleep(60)   # wait 1 minute
