#!/usr/bin/env python3
"""Insert rich multi-image review data into the original HTML template."""

from __future__ import annotations

import argparse
import html
import os
from pathlib import Path

from workflow_lib import WORKFLOW_ROOT, read_json


def esc(value: object) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def image_url(source: str, output_dir: Path, local_images: bool) -> str:
    path = WORKFLOW_ROOT / source
    if not local_images or not source or not path.exists():
        return ""
    return os.path.relpath(path, output_dir).replace("\\", "/")


def gallery(label: str, sources: list[str], output_dir: Path, local_images: bool, note: str = "") -> str:
    images = [image_url(source, output_dir, local_images) for source in sources]
    figures = "".join(f'<img src="{esc(src)}" alt="{esc(label)}" loading="lazy">' for src in images if src)
    if not figures:
        figures = '<div class="empty">이미지 연결 대기</div>'
    note_html = f'<p class="reference-note">{esc(note)}</p>' if note else ""
    return f'<section class="image-group"><h3>{esc(label)} · {len(sources)}장</h3><div class="gallery {"single" if len(sources) <= 1 else ""}">{figures}</div>{note_html}</section>'


def options(values: list[str], selected: str) -> str:
    return "".join(f'<option value="{esc(value)}"{" selected" if value == selected else ""}>{esc(value or "-")}</option>' for value in values)


def card(item: dict, output_dir: Path, local_images: bool) -> str:
    scores = item["scores"]
    checks = "".join(
        f'<label class="check"><span>{label}</span><select name="{field}">{options(["O", "△", "X", ""], scores.get(field, ""))}</select></label>'
        for field, label in (("colorMatch", "컬러"), ("lengthMatch", "기장"), ("detailMatch", "디테일"), ("fabricMatch", "원단"), ("silhouetteMatch", "실루엣"))
    )
    analysis = item["analysis"]
    analysis_fields = "".join(
        f'<label>{esc(label)}<textarea rows="2" data-analysis="{esc(field)}">{esc(", ".join(value) if isinstance(value, list) else value)}</textarea></label>'
        for field, label, value in (
            ("colors", "실제 컬러", f'{analysis["topColor"]} / {analysis["bottomColor"]}'),
            ("length", "기장", f'{analysis["topLength"]} / {analysis["bottomLength"]}'),
            ("silhouette", "실루엣", f'{analysis["topSilhouette"]} / {analysis["bottomSilhouette"]}'),
            ("details", "필수 디테일", analysis["mustPreserve"]),
            ("fabric", "원단", analysis["fabricKeywords"]),
            ("avoid", "금지 요소", analysis["avoidList"]),
        )
    )
    hard = item["evaluation"]
    hard_html = f'<p class="hard-fail">즉시 탈락: {esc(", ".join(hard["hardFailReasons"]))}</p>' if hard["hardFail"] else ""
    return f'''<article class="card" data-id="{esc(item['candidateId'])}">
      <div class="card-head"><div><p class="code">{esc(item['candidateId'])}</p><h2>{esc(item['topName'])} + {esc(item['bottomName'])}</h2><p class="combo">{esc(item['topCode'])} · {esc(item['topColor'])} / {esc(item['bottomCode'])} · {esc(item['bottomColor'])}</p></div><select class="status" name="status">{options(["승인", "조건부 승인", "보류", "재생성", "reference 재선정", "반려", "제외"], item['status'])}</select></div>
      <div class="comparison">{gallery('실제 상의', item['topImages'], output_dir, local_images)}{gallery('실제 하의', item['bottomImages'], output_dir, local_images)}{gallery('생성 모델컷', [item['candidateImage']] if item['candidateImage'] else [], output_dir, local_images)} </div>
      <div class="checks">{checks}</div>{hard_html}
      <div class="decision"><label>검토 메모<textarea rows="3" name="memo">{esc(item['memo'])}</textarea></label><label>재생성 메모<textarea rows="3" name="regenerationMemo">{esc(item['regenerationMemo'])}</textarea></label><label class="approved"><input type="checkbox" name="approved"{' checked' if item['approved'] else ''}> 최종 승인</label></div>
      <details class="analysis"><summary>Step 2 상품 분석 보기·편집</summary><div class="analysis-grid">{analysis_fields}</div><p class="reference-note">분위기 참고 이미지 {len(item['referenceImages'])}장 · 상품 컬러/구조 근거로 사용 금지</p></details>
    </article>'''


def main() -> None:
    parser = argparse.ArgumentParser(description="Build multi-image review board")
    parser.add_argument("--input", type=Path, default=WORKFLOW_ROOT / "data" / "review_items.json")
    parser.add_argument("--output", type=Path, default=WORKFLOW_ROOT / "output" / "review_board" / "index.html")
    parser.add_argument("--no-local-images", action="store_true")
    args = parser.parse_args()
    payload = read_json(args.input)
    template = (WORKFLOW_ROOT / "templates" / "review_board_template.html").read_text(encoding="utf-8")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rendered = template.replace("{{CARDS}}", "\n".join(card(item, args.output.parent, not args.no_local_images) for item in payload["items"]))
    args.output.write_text(rendered, encoding="utf-8")
    print(f"cards={len(payload['items'])} output={args.output}")


if __name__ == "__main__":
    main()
