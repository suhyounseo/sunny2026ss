from __future__ import annotations

import json
from pathlib import Path
from typing import Any

WORKFLOW_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = WORKFLOW_ROOT.parent
SETTINGS_PATH = WORKFLOW_ROOT / "config" / "workflow_settings.json"
RULES_PATH = WORKFLOW_ROOT / "config" / "review_rules.json"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def evaluation(scores: dict[str, str], hard_fail_flags: dict[str, bool] | None = None) -> dict[str, Any]:
    rules = read_json(RULES_PATH)
    pass_count = sum(scores.get(field) == "O" for field in rules["fields"])
    reasons = [field for field, values in rules["hardFailFieldValues"].items() if scores.get(field) in values]
    reasons.extend(flag for flag in rules["hardFailFlags"] if (hard_fail_flags or {}).get(flag))
    hard_fail = bool(reasons)
    if hard_fail:
        recommendation = "반려"
    elif pass_count >= rules["approvalPassCount"]:
        recommendation = "승인"
    elif pass_count >= rules["conditionalPassCount"]:
        recommendation = "조건부 승인"
    else:
        recommendation = "보류"
    return {"passCount": pass_count, "hardFail": hard_fail, "hardFailReasons": reasons, "recommendation": recommendation}
