"""Utilities for loading application configuration."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


@dataclass
class Settings:
    """Runtime configuration loaded from the environment."""

    api_base_url: str
    api_key: str
    session_id: str
    roster_dir: Path
    frame_source: str
    min_confidence: float = 0.5
    dedupe_seconds: int = 120

    @classmethod
    def load(cls, env_path: Optional[Path] = None) -> "Settings":
        """Load settings from .env file and environment variables."""
        if env_path is None:
            env_path = Path(".env")
        load_dotenv(env_path)

        def read_env(name: str, default: Optional[str] = None) -> str:
            import os

            value = os.getenv(name)
            if value is None:
                if default is not None:
                    return default
                raise RuntimeError(f"Missing required environment variable: {name}")
            return value

        roster_dir = Path(read_env("ROSTER_DIR", "python-vision/roster"))
        roster_dir.mkdir(parents=True, exist_ok=True)
        return cls(
            api_base_url=read_env("API_BASE_URL"),
            api_key=read_env("API_KEY"),
            session_id=read_env("SESSION_ID"),
            roster_dir=roster_dir,
            frame_source=read_env("FRAME_SOURCE", "0"),
            min_confidence=float(read_env("MIN_CONFIDENCE", "0.5")),
            dedupe_seconds=int(read_env("DEDUPE_SECONDS", "120")),
        )
