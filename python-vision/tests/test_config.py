import os
from pathlib import Path

from python_vision.config import Settings


def test_settings_load_allows_missing_api_when_offline(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("SESSION_ID=test-session\nFRAME_SOURCE=0\n")
    monkeypatch.chdir(tmp_path)

    settings = Settings.load(env_path=env_file, require_api=False)

    assert settings.session_id == "test-session"
    assert settings.api_base_url == ""
    assert settings.api_key == ""
