#!/usr/bin/env python3
"""Generate one accuracy-first prompt per active target/match combination."""

from __future__ import annotations

import argparse
from pathlib import Path

from workflow_common import WORKFLOW_ROOT, load_json


def color_is_allowed(value: str, allowed: list[str]) -> bool:
    colors = [part.strip() for part in value.split("/") if part.strip()]
    return bool(colors) and all(color in allowed for color in colors)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate model-cut prompts")
    parser.add_argument("--output-dir", default=str(WORKFLOW_ROOT / "prompts"))
    args = parser.parse_args()

    items = load_json(WORKFLOW_ROOT / "config" / "candidate_items.json")
    rules = load_json(WORKFLOW_ROOT / "config" / "prompt_rules.json")
    attributes = load_json(WORKFLOW_ROOT / "config" / "product_attributes.json")
    attribute_map = {item["targetCode"]: item for item in attributes}
    template = (WORKFLOW_ROOT / "templates" / "prompt_template.txt").read_text(encoding="utf-8")
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    generated = 0
    combinations = 0
    for item in items:
        if item.get("exclude") or item.get("status") in {"보류", "reference 재선정"}:
            continue
        for match in sorted(item.get("matchCandidates", []), key=lambda value: value.get("priority", 999)):
            combination_code = f"{item['targetCode']}_{match['matchCode']}"
            metadata = attribute_map.get(combination_code)
            if not metadata:
                raise SystemExit(f"{combination_code}: product attributes are required before prompt generation")
            if not color_is_allowed(match.get("topColor", ""), metadata["top_allowed_colors"]):
                raise SystemExit(f"{combination_code}: top color {match.get('topColor')!r} is not allowed")
            if not color_is_allowed(match.get("bottomColor", ""), metadata["bottom_allowed_colors"]):
                raise SystemExit(f"{combination_code}: bottom color {match.get('bottomColor')!r} is not allowed")
            references = [*item.get("referenceImages", []), *match.get("referenceImages", [])]
            common_values = dict(
                targetCode=item["targetCode"], targetName=item["targetName"], matchCode=match["matchCode"],
                topColor=match.get("topColor", ""), bottomColor=match.get("bottomColor", ""),
                requiredSentences="\n".join(rules["requiredSentences"]), composition=rules["composition"],
                background=rules["background"], guardrails="\n".join(f"- {rule}" for rule in item.get("guardrails", [])),
                preflightChecks="\n".join(f"- {rule}" for rule in rules["preflightChecks"]),
                separateGarmentChecks="\n".join(f"- {rule}" for rule in rules["separateGarmentChecks"]),
                approvalGate=rules["approvalGate"],
                allowedColors=", ".join(metadata["allowed_colors"]),
                topShapeKeywords=", ".join(metadata["top_shape_keywords"]),
                bottomShapeKeywords=", ".join(metadata["bottom_shape_keywords"]),
                lengthType=metadata["length_type"],
                materialKeywords=", ".join(metadata["material_keywords"]),
                mustKeepDetails="\n".join(f"- {value}" for value in metadata["must_keep_details"]),
                forbiddenElements="\n".join(f"- {value}" for value in metadata["forbidden_elements"]),
                referenceImages="\n".join(f"- {path}" for path in references) or "- No local image linked yet",
            )
            variant_prompts = []
            for index, draft_variant in enumerate(rules["draftVariants"]):
                direction = "Strict neutral front-view catalog pose." if index == 0 else "A second restrained front-biased pose with both garments fully visible and unobstructed."
                prompt = template.format(**common_values, draftVariant=draft_variant, variantDirection=direction)
                variant_path = output_dir / f"{combination_code}_{draft_variant}.txt"
                variant_path.write_text(prompt.rstrip() + "\n", encoding="utf-8")
                variant_prompts.append(prompt)
                generated += 1
            (output_dir / f"{combination_code}.txt").write_text(variant_prompts[0].rstrip() + "\n", encoding="utf-8")
            combinations += 1
    print(f"combinations={combinations} variant_prompts={generated} output={output_dir}")


if __name__ == "__main__":
    main()
