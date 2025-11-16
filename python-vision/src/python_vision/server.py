"""
Flask wrapper so front-end clients can submit frames and receive recognition
results. Power this service on Render so web clients can call `/recognize`.
"""

from __future__ import annotations

import io
import os
import time
from typing import List, Optional

import cv2
import numpy as np
import structlog
from flask import Flask, jsonify, request
from flask_cors import CORS

from .config import Settings
from .recognizer import FaceRecognizer, RecognitionResult
from .roster_sync import sync_roster

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------
# Lazy-loaded recognizer + settings (Render restarts the process often)
# ---------------------------------------------------------------------
settings = Settings.load(require_api=False)
sync_roster(settings)
recognizer = FaceRecognizer(
    roster_dir=settings.roster_dir,
    tolerance=settings.min_confidence,
    use_mock_backend=False,
)
logger.info("flask_server.loaded_roster", faces=len(recognizer._known_ids))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.get("/health")
def health():
    """Render health probe."""
    return jsonify({"status": "ok", "timestamp": time.time()})


@app.post("/reload")
def reload_roster():
    """Trigger a manual roster sync when new photos land in Spring."""
    downloaded = sync_roster(settings)
    recognizer.reload()
    logger.info("flask_server.reloaded_roster", photos=downloaded, faces=len(recognizer._known_ids))
    return jsonify({"status": "reloaded", "downloaded": downloaded, "faces": len(recognizer._known_ids)})


def _decode_image(stream) -> np.ndarray:
    """Decode multipart bytes into an OpenCV frame."""
    bytes_data = np.frombuffer(stream.read(), np.uint8)
    image = cv2.imdecode(bytes_data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image payload")
    return image


@app.post("/recognize")
def recognize():
    """Accept a photo, run it through the recognizer, return JSON array of matches."""
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
        position: Optional[str] = None
        if match.box:
            top, right, bottom, left = match.box
            position = ",".join(map(str, [top, right, bottom, left]))
        response.append(
            {
                "student_id": match.student_id,
                "confidence": match.confidence,
                "position": position,
            }
        )

    logger.info("flask_server.recognize_complete", matches=len(response))
    return jsonify({"recognized": response})


# When running on Render the platform injects PORT. Default to 5001 locally.
def create_app():
    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
