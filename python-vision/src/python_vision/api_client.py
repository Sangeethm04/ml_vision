"""HTTP client for the Spring attendance API."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

import requests
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential_jitter

logger = structlog.get_logger(__name__)


@dataclass
class AttendancePayload:
    student_id: str
    session_id: str
    timestamp: datetime
    confidence: float
    present: bool = True

    def as_dict(self) -> Dict[str, Any]:
        return {
            "studentId": self.student_id,
            "sessionId": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "confidence": self.confidence,
            "present": self.present,
        }


class AttendanceApiClient:
    """Thin wrapper around the Spring REST API."""

    def __init__(self, base_url: str, api_key: str, timeout_seconds: int = 10) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds
        self.session = requests.Session()

    def _headers(self) -> Dict[str, str]:
        return {"X-API-Key": self.api_key, "Content-Type": "application/json"}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=2, max=10))
    def mark_attendance(self, payload: AttendancePayload) -> Dict[str, Any]:
        url = f"{self.base_url}/api/attendance"
        logger.info(
            "api_client.mark_attendance",
            url=url,
            student_id=payload.student_id,
            session_id=payload.session_id,
        )
        response = self.session.post(url, json=payload.as_dict(), headers=self._headers(), timeout=self.timeout_seconds)
        if response.status_code == 409:
            logger.info("api_client.duplicate", student_id=payload.student_id, session_id=payload.session_id)
            return response.json()
        response.raise_for_status()
        return response.json()

    def fetch_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/api/sessions/{session_id}"
        response = self.session.get(url, headers=self._headers(), timeout=self.timeout_seconds)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
