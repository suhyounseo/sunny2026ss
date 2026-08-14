#!/usr/bin/env python3
"""Build a lightweight static GitHub Pages demo with review thumbnails."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError as exc:  # pragma: no cover - actionable environment message
    raise SystemExit("Pillow is required to build demo thumbnails") from exc

from workflow_common import REPO_ROOT, WORKFLOW_ROOT, candidate_map


DEMO_ROOT = REPO_ROOT / "modelcut-demo"
ASSET_ROOT = DEMO_ROOT / "assets"
DATA_PATH = DEMO_ROOT / "data" / "review_items.json"
REPORT_PATH = WORKFLOW_ROOT / "reports" / "csv" / "modelcut_quality_review.csv"


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
        image.thumbnail((720, 900), Image.Resampling.LANCZOS)
        image.save(output, "WEBP", quality=82, method=6)
    relative = f"assets/{output.name}"
    cache[key] = relative
    return relative


def main() -> None:
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    for stale in ASSET_ROOT.glob("thumb-*.webp"):
        stale.unlink()

    candidates = candidate_map()
    rows = list(csv.DictReader(REPORT_PATH.open(encoding="utf-8-sig")))
    cache: dict[str, str] = {}
    items = []
    for row in rows:
        item = candidates[row["targetCode"]]
        match = next(
            (candidate for candidate in item.get("matchCandidates", []) if candidate["matchCode"] == row["bottomCode"]),
            None,
        )
        top_source = (item.get("referenceImages") or [""])[0] if item.get("targetType") == "TOP" else ""
        bottom_source = (
            ((match or {}).get("referenceImages") or [""])[0]
            if item.get("targetType") == "TOP"
            else (item.get("referenceImages") or [""])[0]
        )
        items.append({
            "candidateId": row["candidateId"],
            "productCode": row["targetCode"],
            "productName": row["targetName"],
            "topCode": row["topCode"],
            "bottomCode": row["bottomCode"],
            "topImage": thumbnail_for(top_source, cache),
            "bottomImage": thumbnail_for(bottom_source, cache),
            "modelImage": thumbnail_for(row["draftImagePath"], cache),
            "colorMatch": row["colorMatch"],
            "lengthMatch": row["lengthMatch"],
            "detailMatch": row["detailMatch"],
            "fabricMatch": row["fabricMatch"],
            "silhouetteMatch": row["silhouetteMatch"],
            "status": row["status"],
            "memo": row["memo"],
        })

    payload = {
        "title": "NICE 모델컷 테스트 검토판",
        "notice": "테스트 배포용이며 products.json 및 실제 쇼룸에는 반영되지 않습니다.",
        "itemCount": len(items),
        "items": items,
    }
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"items={len(items)} thumbnails={len(cache)} data={DATA_PATH}")


if __name__ == "__main__":
    main()
