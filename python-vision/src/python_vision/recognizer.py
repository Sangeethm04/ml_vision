"""Face recognition pipeline built on top of face_recognition."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import numpy as np
import structlog

try:
    import face_recognition
except ImportError:  # pragma: no cover - optional heavy dependency
    face_recognition = None


logger = structlog.get_logger(__name__)


@dataclass
class RecognitionResult:
    student_id: str
    confidence: float


class FaceRecognizer:
    """
    Loads known encodings from disk (named `<studentId>*.jpg`) and attempts to
    identify students in each frame.
    """

    def __init__(
        self,
        roster_dir: Path,
        tolerance: float = 0.5,
        use_mock_backend: bool = False,
    ) -> None:
        if face_recognition is None and not use_mock_backend:
            raise RuntimeError(
                "face_recognition dependency missing. Install via requirements or set use_mock_backend=True."
            )
        self.roster_dir = roster_dir
        self.tolerance = tolerance
        self.use_mock_backend = use_mock_backend
        self._known_encodings: List[np.ndarray] = []
        self._known_ids: List[str] = []
        self._load_known_faces()

    def _load_known_faces(self) -> None:
        if self.use_mock_backend:
            logger.warning("recognizer.mock_backend_enabled")
            return
        for image_path in self._face_image_paths():
            image = face_recognition.load_image_file(str(image_path))
            encodings = face_recognition.face_encodings(image)
            if not encodings:
                logger.warning("recognizer.no_face_found", file=str(image_path))
                continue
            student_id = image_path.stem.split("_")[0]
            self._known_encodings.append(encodings[0])
            self._known_ids.append(student_id)
            logger.info("recognizer.added_face", student_id=student_id, file=str(image_path))

    def _face_image_paths(self) -> Iterable[Path]:
        for path in sorted(self.roster_dir.glob("*.jpg")):
            yield path
        for path in sorted(self.roster_dir.glob("*.png")):
            yield path

    def identify(self, frame) -> List[RecognitionResult]:
        if self.use_mock_backend:
            return []
        face_locations = face_recognition.face_locations(frame)
        encodings = face_recognition.face_encodings(frame, face_locations)
        results: List[RecognitionResult] = []
        for encoding in encodings:
            result = self._match_encoding(encoding)
            if result:
                results.append(result)
        return results

    def _match_encoding(self, encoding: np.ndarray) -> Optional[RecognitionResult]:
        if not self._known_encodings:
            return None
        distances = face_recognition.face_distance(self._known_encodings, encoding)
        best_index = int(np.argmin(distances))
        distance = distances[best_index]
        if distance > self.tolerance:
            return None
        student_id = self._known_ids[best_index]
        confidence = float(max(0.0, 1.0 - distance))
        return RecognitionResult(student_id=student_id, confidence=confidence)


class DeduplicatingRecognizer:
    """Wraps `FaceRecognizer` and suppresses repeated events within a window."""

    def __init__(self, recognizer: FaceRecognizer, dedupe_seconds: int) -> None:
        self.recognizer = recognizer
        self.dedupe_seconds = dedupe_seconds
        self._history: Dict[str, float] = {}

    def identify(self, frame, *, timestamp: float) -> List[RecognitionResult]:
        matches = self.recognizer.identify(frame)
        filtered: List[RecognitionResult] = []
        for match in matches:
            last_seen = self._history.get(match.student_id)
            if last_seen is not None and (timestamp - last_seen) < self.dedupe_seconds:
                logger.debug(
                    "recognizer.duplicate_skip",
                    student_id=match.student_id,
                    last_seen=last_seen,
                    now=timestamp,
                )
                continue
            self._history[match.student_id] = timestamp
            filtered.append(match)
        return filtered
