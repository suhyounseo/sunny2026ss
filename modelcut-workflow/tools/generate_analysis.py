#!/usr/bin/env python3
"""Generate editable product-analysis contracts and review items."""

from __future__ import annotations

import argparse
from pathlib import Path

from workflow_lib import WORKFLOW_ROOT, evaluation, read_json, write_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate product analysis before model-cut generation")
    parser.add_argument("--input", type=Path, default=WORKFLOW_ROOT / "output" / "analysis" / "prepared_items.json")
    parser.add_argument("--output", type=Path, default=WORKFLOW_ROOT / "output" / "analysis" / "product_analysis.json")
    parser.add_argument("--review-output", type=Path, default=WORKFLOW_ROOT / "data" / "review_items.json")
    args = parser.parse_args()
    if not args.input.exists():
        raise SystemExit("prepared_items.json이 없습니다. 먼저 modelcut_workflow.py prepare를 실행하세요.")
    source = read_json(args.input)
    saved_state_path = WORKFLOW_ROOT / "config" / "review_state.json"
    saved_state = read_json(saved_state_path).get("items", {}) if saved_state_path.exists() else {}
    analyses = []
    review_items = []
    for item in source["items"]:
        analysis = {
            "topCode": item["topCode"], "bottomCode": item["bottomCode"],
            "topColor": item["topColor"], "bottomColor": item["bottomColor"],
            "allowedColors": item["allowedColors"],
            "topLength": item.get("topLength", ""), "bottomLength": item.get("bottomLength", ""),
            "topSilhouette": item.get("topSilhouette", ""), "bottomSilhouette": item.get("bottomSilhouette", ""),
            "topDetails": item.get("topDetails", []), "bottomDetails": item.get("bottomDetails", []),
            "fabricKeywords": item.get("fabricKeywords", []),
            "mustPreserve": item.get("mustPreserve", []), "avoidList": item.get("avoidList", []),
            "generationRules": [
                "Use the real product images as the primary reference.",
                "Do not invent new colors.",
                "Do not simplify or replace the actual skirt silhouette.",
                "Preserve the actual length, pockets, buttons, ribbons, frills and seam positions.",
                "Vendor references are for pose and mood only, never product details."
            ],
        }
        analyses.append({"targetCode": item["targetCode"], "generationBlocked": bool(item.get("generationBlocked")), "analysis": analysis})
        candidates = item.get("candidates", []) or [{"candidateId": f"{item['targetCode']}_model_draft_01", "image": "", "status": "보류", "scores": {}}]
        for candidate in candidates:
            scores = {field: candidate.get("scores", {}).get(field, "") for field in ("colorMatch", "lengthMatch", "detailMatch", "fabricMatch", "silhouetteMatch")}
            verdict = evaluation(scores, candidate.get("hardFailFlags"))
            review = {
                "candidateId": candidate["candidateId"], "targetCode": item["targetCode"],
                "topCode": item["topCode"], "topName": item["topName"], "topColor": item["topColor"],
                "bottomCode": item["bottomCode"], "bottomName": item["bottomName"], "bottomColor": item["bottomColor"],
                "topImages": item.get("topImages", []), "bottomImages": item.get("bottomImages", []),
                "referenceImages": item.get("referenceImages", []), "candidateImage": candidate.get("image", ""),
                "analysis": analysis, "scores": scores, "evaluation": verdict,
                "status": candidate.get("status", verdict["recommendation"]), "approved": candidate.get("status") == "승인",
                "memo": candidate.get("memo", item.get("memo", "")), "regenerationMemo": candidate.get("regenerationMemo", ""),
                "generationBlocked": bool(item.get("generationBlocked")),
            }
            review.update(saved_state.get(candidate["candidateId"], {}))
            review_items.append(review)
    write_json(args.output, {"schemaVersion": 1, "items": analyses})
    write_json(args.review_output, {"schemaVersion": 1, "title": "NICE 모델컷 multi-image 검토판", "notice": "테스트 전용 · 운영 쇼룸과 products.json에는 반영되지 않습니다.", "items": review_items})
    print(f"analysis={len(analyses)} reviewItems={len(review_items)} output={args.output}")


if __name__ == "__main__":
    main()
