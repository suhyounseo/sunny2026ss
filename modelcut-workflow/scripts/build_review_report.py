#!/usr/bin/env python3
"""Validate review values and generate CSV/Markdown quality reports."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from workflow_common import WORKFLOW_ROOT, candidate_map, load_json


FIELDS = ["targetCode", "targetName", "topCode", "bottomCode", "topColor", "bottomColor", "colorMatch", "lengthMatch", "detailMatch", "fabricMatch", "fitMatch", "realityScore", "status", "memo", "promptPath", "draftImagePath", "approvedImagePath"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build CSV and Markdown review reports")
    parser.add_argument("--input", default=str(WORKFLOW_ROOT / "config" / "review_results.sample.json"))
    parser.add_argument("--csv", default=str(WORKFLOW_ROOT / "reports" / "csv" / "modelcut_quality_review.csv"))
    parser.add_argument("--markdown", default=str(WORKFLOW_ROOT / "reports" / "markdown" / "modelcut_quality_review.md"))
    args = parser.parse_args()

    rows = load_json(Path(args.input))
    rules = load_json(WORKFLOW_ROOT / "config" / "review_rules.json")
    candidates = candidate_map()
    allowed = set(rules["allowedValues"])
    statuses = set(rules["statuses"])
    rendered = []
    for row in rows:
        item = candidates[row["targetCode"]]
        for field in rules["fields"]:
            value = row.get(field, "")
            if value and value not in allowed:
                raise SystemExit(f"{row['targetCode']} {field}: invalid value {value!r}")
        score = int(row.get("realityScore", 0))
        if score and not rules["realityScore"]["minimum"] <= score <= rules["realityScore"]["maximum"]:
            raise SystemExit(f"{row['targetCode']}: realityScore must be 1..5 or 0 for hold/exclude")
        if row["status"] not in statuses:
            raise SystemExit(f"{row['targetCode']}: invalid status {row['status']!r}")
        match_code = row.get("matchCode", "")
        rendered.append({
            "targetCode": row["targetCode"], "targetName": item["targetName"],
            "topCode": row["targetCode"] if item["targetType"] == "TOP" else "",
            "bottomCode": match_code if item["targetType"] == "TOP" else row["targetCode"],
            "topColor": row.get("topColor", ""), "bottomColor": row.get("bottomColor", ""),
            **{field: row.get(field, "") for field in rules["fields"]},
            "realityScore": score or "", "status": row["status"], "memo": row.get("memo", ""),
            "promptPath": f"prompts/{row['targetCode']}_{match_code}.txt" if match_code else "",
            "draftImagePath": row.get("draftImagePath", ""), "approvedImagePath": row.get("approvedImagePath", ""),
        })

    csv_path = Path(args.csv); csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS); writer.writeheader(); writer.writerows(rendered)

    md_path = Path(args.markdown); md_path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# NICE 모델컷 품질 검토", "", "> 이 보고서는 검토용이며 쇼룸 반영 승인이 아닙니다.", "", "| 상품 | 조합 | 컬러 | 기장 | 디테일 | 원단 | 핏 | 현실감 | 상태 | 메모 |", "|---|---|---:|---:|---:|---:|---:|---:|---|---|"]
    for row in rendered:
        combo = " + ".join(value for value in (row["topCode"], row["bottomCode"]) if value)
        memo = str(row["memo"]).replace("|", "\\|").replace("\n", " ")
        lines.append(f"| {row['targetCode']} | {combo} | {row['colorMatch']} | {row['lengthMatch']} | {row['detailMatch']} | {row['fabricMatch']} | {row['fitMatch']} | {row['realityScore']} | {row['status']} | {memo} |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"csv={csv_path}\nmarkdown={md_path}")


if __name__ == "__main__":
    main()
