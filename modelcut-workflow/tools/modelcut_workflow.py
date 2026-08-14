#!/usr/bin/env python3
"""Prepare multi-image jobs and persist reviewer decisions."""

from __future__ import annotations

import argparse
from copy import deepcopy
from pathlib import Path

from workflow_lib import SETTINGS_PATH, WORKFLOW_ROOT, read_json, write_json

REQUIRED = ["targetCode", "topCode", "topName", "topColor", "bottomCode", "bottomName", "bottomColor"]


def prepare(input_path: Path, output_path: Path) -> None:
    payload = read_json(input_path)
    settings = read_json(SETTINGS_PATH)
    limits = settings["imageLimits"]
    candidate_limits = settings["candidateLimits"]
    prepared = []
    errors = []
    for index, source in enumerate(payload.get("items", []), start=1):
        item = deepcopy(source)
        label = item.get("targetCode", f"item #{index}")
        missing = [field for field in REQUIRED if not str(item.get(field, "")).strip()]
        if missing:
            errors.append(f"{label}: 필수 필드 누락 - {', '.join(missing)}")
        allowed_colors = item.get("allowedColors", {})
        for garment, color_field in (("top", "topColor"), ("bottom", "bottomColor")):
            allowed = allowed_colors.get(garment, [])
            if not allowed:
                errors.append(f"{label}: allowedColors.{garment}이 비어 있습니다")
            elif item.get(color_field) not in allowed:
                errors.append(f"{label}: {color_field}={item.get(color_field)!r}가 allowedColors.{garment}에 없습니다")
        for field in ("topImages", "bottomImages", "referenceImages"):
            images = item.get(field, [])
            if not isinstance(images, list):
                errors.append(f"{label}: {field}는 배열이어야 합니다")
                continue
            if len(images) > limits[field]:
                errors.append(f"{label}: {field} 최대 {limits[field]}장 (현재 {len(images)}장)")
        count = int(item.get("candidateCount", candidate_limits["default"]))
        if not candidate_limits["minimum"] <= count <= candidate_limits["maximum"]:
            errors.append(f"{label}: candidateCount는 {candidate_limits['minimum']}~{candidate_limits['maximum']}")
        if item.get("generationBlocked") and any(candidate.get("image") for candidate in item.get("candidates", [])):
            errors.append(f"{label}: reference 확정 전 candidate image를 연결할 수 없습니다")
        item["candidateCount"] = count
        item["referencePolicy"] = settings["referencePolicy"]
        prepared.append(item)
    if errors:
        raise SystemExit("입력 검증 실패:\n- " + "\n- ".join(errors))
    write_json(output_path, {"schemaVersion": payload.get("schemaVersion", 1), "items": prepared})
    print(f"prepared={len(prepared)} output={output_path}")


def update_review(candidate_id: str, status: str | None, approved: str | None, memo: str | None, regeneration_memo: str | None) -> None:
    data_path = WORKFLOW_ROOT / "data" / "review_items.json"
    state_path = WORKFLOW_ROOT / "config" / "review_state.json"
    payload = read_json(data_path)
    matches = [item for item in payload["items"] if item["candidateId"] == candidate_id]
    if not matches:
        raise SystemExit(f"후보를 찾을 수 없습니다: {candidate_id}")
    item = matches[0]
    verdict = item["evaluation"]
    next_status = status if status is not None else item["status"]
    next_approved = approved.lower() == "true" if approved is not None else item["approved"]
    if next_status == "승인" and (verdict["hardFail"] or verdict["passCount"] < 4):
        raise SystemExit("승인 상태는 4/5 O이며 hard fail이 없어야 합니다")
    if next_status == "조건부 승인" and (verdict["hardFail"] or verdict["passCount"] < 3):
        raise SystemExit("조건부 승인은 3/5 O이며 hard fail이 없어야 합니다")
    if next_approved and (verdict["hardFail"] or verdict["passCount"] < 3):
        raise SystemExit("최종 승인 체크는 3/5 O 이상이며 hard fail이 없어야 합니다")
    if status is not None:
        item["status"] = status
    if approved is not None:
        item["approved"] = next_approved
    if memo is not None:
        item["memo"] = memo
    if regeneration_memo is not None:
        item["regenerationMemo"] = regeneration_memo
    state = read_json(state_path) if state_path.exists() else {"items": {}}
    state["items"][candidate_id] = {key: item[key] for key in ("status", "approved", "memo", "regenerationMemo")}
    write_json(data_path, payload)
    write_json(state_path, state)
    print(f"updated={candidate_id} status={item['status']} approved={item['approved']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="NICE multi-image modelcut workflow")
    sub = parser.add_subparsers(dest="command", required=True)
    prepare_parser = sub.add_parser("prepare", help="입력 JSON 검증 및 정규화")
    prepare_parser.add_argument("--input", type=Path, default=WORKFLOW_ROOT / "data" / "input_items.sample.json")
    prepare_parser.add_argument("--output", type=Path, default=WORKFLOW_ROOT / "output" / "analysis" / "prepared_items.json")
    review_parser = sub.add_parser("review", help="검토 상태를 JSON에 저장")
    review_parser.add_argument("--candidate-id", required=True)
    review_parser.add_argument("--status")
    review_parser.add_argument("--approved", choices=("true", "false"))
    review_parser.add_argument("--memo")
    review_parser.add_argument("--regeneration-memo")
    args = parser.parse_args()
    if args.command == "prepare":
        prepare(args.input, args.output)
    else:
        update_review(args.candidate_id, args.status, args.approved, args.memo, args.regeneration_memo)


if __name__ == "__main__":
    main()
