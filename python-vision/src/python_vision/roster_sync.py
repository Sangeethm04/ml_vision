"""Sync student photos from the Spring backend into the local roster directory."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

import requests
import structlog

from .config import Settings

logger = structlog.get_logger(__name__)


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _download_file(url: str, dest: Path, timeout: int = 15) -> None:
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    dest.write_bytes(resp.content)


def sync_roster(settings: Settings) -> int:
    """
    Pull all students from the Spring backend and download their photos into
    `settings.roster_dir` as {externalId}.jpg so the recognizer can load them.
    Returns the number of photos written.
    """
    base = settings.api_base_url.rstrip("/")
    students_url = f"{base}/api/students"
    _ensure_dir(settings.roster_dir)

    # Start from a clean slate to avoid stale photos
    for file in settings.roster_dir.glob("*"):
        try:
            file.unlink()
        except Exception as exc:  # pragma: no cover - filesystem
            logger.warning("roster_sync.cleanup_failed", path=str(file), error=str(exc))

    try:
        resp = requests.get(students_url, timeout=20)
        resp.raise_for_status()
    except Exception as exc:  # pragma: no cover - network
        logger.error("roster_sync.fetch_failed", url=students_url, error=str(exc))
        return 0

    students: Iterable[dict] = resp.json() or []
    written = 0
    for student in students:
        external_id = student.get("externalId")
        photo_url = student.get("photoUrl")
        if not external_id or not photo_url:
            continue

        # resolve full URL if needed
        full_url = photo_url if photo_url.startswith("http") else urljoin(base, photo_url)
        dest = settings.roster_dir / f"{external_id}.jpg"

        try:
            _download_file(full_url, dest)
            written += 1
        except Exception as exc:  # pragma: no cover - network
            logger.warning(
                "roster_sync.download_failed",
                student=external_id,
                url=full_url,
                error=str(exc),
            )

    logger.info("roster_sync.completed", downloaded=written, dir=str(settings.roster_dir))
    return written
