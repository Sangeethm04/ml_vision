"""CLI entry point for the ML Vision Python agent."""

from __future__ import annotations

import argparse
import time
from datetime import datetime, timezone

import structlog
import cv2

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
    parser.add_argument("--dry-run", action="store_true", help="Skip API calls (useful when Spring API is offline)")
    parser.add_argument("--preview", action="store_true", help="Show a live OpenCV window with detections")
    return parser


def show_preview_frame(frame, matches):
    display = frame.copy()
    for match in matches:
        if not match.box:
            continue
        top, right, bottom, left = match.box
        cv2.rectangle(display, (left, top), (right, bottom), (0, 255, 0), 2)
        label = f"{match.student_id} ({match.confidence:.2f})"
        cv2.putText(display, label, (left, max(20, top - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    cv2.imshow("Attendance Camera", display)
    key = cv2.waitKey(1)
    return key == -1 or key & 0xFF != ord("q")


def run() -> None:
    args = build_parser().parse_args()
    settings = Settings.load(require_api=not args.dry_run)
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
    api_client = None if args.dry_run else AttendanceApiClient(settings.api_base_url, settings.api_key)

    with FrameCapture(frame_source) as capture:
        for frame in capture.frames():
            now = time.time()
            matches = dedupe.identify(frame, timestamp=now)
            if args.preview:
                if not show_preview_frame(frame, matches):
                    logger.info("agent.preview_exit")
                    break
            if not matches:
                continue
            for match in matches:
                payload = AttendancePayload(
                    student_id=match.student_id,
                    session_id=session_id,
                    timestamp=datetime.now(tz=timezone.utc),
                    confidence=match.confidence,
                )
                if api_client is None:
                    logger.info(
                        "agent.dry_run_attendance",
                        student_id=match.student_id,
                        session_id=session_id,
                        confidence=match.confidence,
                    )
                    continue
                try:
                    api_client.mark_attendance(payload)
                except Exception as exc:  # pragma: no cover - network
                    logger.exception(
                        "agent.attendance_failure",
                        student_id=match.student_id,
                        error=str(exc),
                    )
    if args.preview:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run()
