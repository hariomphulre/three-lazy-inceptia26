def extract_features(words):
    pauses = []

    for i in range(len(words) - 1):
        p = words[i+1]["start"] - words[i]["end"]
        if p > 0:
            pauses.append(p)

    total_time = words[-1]["end"] if words else 1
    total_words = len(words)

    return {
        "avg_pause": sum(pauses)/len(pauses) if pauses else 0,
        "max_pause": max(pauses) if pauses else 0,
        "pause_count": len([p for p in pauses if p > 1]),
        "wpm": (total_words/total_time)*60,
        "total_words": total_words
    }
