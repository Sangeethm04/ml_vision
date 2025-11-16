"""
Flask wrapper so front-end clients can submit frames and receive recognition
results without talking directly to the long-running capture agent.
"""

from __future__ import annotations

import io
import time
from typing import List, Optional

import cv2
import numpy as np
import structlog
from flask import Flask, jsonify, request
from flask_cors import CORS  # <-- CORS ENABLED

from .config import Settings
from .recognizer import FaceRecognizer, RecognitionResult
from .roster_sync import sync_roster

logger = structlog.get_logger(__name__)

# ----------------------------------------------------
# Load settings + recognizer
# ----------------------------------------------------
settings = Settings.load(require_api=False)
# Sync roster photos from Spring backend before loading recognizer
sync_roster(settings)

recognizer = FaceRecognizer(
    roster_dir=settings.roster_dir,      # folder containing .jpg files
    tolerance=settings.min_confidence,
    use_mock_backend=False,
)

logger.info("flask_server.loaded_roster", faces=len(recognizer._known_ids))

# ----------------------------------------------------
# Flask app with full CORS support
# ----------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.get("/health")
def health():
    return jsonify({"status": "ok", "timestamp": time.time()})


@app.post("/reload")
def reload_roster():
    """Sync roster from Spring backend and reload recognizer encodings."""
    downloaded = sync_roster(settings)
    recognizer.reload()
    logger.info("flask_server.reloaded_roster", photos=downloaded, faces=len(recognizer._known_ids))
    return jsonify({"status": "reloaded", "downloaded": downloaded, "faces": len(recognizer._known_ids)})


# ----------------------------------------------------
# Utility: decode uploaded image bytes using OpenCV
# ----------------------------------------------------
def _decode_image(stream) -> np.ndarray:
    bytes_data = np.frombuffer(stream.read(), np.uint8)
    image = cv2.imdecode(bytes_data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image payload")
    return image


# ----------------------------------------------------
# POST /recognize — return recognized students
# ----------------------------------------------------
@app.post("/recognize")
def recognize():
    """
    Accepts multipart/form-data with field `image`.
    Returns list of recognized students with bounding boxes.
    """
    if "image" not in request.files:
        return jsonify({"error": "image file missing"}), 400

    image_file = request.files["image"]

    try:
        frame = _decode_image(image_file.stream)
    except ValueError as exc:
        logger.warning("flask_server.decode_failed", error=str(exc))
        return jsonify({"error": str(exc)}), 400

    matches: List[RecognitionResult] = recognizer.identify(frame)

    response = []
    for match in matches:
        box = match.box
        position: Optional[str] = None
        if box:
            top, right, bottom, left = box
            position = ",".join(map(str, [top, right, bottom, left]))

        response.append(
            {
                "student_id": match.student_id,   # <- THIS is what we must debug
                "confidence": match.confidence,
                "position": position,
            }
        )

    logger.info("flask_server.recognize_complete", matches=len(response))

    # ------------------------------------------------
    # DEBUG PRINT: SHOW EXACT RAW RECOGNIZER OUTPUT
    # ------------------------------------------------
    print("🔥 PYTHON OUTPUT:", response)

    return jsonify({"recognized": response})


# ----------------------------------------------------
# Run server
# ----------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
