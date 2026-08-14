#!/usr/bin/env python3
"""Build a normalized, read-only manifest from workflow config and products.json."""

from __future__ import annotations

import argparse
from pathlib import Path

from workflow_common import REPO_ROOT, WORKFLOW_ROOT, find_product, load_json, write_json


def summarize_product(product: dict | None) -> dict:
    if not product:
        return {"found": False}
    return {
        "found": True,
        "code": product.get("code", ""),
        "vendorCode": product.get("vendorCode", ""),
        "name": product.get("name", ""),
        "category": product.get("category", ""),
        "mainImage": product.get("mainImage", ""),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build normalized model-cut manifest")
    parser.add_argument("--products", default=str(REPO_ROOT / "products.json"))
    parser.add_argument("--output", default=str(WORKFLOW_ROOT / "input" / "normalized" / "modelcut_manifest.json"))
    args = parser.parse_args()

    products_path = Path(args.products)
    products = load_json(products_path) if products_path.exists() else []
    candidates = load_json(WORKFLOW_ROOT / "config" / "candidate_items.json")
    match_rules = load_json(WORKFLOW_ROOT / "config" / "match_rules.json")
    product_attributes = load_json(WORKFLOW_ROOT / "config" / "product_attributes.json")
    attribute_map = {item["targetCode"]: item for item in product_attributes}
    manifest = []
    for item in candidates:
        matches = []
        for match in item.get("matchCandidates", []):
            combination_code = f"{item['targetCode']}_{match['matchCode']}"
            attributes = attribute_map.get(combination_code)
            if not attributes:
                raise SystemExit(f"{combination_code}: missing product attributes")
            draft_count = int(attributes.get("draft_count", 2))
            matches.append({
                **match,
                "combinationCode": combination_code,
                "attributes": attributes,
                "plannedDrafts": [f"output/drafts/{combination_code}_model_draft_{index:02d}.png" for index in range(1, draft_count + 1)],
                "showroomProduct": summarize_product(find_product(products, match["matchCode"], match_rules)),
            })
        manifest.append({
            "targetCode": item["targetCode"],
            "targetName": item["targetName"],
            "targetType": item["targetType"],
            "exclude": item["exclude"],
            "status": item["status"],
            "colorOptions": item["colorOptions"],
            "referenceImages": item.get("referenceImages", []),
            "guardrails": item.get("guardrails", []),
            "matches": matches,
        })
    output = Path(args.output)
    write_json(output, {"sourceProducts": str(products_path), "readOnly": True, "items": manifest})
    print(output)


if __name__ == "__main__":
    main()
