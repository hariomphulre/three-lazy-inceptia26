import cv2
import numpy as np

def analyze_handwriting(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return 0.5, "ERROR_DECODE"

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Remove background & shadows
        dilated_bg = cv2.dilate(gray, np.ones((7,7), np.uint8))
        bg_blur = cv2.medianBlur(dilated_bg, 21)
        diff_img = 255 - cv2.absdiff(gray, bg_blur)
        norm_img = cv2.normalize(diff_img, None, 0, 255, cv2.NORM_MINMAX)

        _, binary = cv2.threshold(norm_img, 0, 255,
                                  cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 2))
        dilated = cv2.dilate(binary, kernel, iterations=1)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        boxes = []
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            if w > 30 and h > 8:
                boxes.append((y, h))

        boxes.sort(key=lambda b: b[0])

        if len(boxes) < 4:
            return 0.88, "HIGH RISK (No Structure)"

        rows = []
        cur_y = boxes[0][0]
        count = 1

        for i in range(1, len(boxes)):
            y, _ = boxes[i]
            if abs(y - cur_y) < 25:
                cur_y = (cur_y * count + y) / (count + 1)
                count += 1
            else:
                rows.append(cur_y)
                cur_y = y
                count = 1
        rows.append(cur_y)

        if len(rows) < 3:
            return 0.5, "INCONCLUSIVE"

        spacings = [rows[i] - rows[i-1] for i in range(1, len(rows))]
        median = np.median(spacings)

        valid = [s for s in spacings if 0.5*median < s < 1.8*median]
        if not valid:
            return 0.5, "INCONCLUSIVE"

        mean = np.mean(valid)
        std = np.std(valid)
        cv = std / mean if mean > 0 else 1.0

        if cv < 0.35:
            return 0.1 + cv, "NORMAL"
        elif cv < 0.55:
            return 0.4 + cv, "MILD IRREGULARITY"
        else:
            return 0.88, "HIGH RISK"

    except Exception as e:
        print(e)
        return 0.5, "ERROR"
