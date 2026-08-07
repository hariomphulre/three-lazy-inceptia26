import random
from config import BASE_POWERS, BLINK_AMPLITUDE, JAW_CLENCH_NOISE

class EEGSimulator:
    def __init__(self):
        self.noise = {k: 0 for k in BASE_POWERS}

    def _pink(self, band):
        white = random.uniform(-1, 1)
        self.noise[band] = 0.95 * self.noise[band] + 0.05 * white
        return self.noise[band] * 1000

    def generate_epoch(self, state="FOCUSED", behavior_modifiers=None):
        powers = {}

        for band, base in BASE_POWERS.items():
            powers[band] = base + self._pink(band)

        if state == "FOCUSED":
            powers["low_beta"] *= 1.5
            powers["theta"] *= 0.6

        if behavior_modifiers and behavior_modifiers.get("mouse_jerk", 0) > 2:
            noise = JAW_CLENCH_NOISE
            powers["high_beta"] += noise
            powers["low_gamma"] += noise

        return powers
