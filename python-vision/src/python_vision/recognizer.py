"""Face recognition pipeline built on top of face_recognition."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

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
    box: Optional[Tuple[int, int, int, int]] = None


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

    def reload(self) -> None:
        """Reload known faces from disk (e.g., after roster sync)."""
        self._known_encodings.clear()
        self._known_ids.clear()
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
        frame_id = id(frame)
        logger.debug("recognizer.detect_start", frame_id=frame_id)
        face_locations = face_recognition.face_locations(frame)
        logger.debug("recognizer.detect_complete", frame_id=frame_id, faces=len(face_locations))
        encodings = face_recognition.face_encodings(frame, face_locations)
        results: List[RecognitionResult] = []
        for encoding, box in zip(encodings, face_locations):
            match = self._match_encoding(encoding, frame_id=frame_id)
            if match:
                student_id, confidence = match
                results.append(RecognitionResult(student_id=student_id, confidence=confidence, box=box))
        return results

    def _match_encoding(self, encoding: np.ndarray, frame_id: int) -> Optional[Tuple[str, float]]:
        if not self._known_encodings:
            return None
        distances = face_recognition.face_distance(self._known_encodings, encoding)
        best_index = int(np.argmin(distances))
        distance = distances[best_index]
        logger.debug(
            "recognizer.match_result",
            frame_id=frame_id,
            best_student=self._known_ids[best_index],
            distance=float(distance),
            tolerance=self.tolerance,
        )
        if distance > self.tolerance:
            return None
        student_id = self._known_ids[best_index]
        confidence = float(max(0.0, 1.0 - distance))
        return student_id, confidence


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
