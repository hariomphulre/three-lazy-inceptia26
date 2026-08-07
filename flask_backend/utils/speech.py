from faster_whisper import WhisperModel

model = WhisperModel("medium", device="cpu", compute_type="int8")

def transcribe(audio_path):
    segments, _ = model.transcribe(audio_path, word_timestamps=True)
    words = []

    for seg in segments:
        for w in seg.words:
            words.append({
                "start": w.start,
                "end": w.end
            })

    return words
