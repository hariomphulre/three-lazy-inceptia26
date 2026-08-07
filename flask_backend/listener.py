import psycopg2, select, requests
from utils.db import get_connection
from dotenv import load_dotenv

load_dotenv()

conn = get_connection()
conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()

cur.execute("LISTEN neurobloom;")

print("🧠 NeuroBloom listening for new children...")

while True:
    if select.select([conn],[],[],5)==([],[],[]):
        continue

    conn.poll()

    while conn.notifies:
        notify = conn.notifies.pop(0)
        session_id = notify.payload

        print("📩 New child inserted:", session_id)

        try:
            requests.post(
                "http://localhost:5000/predict/full_report_final",
                json={"session_id": session_id},
                timeout=20
            )
        except Exception as e:
            print("Pipeline error:", e)
