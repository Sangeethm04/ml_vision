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

from .config import Settings
from .recognizer import FaceRecognizer, RecognitionResult

logger = structlog.get_logger(__name__)

settings = Settings.load(require_api=False)
recognizer = FaceRecognizer(
    roster_dir=settings.roster_dir,
    tolerance=settings.min_confidence,
    use_mock_backend=False,
)
logger.info("flask_server.loaded_roster", faces=len(recognizer._known_ids))

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "timestamp": time.time()})


def _decode_image(stream) -> np.ndarray:
    bytes_data = np.frombuffer(stream.read(), np.uint8)
    image = cv2.imdecode(bytes_data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image payload")
    return image


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
                "student_id": match.student_id,
                "confidence": match.confidence,
                "position": position,
            }
        )
    logger.info("flask_server.recognize_complete", matches=len(response))
    return jsonify({"recognized": response})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
