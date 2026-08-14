#!/usr/bin/env python3
"""Generate one accuracy-first prompt per active target/match combination."""

from __future__ import annotations

import argparse
from pathlib import Path

from workflow_common import WORKFLOW_ROOT, load_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate model-cut prompts")
    parser.add_argument("--output-dir", default=str(WORKFLOW_ROOT / "prompts"))
    args = parser.parse_args()

    items = load_json(WORKFLOW_ROOT / "config" / "candidate_items.json")
    rules = load_json(WORKFLOW_ROOT / "config" / "prompt_rules.json")
    template = (WORKFLOW_ROOT / "templates" / "prompt_template.txt").read_text(encoding="utf-8")
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    generated = 0
    for item in items:
        if item.get("exclude") or item.get("status") == "보류":
            continue
        for match in sorted(item.get("matchCandidates", []), key=lambda value: value.get("priority", 999)):
            references = [*item.get("referenceImages", []), *match.get("referenceImages", [])]
            prompt = template.format(
                targetCode=item["targetCode"], targetName=item["targetName"], matchCode=match["matchCode"],
                topColor=match.get("topColor", ""), bottomColor=match.get("bottomColor", ""),
                requiredSentences="\n".join(rules["requiredSentences"]), composition=rules["composition"],
                background=rules["background"], guardrails="\n".join(f"- {rule}" for rule in item.get("guardrails", [])),
                referenceImages="\n".join(f"- {path}" for path in references) or "- No local image linked yet",
            )
            path = output_dir / f"{item['targetCode']}_{match['matchCode']}.txt"
            path.write_text(prompt.rstrip() + "\n", encoding="utf-8")
            generated += 1
    print(f"generated={generated} output={output_dir}")


if __name__ == "__main__":
    main()
