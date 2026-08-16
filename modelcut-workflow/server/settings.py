from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


WORKFLOW_ROOT = Path(__file__).resolve().parents[1]


def _load_local_env() -> None:
    env_path = WORKFLOW_ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_local_env()


@dataclass(frozen=True)
class Settings:
    provider: str = os.getenv("MODELCUT_PROVIDER", "openai").strip().lower()
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    image_model: str = os.getenv("MODELCUT_IMAGE_MODEL", "gpt-image-2").strip()
    image_quality: str = os.getenv("MODELCUT_IMAGE_QUALITY", "medium").strip()
    image_size: str = os.getenv("MODELCUT_IMAGE_SIZE", "1024x1536").strip()
    api_host: str = os.getenv("MODELCUT_API_HOST", "127.0.0.1").strip()
    api_port: int = int(os.getenv("MODELCUT_API_PORT", "8787"))
    output_root: Path = WORKFLOW_ROOT / "output" / "generation_jobs"
    max_input_bytes: int = 15 * 1024 * 1024


settings = Settings()
