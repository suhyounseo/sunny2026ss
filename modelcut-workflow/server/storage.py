from __future__ import annotations

import base64
import io
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image

from .settings import settings


SAFE_JOB_ID = re.compile(r"^[A-Za-z0-9_.-]{1,100}$")
MIME_EXTENSIONS = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def job_dir(job_id: str) -> Path:
    if not SAFE_JOB_ID.fullmatch(job_id):
        raise ValueError("작업 ID는 영문, 숫자, 점, 밑줄, 하이픈만 사용할 수 있습니다.")
    target = (settings.output_root / job_id).resolve()
    root = settings.output_root.resolve()
    if root not in target.parents:
        raise ValueError("잘못된 작업 경로입니다.")
    return target


def atomic_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def _decode_image(data_url: str) -> tuple[bytes, str]:
    if not data_url.startswith("data:image/") or "," not in data_url:
        raise ValueError("브라우저 이미지 데이터가 없습니다. 이미지를 다시 업로드하세요.")
    header, encoded = data_url.split(",", 1)
    mime = header.split(";", 1)[0].removeprefix("data:")
    extension = MIME_EXTENSIONS.get(mime)
    if not extension:
        raise ValueError(f"지원하지 않는 이미지 형식입니다: {mime}")
    raw = base64.b64decode(encoded, validate=True)
    if len(raw) > settings.max_input_bytes:
        raise ValueError("이미지 한 장은 15MB를 초과할 수 없습니다.")
    return raw, extension


def _save_group(base: Path, group: str, images: list[dict[str, Any]]) -> list[dict[str, Any]]:
    saved: list[dict[str, Any]] = []
    group_dir = base / "inputs" / ({"top": "tops", "bottom": "bottoms", "reference": "references"}[group])
    group_dir.mkdir(parents=True, exist_ok=True)
    for index, image in enumerate(images, start=1):
        raw, extension = _decode_image(image.get("dataUrl") or image.get("src") or "")
        path = group_dir / f"{group}_{index:02d}{extension}"
        path.write_bytes(raw)
        with Image.open(path) as opened:
            opened.verify()
        saved.append({
            "id": image.get("id", ""), "name": image.get("name", path.name), "role": image.get("role", ""),
            "mimeType": image.get("type", ""), "size": len(raw), "path": path.relative_to(base).as_posix(),
        })
    return saved


def _save_uploaded_candidates(base: Path, images: list[dict[str, Any]]) -> list[str]:
    saved: list[str] = []
    if not images:
        return saved
    generated = base / "generated"
    generated.mkdir(parents=True, exist_ok=True)
    for existing in generated.glob("candidate_*.png"):
        existing.unlink()
    for index, image in enumerate(images[:3], start=1):
        raw, _extension = _decode_image(image.get("dataUrl") or image.get("src") or "")
        path = generated / f"candidate_{index:02d}.png"
        with Image.open(io.BytesIO(raw)) as opened:
            opened.convert("RGB").save(path, format="PNG")
        saved.append(path.relative_to(base).as_posix())
    return saved


def save_job(payload: dict[str, Any], prompt: str) -> dict[str, Any]:
    base = job_dir(payload["jobId"])
    base.mkdir(parents=True, exist_ok=True)
    (base / "generated").mkdir(exist_ok=True)
    (base / "logs").mkdir(exist_ok=True)
    images = payload.get("images") or {}
    stored_inputs = {
        "top": _save_group(base, "top", images.get("top") or []),
        "bottom": _save_group(base, "bottom", images.get("bottom") or []),
        "reference": _save_group(base, "reference", images.get("reference") or []),
    }
    uploaded_candidates = _save_uploaded_candidates(base, images.get("candidate") or [])
    persisted = {key: value for key, value in payload.items() if key != "images"}
    persisted["storedInputs"] = stored_inputs
    persisted["candidatePaths"] = uploaded_candidates or payload.get("candidatePaths", [])
    persisted["prompt"] = prompt
    persisted["savedAt"] = utc_now()
    atomic_json(base / "request.json", persisted)
    (base / "prompt.txt").write_text(prompt, encoding="utf-8")
    manifest = payload.get("referenceImagesManifest") or {"jobId": payload["jobId"]}
    manifest = {**manifest, "storedInputs": stored_inputs}
    atomic_json(base / "manifest.json", manifest)
    return persisted


def load_job(job_id: str) -> dict[str, Any] | None:
    return read_json(job_dir(job_id) / "request.json")


def write_log(job_id: str, log: dict[str, Any]) -> None:
    atomic_json(job_dir(job_id) / "logs" / "generation_log.json", log)


def load_log(job_id: str) -> dict[str, Any]:
    return read_json(job_dir(job_id) / "logs" / "generation_log.json", {"jobId": job_id, "status": "준비 전", "completedCount": 0})


def list_jobs() -> list[dict[str, Any]]:
    settings.output_root.mkdir(parents=True, exist_ok=True)
    results = []
    for path in settings.output_root.iterdir():
        if path.is_dir() and (path / "request.json").exists():
            request = read_json(path / "request.json", {})
            results.append({"jobId": path.name, "topCode": request.get("topCode", ""), "bottomCode": request.get("bottomCode", ""), **load_log(path.name)})
    return sorted(results, key=lambda item: item.get("updatedAt", ""), reverse=True)


def candidate_paths(job_id: str) -> list[Path]:
    generated = job_dir(job_id) / "generated"
    return sorted(generated.glob("candidate_*.png")) if generated.exists() else []


def clear_candidates(job_id: str) -> None:
    for path in candidate_paths(job_id):
        path.unlink()


def delete_job(job_id: str) -> None:
    target = job_dir(job_id)
    if target.exists():
        shutil.rmtree(target)
