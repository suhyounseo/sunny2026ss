from __future__ import annotations

import json
from pathlib import Path
from typing import Any


WORKFLOW_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = WORKFLOW_ROOT.parent


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def candidate_map() -> dict[str, dict[str, Any]]:
    items = load_json(WORKFLOW_ROOT / "config" / "candidate_items.json")
    return {item["targetCode"]: item for item in items}


def aliases_for(code: str, match_rules: dict[str, Any]) -> set[str]:
    direct = match_rules.get("aliases", {}).get(code, [])
    aliases = {code, *direct}
    aliases.update(value.removeprefix("TIA-") for value in list(aliases))
    return {value.casefold() for value in aliases}


def find_product(products: list[dict[str, Any]], code: str, match_rules: dict[str, Any]) -> dict[str, Any] | None:
    aliases = aliases_for(code, match_rules)
    for key in ("code", "vendorCode"):
        for product in products:
            value = str(product.get(key, "")).strip().casefold()
            if value in aliases or value.removeprefix("tia-") in aliases:
                return product
    for product in products:
        haystack = " ".join(str(product.get(key, "")) for key in ("name", "tags")).casefold()
        if any(alias in haystack for alias in aliases if len(alias) >= 4):
            return product
    return None


def relative_to_workflow(path: Path) -> str:
    try:
        return path.resolve().relative_to(WORKFLOW_ROOT.resolve()).as_posix()
    except ValueError:
        return path.as_posix()
