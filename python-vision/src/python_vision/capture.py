"""Video/image capture helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Generator, Iterable, Union

import cv2
import structlog

logger = structlog.get_logger(__name__)

FrameSource = Union[int, str]


class FrameCapture:
    """Single abstraction around all the ways we might receive pixels (webcam, file, folder)."""

    def __init__(self, source: FrameSource) -> None:
        self.source = source
        self._video = None

    def frames(self) -> Generator:
        """Yield frames as numpy arrays, routing to the correct private implementation."""
        if isinstance(self.source, int) or (isinstance(self.source, str) and self.source.isdigit()):
            yield from self._frames_from_camera(int(self.source))
            return

        path = Path(self.source).expanduser()
        if path.is_dir():
            yield from self._frames_from_directory(path)
            return
        if path.exists():
            yield from self._frames_from_video(path)
            return
        raise FileNotFoundError(f"Frame source '{self.source}' not found")

    def _frames_from_camera(self, index: int) -> Iterable:
        logger.info("capture.start_camera", camera_index=index)
        self._video = cv2.VideoCapture(index)
        if not self._video.isOpened():
            raise RuntimeError(f"Could not open camera index {index}")
        while True:
            success, frame = self._video.read()
            if not success:
                logger.info("capture.camera_complete")
                break
            yield frame

    def _frames_from_video(self, path: Path) -> Iterable:
        logger.info("capture.start_video", path=str(path))
        self._video = cv2.VideoCapture(str(path))
        if not self._video.isOpened():
            raise RuntimeError(f"Could not open video file {path}")
        while True:
            success, frame = self._video.read()
            if not success:
                break
            yield frame

    def _frames_from_directory(self, path: Path) -> Iterable:
        logger.info("capture.start_directory", path=str(path))
        image_paths = sorted(p for p in path.iterdir() if p.is_file())
        for image_path in image_paths:
            frame = cv2.imread(str(image_path))
            if frame is None:
                logger.warning("capture.skip_file", file=str(image_path))
                continue
            yield frame

    def close(self) -> None:
        if self._video is not None:
            self._video.release()
            self._video = None

    def __enter__(self) -> "FrameCapture":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: D401
        self.close()
