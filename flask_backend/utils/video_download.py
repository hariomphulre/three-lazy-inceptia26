import requests
import os
import uuid
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def download_video_from_url(url, folder="temp_videos"):
    if not os.path.exists(folder):
        os.makedirs(folder)

    unique_filename = f"{uuid.uuid4().hex}.mp4"
    file_path = os.path.join(folder, unique_filename)

    # Robust Session Setup: Connection drop hone par auto-retry karega
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))

    print(f"[DOWNLOADER] Initializing robust stream from Cloudinary...")

    try:
        # 2-minute timeout aur stream enabled
        with session.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            total_size = int(r.headers.get('content-length', 0))
            
            with open(file_path, 'wb') as f:
                downloaded = 0
                for chunk in r.iter_content(chunk_size=1024*1024): # 1MB chunks
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            done = int(50 * downloaded / total_size)
                            print(f"\r[PROGRESS] [{'=' * done}{' ' * (50-done)}] {downloaded}/{total_size} bytes", end='')
            
            print(f"\n[SUCCESS] Video fully secured: {file_path}")
            return file_path

    except Exception as e:
        print(f"\n[CRITICAL ERROR] Download failed: {e}")
        if os.path.exists(file_path): os.remove(file_path)
        return None

def cleanup_video(file_path):
    """File release hone ke baad hi delete karne ka logic."""
    if not file_path or not os.path.exists(file_path):
        return

    # Windows File Lock bypass: thoda wait aur retry logic
    for i in range(3):
        try:
            os.remove(file_path)
            print(f"[CLEANUP] Temporary file removed.")
            break
        except PermissionError:
            print(f"[RETRY] File locked by OpenCV, waiting 1s...")
            time.sleep(1)
        except Exception as e:
            print(f"[ERROR] Cleanup failed: {e}")
            break