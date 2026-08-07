import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(os.getenv("NEON_DB_URL"))

# Alias used by screening_ai route
get_conn = get_connection
