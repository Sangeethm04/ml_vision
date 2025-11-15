import numpy as np

from python_vision.recognizer import DeduplicatingRecognizer, RecognitionResult


class DummyRecognizer:
    def identify(self, frame):
        return [RecognitionResult(student_id="student-1", confidence=0.9)]


def test_deduplicating_recognizer_filters_repeated_events():
    dummy = DummyRecognizer()
    dedupe = DeduplicatingRecognizer(dummy, dedupe_seconds=60)
    first = dedupe.identify(np.zeros((10, 10)), timestamp=0)
    second = dedupe.identify(np.zeros((10, 10)), timestamp=30)
    third = dedupe.identify(np.zeros((10, 10)), timestamp=61)

    assert len(first) == 1
    assert len(second) == 0  # within window
    assert len(third) == 1
