import requests

def download_image(url):
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        raise Exception("Failed to download image")
    return resp.content
