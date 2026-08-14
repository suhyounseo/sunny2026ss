#!/usr/bin/env python3
"""Validate review values, apply approval gates, and generate reports."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from workflow_common import WORKFLOW_ROOT, candidate_map, load_json


FIELDS = [
    "candidateId", "targetCode", "targetName", "topCode", "bottomCode", "topColor", "bottomColor",
    "colorMatch", "lengthMatch", "detailMatch", "fabricMatch", "silhouetteMatch", "materialMatch",
    "corePassCount", "hardFail", "hardFailReasons", "autoDecision", "realityScore", "status", "reviewPriority",
    "memo", "humanReviewMemo", "promptPath", "draftImagePath", "approvedImagePath",
]


def color_is_allowed(value: str, allowed: list[str]) -> bool:
    colors = [part.strip() for part in value.split("/") if part.strip()]
    return not colors or all(color in allowed for color in colors)


def prompt_path(row: dict, match_code: str) -> str:
    if row["status"] == "reference 재선정" or not match_code:
        return ""
    candidate_id = row.get("candidateId", "")
    marker = "_model_draft_"
    if marker in candidate_id:
        suffix = candidate_id.split(marker, 1)[1]
        variant_path = f"prompts/{row['targetCode']}_{match_code}_model_draft_{suffix}.txt"
        if (WORKFLOW_ROOT / variant_path).exists():
            return variant_path
    return f"prompts/{row['targetCode']}_{match_code}.txt"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build CSV and Markdown review reports")
    parser.add_argument("--input", default=str(WORKFLOW_ROOT / "config" / "review_results.sample.json"))
    parser.add_argument("--csv", default=str(WORKFLOW_ROOT / "reports" / "csv" / "modelcut_quality_review.csv"))
    parser.add_argument("--markdown", default=str(WORKFLOW_ROOT / "reports" / "markdown" / "modelcut_quality_review.md"))
    args = parser.parse_args()

    rows = load_json(Path(args.input))
    rules = load_json(WORKFLOW_ROOT / "config" / "review_rules.json")
    attributes = load_json(WORKFLOW_ROOT / "config" / "product_attributes.json")
    attribute_map = {item["targetCode"]: item for item in attributes}
    candidates = candidate_map()
    allowed = set(rules["allowedValues"])
    statuses = set(rules["statuses"])
    approval_statuses = set(rules["approvalStatuses"])
    core_fields = rules["coreApprovalFields"]
    minimum_passes = int(rules["minimumCorePassCount"])
    rendered = []

    for source_row in rows:
        row = dict(source_row)
        row["materialMatch"] = row.get("materialMatch", row.get("fabricMatch", ""))
        item = candidates[row["targetCode"]]
        for field in rules["fields"]:
            value = row.get(field, "")
            if value and value not in allowed:
                raise SystemExit(f"{row['targetCode']} {field}: invalid value {value!r}")
        if row["status"] not in statuses:
            raise SystemExit(f"{row['targetCode']}: invalid status {row['status']!r}")

        score = int(row.get("realityScore", 0))
        if score and not rules["realityScore"]["minimum"] <= score <= rules["realityScore"]["maximum"]:
            raise SystemExit(f"{row['targetCode']}: realityScore must be 1..5 or 0 for hold/exclude")

        hard_fail_reasons = []
        match_code = row.get("matchCode", "")
        metadata = attribute_map.get(f"{row['targetCode']}_{match_code}")
        if metadata:
            if not color_is_allowed(row.get("topColor", ""), metadata["top_allowed_colors"]):
                hard_fail_reasons.append("topColor outside allowed_colors")
            if not color_is_allowed(row.get("bottomColor", ""), metadata["bottom_allowed_colors"]):
                hard_fail_reasons.append("bottomColor outside allowed_colors")
        for field, failing_values in rules["hardFailFieldValues"].items():
            if row.get(field) in failing_values:
                hard_fail_reasons.append(f"{field}={row[field]}")
        flags = row.get("hardFailFlags", {})
        for flag in rules["hardFailFlags"]:
            if flags.get(flag, False):
                hard_fail_reasons.append(flag)

        core_pass_count = sum(row.get(field) == "O" for field in core_fields)
        hard_fail = bool(hard_fail_reasons)
        reviewed = any(row.get(field) for field in rules["fields"])
        eligible = reviewed and core_pass_count >= minimum_passes and not hard_fail
        if row["status"] in approval_statuses and not eligible:
            raise SystemExit(
                f"{row['candidateId']}: approval status requires {minimum_passes}/4 core passes and no hard fail"
            )
        if row["status"] == "reference 재선정" and row.get("draftImagePath"):
            raise SystemExit(f"{row['targetCode']}: model draft is forbidden before reference confirmation")

        if hard_fail:
            auto_decision = "즉시 탈락"
        elif not reviewed:
            auto_decision = "상태 유지"
        elif core_pass_count == len(core_fields):
            auto_decision = "승인 가능"
        elif core_pass_count >= minimum_passes:
            auto_decision = "조건부 승인 가능"
        else:
            auto_decision = "보완 후 재검토"

        human_memo = row.get("humanReviewMemo", row.get("memo", ""))
        rendered.append({
            "candidateId": row.get("candidateId", ""),
            "targetCode": row["targetCode"], "targetName": item["targetName"],
            "topCode": row["targetCode"] if item["targetType"] == "TOP" else "",
            "bottomCode": match_code if item["targetType"] == "TOP" else row["targetCode"],
            "topColor": row.get("topColor", ""), "bottomColor": row.get("bottomColor", ""),
            **{field: row.get(field, "") for field in rules["fields"]},
            "fabricMatch": row.get("materialMatch", ""),
            "corePassCount": core_pass_count if reviewed else "",
            "hardFail": "true" if hard_fail else "false",
            "hardFailReasons": "; ".join(hard_fail_reasons),
            "autoDecision": auto_decision,
            "realityScore": score or "", "status": row["status"], "reviewPriority": row.get("reviewPriority", ""),
            "memo": human_memo, "humanReviewMemo": human_memo,
            "promptPath": prompt_path(row, match_code),
            "draftImagePath": row.get("draftImagePath", ""), "approvedImagePath": row.get("approvedImagePath", ""),
        })

    csv_path = Path(args.csv)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rendered)

    md_path = Path(args.markdown)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# NICE 모델컷 품질 검토", "",
        "> 컬러·기장·디테일·실루엣 중 3개 이상 O이고 즉시 탈락 조건이 없어야 승인 후보가 될 수 있습니다.", "",
        "| 후보 | 조합 | 컬러 | 기장 | 디테일 | 실루엣 | 소재 | 통과 | 자동 판정 | 상태 | 우선순위 | 검토 메모 |",
        "|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---|",
    ]
    for row in rendered:
        combo = " + ".join(value for value in (row["topCode"], row["bottomCode"]) if value)
        memo = str(row["humanReviewMemo"]).replace("|", "\\|").replace("\n", " ")
        lines.append(
            f"| {row['candidateId']} | {combo} | {row['colorMatch']} | {row['lengthMatch']} | "
            f"{row['detailMatch']} | {row['silhouetteMatch']} | {row['materialMatch']} | "
            f"{row['corePassCount']}/4 | {row['autoDecision']} | {row['status']} | {row['reviewPriority']} | {memo} |"
        )
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"csv={csv_path}\nmarkdown={md_path}")


if __name__ == "__main__":
    main()
