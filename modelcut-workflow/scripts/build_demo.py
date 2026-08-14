#!/usr/bin/env python3
"""Build the lightweight multi-image GitHub Pages review demo."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow is required to build demo thumbnails") from exc

WORKFLOW_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = WORKFLOW_ROOT.parent
DEMO_ROOT = REPO_ROOT / "modelcut-demo"
ASSET_ROOT = DEMO_ROOT / "assets"
DATA_PATH = DEMO_ROOT / "data" / "review_items.json"
SOURCE_PATH = WORKFLOW_ROOT / "data" / "review_items.json"


def thumbnail_for(source_path: str, cache: dict[str, str]) -> str:
    if not source_path:
        return ""
    source = WORKFLOW_ROOT / source_path
    if not source.exists():
        return ""
    key = source.resolve().as_posix()
    if key in cache:
        return cache[key]
    digest = hashlib.sha1(source_path.encode("utf-8")).hexdigest()[:12]
    output = ASSET_ROOT / f"thumb-{digest}.webp"
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((560, 700), Image.Resampling.LANCZOS)
        image.save(output, "WEBP", quality=78, method=6)
    relative = f"assets/{output.name}"
    cache[key] = relative
    return relative


def main() -> None:
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    for stale in ASSET_ROOT.glob("thumb-*.webp"):
        stale.unlink()
    payload = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    cache: dict[str, str] = {}
    for item in payload["items"]:
        item["topImages"] = [thumbnail_for(path, cache) for path in item["topImages"]]
        item["bottomImages"] = [thumbnail_for(path, cache) for path in item["bottomImages"]]
        item["referenceImages"] = [thumbnail_for(path, cache) for path in item["referenceImages"]]
        item["candidateImage"] = thumbnail_for(item["candidateImage"], cache)
    payload["itemCount"] = len(payload["items"])
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"items={len(payload['items'])} thumbnails={len(cache)} data={DATA_PATH}")


if __name__ == "__main__":
    main()
