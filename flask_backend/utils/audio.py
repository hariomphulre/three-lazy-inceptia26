import os
import uuid
import requests
import tempfile

def download_audio(audio_url):
    if not audio_url:
        raise ValueError("Empty audio URL")

    # Create temp file
    temp_dir = tempfile.gettempdir()
    filename = os.path.join(temp_dir, f"{uuid.uuid4()}.webm")

    # Download file
    r = requests.get(audio_url, timeout=20)
    r.raise_for_status()

    with open(filename, "wb") as f:
        f.write(r.content)

    return filename
