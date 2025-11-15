"""CLI entry point for the ML Vision Python agent."""

from __future__ import annotations

import argparse
import time
from datetime import datetime, timezone

import structlog

from .api_client import AttendanceApiClient, AttendancePayload
from .capture import FrameCapture
from .config import Settings
from .recognizer import DeduplicatingRecognizer, FaceRecognizer

logger = structlog.get_logger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Classroom attendance collector")
    parser.add_argument("--session-id", help="Override SESSION_ID from env")
    parser.add_argument("--source", help="Camera index or path to video/images")
    parser.add_argument("--mock-recognizer", action="store_true", help="Enable mock recognition backend")
    return parser


def run() -> None:
    args = build_parser().parse_args()
    settings = Settings.load()
    session_id = args.session_id or settings.session_id
    frame_source = args.source or settings.frame_source

    logger.info(
        "agent.start",
        session_id=session_id,
        frame_source=frame_source,
        roster_dir=str(settings.roster_dir),
    )

    recognizer = FaceRecognizer(
        roster_dir=settings.roster_dir,
        tolerance=settings.min_confidence,
        use_mock_backend=args.mock_recognizer,
    )
    dedupe = DeduplicatingRecognizer(recognizer, dedupe_seconds=settings.dedupe_seconds)
    api_client = AttendanceApiClient(settings.api_base_url, settings.api_key)

    with FrameCapture(frame_source) as capture:
        for frame in capture.frames():
            now = time.time()
            matches = dedupe.identify(frame, timestamp=now)
            if not matches:
                continue
            for match in matches:
                payload = AttendancePayload(
                    student_id=match.student_id,
                    session_id=session_id,
                    timestamp=datetime.now(tz=timezone.utc),
                    confidence=match.confidence,
                )
                try:
                    api_client.mark_attendance(payload)
                except Exception as exc:  # pragma: no cover - network
                    logger.exception(
                        "agent.attendance_failure",
                        student_id=match.student_id,
                        error=str(exc),
                    )


if __name__ == "__main__":
    run()
