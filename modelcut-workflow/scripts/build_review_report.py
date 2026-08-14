#!/usr/bin/env python3
"""Validate review values and generate CSV/Markdown quality reports."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from workflow_common import WORKFLOW_ROOT, candidate_map, load_json


FIELDS = ["candidateId", "targetCode", "targetName", "topCode", "bottomCode", "topColor", "bottomColor", "colorMatch", "lengthMatch", "silhouetteMatch", "detailMatch", "fabricMatch", "realityScore", "status", "memo", "promptPath", "draftImagePath", "approvedImagePath"]


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
    approval_statuses = set(rules["approvalStatuses"])
    failure_statuses = set(rules["failureStatuses"])
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
        has_x = any(row.get(field) == "X" for field in rules["fields"])
        if has_x and row["status"] in approval_statuses:
            raise SystemExit(f"{row['targetCode']}: an X result cannot be an approval candidate")
        if has_x and row["status"] not in failure_statuses:
            raise SystemExit(f"{row['targetCode']}: an X result requires regeneration or reference reselection")
        if row["status"] == "reference 재선정" and row.get("draftImagePath"):
            raise SystemExit(f"{row['targetCode']}: model draft is forbidden before reference confirmation")
        match_code = row.get("matchCode", "")
        rendered.append({
            "candidateId": row.get("candidateId", ""),
            "targetCode": row["targetCode"], "targetName": item["targetName"],
            "topCode": row["targetCode"] if item["targetType"] == "TOP" else "",
            "bottomCode": match_code if item["targetType"] == "TOP" else row["targetCode"],
            "topColor": row.get("topColor", ""), "bottomColor": row.get("bottomColor", ""),
            **{field: row.get(field, "") for field in rules["fields"]},
            "realityScore": score or "", "status": row["status"], "memo": row.get("memo", ""),
            "promptPath": "" if row["status"] == "reference 재선정" else (f"prompts/{row['targetCode']}_{match_code}.txt" if match_code else ""),
            "draftImagePath": row.get("draftImagePath", ""), "approvedImagePath": row.get("approvedImagePath", ""),
        })

    csv_path = Path(args.csv); csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS); writer.writeheader(); writer.writerows(rendered)

    md_path = Path(args.markdown); md_path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# NICE 모델컷 품질 검토", "", "> 실제 상품 일치도를 우선하며, 어느 항목이든 X이면 승인 후보가 아닙니다.", "", "| 후보 | 상품 | 조합 | 컬러 | 기장 | 실루엣 | 디테일 | 원단 | 현실감 | 상태 | 메모 |", "|---|---|---|---:|---:|---:|---:|---:|---:|---|---|"]
    for row in rendered:
        combo = " + ".join(value for value in (row["topCode"], row["bottomCode"]) if value)
        memo = str(row["memo"]).replace("|", "\\|").replace("\n", " ")
        lines.append(f"| {row['candidateId']} | {row['targetCode']} | {combo} | {row['colorMatch']} | {row['lengthMatch']} | {row['silhouetteMatch']} | {row['detailMatch']} | {row['fabricMatch']} | {row['realityScore']} | {row['status']} | {memo} |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"csv={csv_path}\nmarkdown={md_path}")


if __name__ == "__main__":
    main()
