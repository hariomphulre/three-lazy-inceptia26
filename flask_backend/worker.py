import time
import requests
from utils.db import get_connection

API_URL = "http://127.0.0.1:5000/predict/full_report"

# Legacy worker polling disabled.
# The screening pipeline is now triggered upon session completion by listener.py calling /predict/screening_ai/run.
print("🧠 NeuroBloom Worker: Legacy worker disabled (screening_ai.py is active). Exiting loop.")
# Exit worker process cleanly or sleep indefinitely without calling legacy routes
while True:
    time.sleep(3600)

