#!/usr/bin/env python3
"""Build a portable HTML review board with placeholder-first image panels."""

from __future__ import annotations

import argparse
import csv
import html
import os
from pathlib import Path

from workflow_common import WORKFLOW_ROOT, candidate_map


def image_panel(label: str, path: str, use_local_images: bool) -> str:
    safe_label = html.escape(label)
    if use_local_images and path and (WORKFLOW_ROOT / path).exists():
        board_dir = WORKFLOW_ROOT / "output" / "review_board"
        relative = os.path.relpath(WORKFLOW_ROOT / path, board_dir).replace("\\", "/")
        return f'<figure><img src="{html.escape(relative)}" alt="{safe_label}"><figcaption>{safe_label}</figcaption></figure>'
    return f'<figure class="placeholder"><div>{safe_label}<small>{html.escape(path or "연결 대기")}</small></div><figcaption>{safe_label}</figcaption></figure>'


def main() -> None:
    parser = argparse.ArgumentParser(description="Build HTML model-cut review board")
    parser.add_argument("--report", default=str(WORKFLOW_ROOT / "reports" / "csv" / "modelcut_quality_review.csv"))
    parser.add_argument("--output", default=str(WORKFLOW_ROOT / "output" / "review_board" / "index.html"))
    parser.add_argument("--use-local-images", action="store_true", help="Link ignored local images when they exist")
    args = parser.parse_args()

    rows = list(csv.DictReader(Path(args.report).open(encoding="utf-8-sig")))
    candidates = candidate_map()
    cards = []
    for row in rows:
        item = candidates[row["targetCode"]]
        match = next((match for match in item.get("matchCandidates", []) if match["matchCode"] == row["bottomCode"]), None)
        item_reference = (item.get("referenceImages") or [""])[0]
        match_reference = ((match or {}).get("referenceImages") or [""])[0]
        if item.get("targetType") == "SKIRT":
            top_reference = ""
            bottom_reference = item_reference
        else:
            top_reference = item_reference
            bottom_reference = match_reference
        color_text = " / ".join(value for value in (row["topColor"], row["bottomColor"]) if value)
        checks = "".join(f'<li><span>{html.escape(label)}</span><b>{html.escape(row[field])}</b></li>' for field, label in (("colorMatch", "컬러"), ("lengthMatch", "기장"), ("detailMatch", "디테일"), ("fabricMatch", "원단"), ("fitMatch", "핏")))
        cards.append(f'''<article class="card">
          <header><div><p>{html.escape(row['targetCode'])}</p><h2>{html.escape(row['targetName'])}</h2></div><span class="status">{html.escape(row['status'])}</span></header>
          <p class="combo">{html.escape(' + '.join(v for v in (row['topCode'], row['bottomCode']) if v))} · {html.escape(color_text)}</p>
          <div class="images">{image_panel('실제 상의', top_reference, args.use_local_images)}{image_panel('실제 하의', bottom_reference, args.use_local_images)}{image_panel('생성 모델컷', row['draftImagePath'], args.use_local_images)}</div>
          <div class="review"><ul>{checks}</ul><div class="score"><span>현실감</span><strong>{html.escape(row['realityScore'] or '-')}<small>/5</small></strong></div></div>
          <p class="memo">{html.escape(row['memo'])}</p>
        </article>''')

    template = (WORKFLOW_ROOT / "templates" / "review_board_template.html").read_text(encoding="utf-8")
    output = Path(args.output); output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(template.replace("{{CARDS}}", "\n".join(cards)), encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
