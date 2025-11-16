"""Utilities for loading application configuration."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


@dataclass
class Settings:
    """Strongly-typed view of the .env file so the rest of the app can rely on one source of truth."""

    # Which class session attendance should be attached to when we POST to Spring
    session_id: str
    # Folder containing the roster photos that get turned into embeddings
    roster_dir: Path
    # Camera index, video path, or folder of stills used for capture
    frame_source: str
    # Connectivity info for the Spring API (skipped when running in --dry-run mode)
    api_base_url: str = field(default="")
    api_key: str = field(default="")
    # Face-recognition threshold and duplicate suppression window
    min_confidence: float = 0.5
    dedupe_seconds: int = 120

    @classmethod
    def load(cls, env_path: Optional[Path] = None, require_api: bool = True) -> "Settings":
        """Load settings from .env file and environment variables."""
        if env_path is None:
            env_path = Path(".env")
        load_dotenv(env_path)

        def read_env(name: str, default: Optional[str] = None, required: bool = True) -> str:
            """Helper that centralises error handling / defaults for env vars."""
            import os

            value = os.getenv(name)
            if value is None:
                if required:
                    if default is not None:
                        return default
                    raise RuntimeError(f"Missing required environment variable: {name}")
                return default or ""
            return value

        roster_dir = Path(read_env("ROSTER_DIR", "python-vision/roster", required=False) or "python-vision/roster")
        roster_dir.mkdir(parents=True, exist_ok=True)
        return cls(
            session_id=read_env("SESSION_ID"),
            roster_dir=roster_dir,
            frame_source=read_env("FRAME_SOURCE", "0"),
            api_base_url=read_env("API_BASE_URL", required=require_api),
            api_key=read_env("API_KEY", required=require_api),
            min_confidence=float(read_env("MIN_CONFIDENCE", "0.5")),
            dedupe_seconds=int(read_env("DEDUPE_SECONDS", "120")),
        )
