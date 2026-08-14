#!/usr/bin/env python3
"""Prepare, review, approve, and stage NICE showroom AI model-cut jobs.

The tool intentionally never publishes a draft.  ``apply`` only writes a
reviewable products JSON candidate after every selected image has first been
approved with the ``approve`` command.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
import zipfile
from copy import deepcopy
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "modelcut-workflow"
CONFIG = WORK / "config" / "aug11_modelcut_candidates.json"
REPORT = WORK / "reports" / "aug11_modelcut_candidate_report.csv"
PRODUCTS = ROOT / "products.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def legacy_zip_name(name: str) -> str:
    """Decode CP949 ZIP names stored without the UTF-8 filename flag."""
    try:
        return name.encode("cp437").decode("cp949")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return name


def product_lookup(products: list[dict], wanted: str) -> dict | None:
    aliases = {wanted, wanted.removeprefix("TIA-")}
    for key in ("code", "vendorCode"):
        for product in products:
            value = str(product.get(key, ""))
            if value in aliases or value.removeprefix("TIA-") in aliases:
                return product
    for product in products:
        haystack = " ".join(str(product.get(k, "")) for k in ("name", "tags"))
        if any(alias in haystack for alias in aliases):
            return product
    return None


def image_paths(product: dict | None, code: str) -> list[Path]:
    values: list[str] = []
    if product:
        for key in ("mainImage", "thumbImage"):
            if isinstance(product.get(key), str):
                values.append(product[key])
        for key in ("images", "cuts"):
            for item in product.get(key, []) or []:
                if isinstance(item, str):
                    values.append(item)
                elif isinstance(item, dict):
                    values.extend(str(item.get(k, "")) for k in ("url", "source"))

    found: list[Path] = []
    for value in values:
        path = ROOT / value.replace("/", str(Path("/")))
        if path.exists() and path.suffix.lower() in IMAGE_EXTS and path not in found:
            found.append(path)

    aliases = {code, code.removeprefix("TIA-")}
    for path in (ROOT / "assets").rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTS and any(a in path.name for a in aliases):
            if path not in found:
                found.append(path)
    return found


def copy_zip_inputs(archive: Path, active_codes: set[str]) -> dict[str, int]:
    counts = {code: 0 for code in active_codes}
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            decoded = legacy_zip_name(info.filename)
            match = re.search(r"S(939|940|941|942|943|944|945|946)", decoded)
            if not match or match.group(0) not in active_codes:
                continue
            code = match.group(0)
            suffix = Path(decoded).suffix.lower()
            if suffix not in IMAGE_EXTS:
                continue
            counts[code] += 1
            out = WORK / "input" / "aug11" / code / f"{code}_{counts[code]:02d}{suffix}"
            out.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as source, out.open("wb") as target:
                shutil.copyfileobj(source, target)
    return counts


def copy_showroom_refs(products: list[dict], ref_codes: set[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for code in sorted(ref_codes):
        paths = image_paths(product_lookup(products, code), code)
        out_dir = WORK / "refs" / "showroom" / code
        out_dir.mkdir(parents=True, exist_ok=True)
        for index, source in enumerate(paths, 1):
            shutil.copy2(source, out_dir / f"{code}_{index:02d}{source.suffix.lower()}")
        counts[code] = len(paths)
    return counts


def prompt_for(candidate: dict) -> str:
    match = candidate["matchCandidates"][0]
    return f"""Use case: identity-preserve
Asset type: NICE 쇼룸 검토용 전신 모델 메인컷 초안
Primary request: 제공된 제품컷/마네킹컷의 의상 형태를 정확히 보존하여 새 모델 착용컷을 만든다.
Input images: {candidate['targetCode']} 폴더 = 상의의 정확한 제품 기준; {match['matchCode']} 폴더 = 하의의 정확한 제품 기준
Scene/backdrop: 깨끗한 화이트·아이보리 부티크 인테리어, 은은한 깊이감, 읽을 수 있는 간판 없음
Subject: 성인 슬림 동아시아 패션 모델, 긴 검정 머리, 자연스러운 메이크업, 우아하고 차분한 표정
Style/medium: 사실적인 프리미엄 한국 온라인 쇼룸 카탈로그 사진
Composition/framing: 세로 4:5, 정면에 가까운 자연스러운 3/4 포즈, 머리부터 신발까지 전신이 모두 보임
Lighting/mood: 부드러운 자연광 느낌의 확산 조명, 정확한 피부색과 원단 질감
Outfit top: {candidate['promptTop']}
Outfit bottom: {match['promptBottom']}
Constraints: 원본 의상의 색상·실루엣·프린트·스트랩·단추·프릴·봉제 디테일을 최대한 유지; 상의와 하의 모두 판매 가능한 현실적 핏; 제품정보 이미지의 문자나 표를 포함하지 않음; 승인 전 쇼룸에 반영하지 않음
Avoid: 임의의 프린트나 색상 추가, 로고, 글자, 워터마크, 휴대폰, 거울 셀카, 다른 사람, 과도한 보정, 비정상 손가락·발·얼굴·신체 비율"""


def make_board(candidate: dict) -> None:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return

    match = candidate["matchCandidates"][0]
    groups = [
        (candidate["targetCode"], WORK / "input" / "aug11" / candidate["targetCode"]),
        (match["matchCode"], WORK / "refs" / "showroom" / match["matchCode"]),
    ]
    cells: list[tuple[str, Image.Image]] = []
    for label, folder in groups:
        # Include every available product/detail view (up to 12) so color,
        # length, back construction, and small trims can be checked together.
        for path in sorted(folder.glob("*"))[:12]:
            if path.suffix.lower() not in IMAGE_EXTS:
                continue
            with Image.open(path) as source:
                image = source.convert("RGB")
                image.thumbnail((300, 360))
                canvas = Image.new("RGB", (320, 410), "white")
                canvas.paste(image, ((320 - image.width) // 2, 34 + (360 - image.height) // 2))
                ImageDraw.Draw(canvas).text((12, 10), f"{label} · {path.name}", fill="#1b1b1b")
                cells.append((label, canvas))
    if not cells:
        return
    cols = 3
    rows = (len(cells) + cols - 1) // cols
    board = Image.new("RGB", (cols * 320, rows * 410), "#ece8e2")
    for index, (_, cell) in enumerate(cells):
        board.paste(cell, ((index % cols) * 320, (index // cols) * 410))
    out = WORK / "reports" / "reference-boards" / f"{candidate['targetCode']}_{match['matchCode']}_references.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    board.save(out, quality=90)


def write_outputs(config: list[dict]) -> None:
    fields = ["targetCode", "targetName", "targetType", "targetColor", "matchCode", "matchName", "matchType", "matchColor", "priority", "draftImage", "approved", "memo"]
    rows = []
    jobs = []
    for candidate in config:
        if candidate.get("exclude"):
            continue
        prompt = prompt_for(candidate) if candidate.get("generateNow") else ""
        if prompt:
            prompt_path = WORK / "prompts" / f"{candidate['targetCode']}_{candidate['matchCandidates'][0]['matchCode']}.txt"
            prompt_path.parent.mkdir(parents=True, exist_ok=True)
            prompt_path.write_text(prompt + "\n", encoding="utf-8")
            make_board(candidate)
        for match in candidate.get("matchCandidates", []):
            draft = f"{candidate['targetCode']}_{match['matchCode']}_model_draft_01.png" if match.get("priority") == 1 and candidate.get("generateNow") else ""
            rows.append({
                "targetCode": candidate["targetCode"], "targetName": candidate["targetName"], "targetType": candidate["targetType"],
                "targetColor": " / ".join(candidate["colorOptions"]), "matchCode": match["matchCode"], "matchName": match["matchName"],
                "matchType": match["matchType"], "matchColor": match["matchColor"], "priority": match["priority"],
                "draftImage": draft, "approved": "false", "memo": match.get("note", ""),
            })
        if prompt:
            jobs.append({
                "targetCode": candidate["targetCode"], "matchCode": candidate["matchCandidates"][0]["matchCode"],
                "status": "ready_for_generation", "output": f"output/drafts/{candidate['targetCode']}_{candidate['matchCandidates'][0]['matchCode']}_model_draft_01.png",
                "promptFile": f"prompts/{candidate['targetCode']}_{candidate['matchCandidates'][0]['matchCode']}.txt",
                "referenceBoard": f"reports/reference-boards/{candidate['targetCode']}_{candidate['matchCandidates'][0]['matchCode']}_references.jpg",
            })
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    with REPORT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)
    write_json(WORK / "config" / "generation_jobs.json", jobs)


def prepare(args) -> None:
    config = read_json(CONFIG)
    active_codes = {c["targetCode"] for c in config if not c.get("exclude")}
    products = read_json(PRODUCTS)
    refs = {m["matchCode"] for c in config for m in c.get("matchCandidates", [])}
    input_counts = copy_zip_inputs(Path(args.archive), active_codes)
    ref_counts = copy_showroom_refs(products, refs)
    for folder in (WORK / "output" / "drafts", WORK / "output" / "approved"):
        folder.mkdir(parents=True, exist_ok=True)
    write_outputs(config)
    write_json(WORK / "reports" / "prepare_summary.json", {"preparedAt": datetime.now().isoformat(timespec="seconds"), "inputs": input_counts, "showroomRefs": ref_counts})
    print(json.dumps({"inputs": input_counts, "showroomRefs": ref_counts}, ensure_ascii=False, indent=2))


def approve(args) -> None:
    source = Path(args.image).resolve()
    if WORK.resolve() not in source.parents or source.parent != (WORK / "output" / "drafts").resolve():
        raise SystemExit("승인 이미지는 modelcut-workflow/output/drafts 안에 있어야 합니다.")
    if not source.exists():
        raise SystemExit(f"초안 파일이 없습니다: {source}")
    match = re.fullmatch(r"(S\d+)_(.+)_model_draft_\d+\.png", source.name)
    if not match:
        raise SystemExit("초안 파일명 규칙이 올바르지 않습니다.")
    target, match_code = match.groups()
    approved = WORK / "output" / "approved" / f"{target}_{match_code}_model_main_approved.png"
    approved.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, approved)
    rows = list(csv.DictReader(REPORT.open(encoding="utf-8-sig")))
    for row in rows:
        if row["targetCode"] == target and row["matchCode"] == match_code:
            row["approved"] = "true"; row["memo"] = args.memo or "사장님 승인"
    with REPORT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
    print(approved)


def stage_apply(args) -> None:
    if args.confirm != "APPROVED_ONLY":
        raise SystemExit("--confirm APPROVED_ONLY가 필요합니다.")
    products = read_json(PRODUCTS)
    rows = list(csv.DictReader(REPORT.open(encoding="utf-8-sig")))
    applied = []
    for row in rows:
        if row["approved"].lower() != "true":
            continue
        product = product_lookup(products, row["targetCode"])
        if not product:
            continue
        filename = f"{row['targetCode']}_{row['matchCode']}_model_main_approved.png"
        source = WORK / "output" / "approved" / filename
        if not source.exists():
            continue
        asset = ROOT / "assets" / "modelcuts" / "aug11" / filename
        asset.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(source, asset)
        url = f"assets/modelcuts/aug11/{filename}"
        product["modelCutStatus"] = "approved"
        cuts = product.setdefault("cuts", [])
        if not any(isinstance(c, dict) and c.get("url") == url for c in cuts):
            cuts.insert(0, {"url": url, "cut": "모델 착용컷", "source": "AI model cut approved"})
        applied.append(row["targetCode"])
    out = WORK / "output" / "products.approved-preview.json"
    write_json(out, products)
    write_json(WORK / "reports" / "apply_preview_summary.json", {"products": applied, "previewOnly": True, "output": str(out.relative_to(ROOT))})
    print(out)


def sync_review(args) -> None:
    """Synchronize generated draft state and build a single review board."""
    jobs_path = WORK / "config" / "generation_jobs.json"
    jobs = read_json(jobs_path)
    candidate_path = WORK / "config" / "approval_candidates.json"
    candidates = read_json(candidate_path) if candidate_path.exists() else []
    selected_by_target = {item["targetCode"]: item["candidate"] for item in candidates}
    draft_paths: list[Path] = []
    for job in jobs:
        draft = WORK / job["output"]
        job["status"] = "draft_ready" if draft.exists() else "ready_for_generation"
        if draft.exists():
            job["bytes"] = draft.stat().st_size
            draft_paths.append(draft)
        if job["targetCode"] in selected_by_target:
            selected = WORK / selected_by_target[job["targetCode"]]
            job["selectedCandidate"] = selected_by_target[job["targetCode"]]
            job["status"] = "approval_candidate" if selected.exists() else job["status"]
    write_json(jobs_path, jobs)

    try:
        from PIL import Image, ImageDraw, ImageFont, ImageOps
    except ImportError:
        print(jobs_path)
        return
    if candidates:
        draft_paths = [WORK / item["candidate"] for item in candidates if (WORK / item["candidate"]).exists()]
    if not draft_paths:
        print("생성된 초안이 없습니다.")
        return
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 18)
        small_font = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 15)
        bold_font = ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf", 21)
    except OSError:
        font = small_font = bold_font = ImageFont.load_default()
    cell_w, cell_h = 390, 610
    board = Image.new("RGB", (cell_w * len(draft_paths), cell_h), "#eee9e2")
    draw = ImageDraw.Draw(board)
    for index, path in enumerate(draft_paths):
        with Image.open(path) as source:
            image = source.convert("RGB")
            image.thumbnail((350, 455))
            x = index * cell_w + (cell_w - image.width) // 2
            y = 44 + (455 - image.height) // 2
            board.paste(image, (x, y))
        item = candidates[index] if candidates else {}
        label = item.get("targetCode", path.stem)
        draw.text((index * cell_w + 16, 12), f"{label}  {item.get('color', '')}", font=bold_font, fill="#1c1a18")
        lines = [
            f"실제 컬러 일치  {item.get('colorMatch', '-')}",
            f"기장 일치       {item.get('lengthMatch', '-')}",
            f"디테일 일치     {item.get('detailMatch', '-')}",
            f"승인 여부       {item.get('approval', '미검토')}",
        ]
        for line_index, line in enumerate(lines):
            draw.text((index * cell_w + 18, 505 + line_index * 24), line, font=small_font, fill="#292623")
    out = WORK / "reports" / "aug11_approval_candidate_review.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    board.save(out, quality=92)

    comparison_dir = WORK / "reports" / "comparisons"
    comparison_dir.mkdir(parents=True, exist_ok=True)
    for item in candidates:
        paths = [WORK / item["topReference"], WORK / item["bottomReference"], WORK / item["candidate"]]
        labels = [f"실제 상의 · {item['topCode']}", f"실제 하의 · {item['bottomCode']}", f"승인 후보 · {item['targetCode']}"]
        canvas = Image.new("RGB", (1200, 650), "#f1ede7")
        cdraw = ImageDraw.Draw(canvas)
        for idx, (source_path, label) in enumerate(zip(paths, labels)):
            with Image.open(source_path) as source:
                source = ImageOps.exif_transpose(source).convert("RGB")
                source.thumbnail((360, 540))
                x = idx * 400 + (400 - source.width) // 2
                y = 62 + (540 - source.height) // 2
                canvas.paste(source, (x, y))
            cdraw.text((idx * 400 + 20, 20), label, font=bold_font, fill="#1c1a18")
        cdraw.text((24, 618), f"컬러 {item['colorMatch']}  |  기장 {item['lengthMatch']}  |  디테일 {item['detailMatch']}  |  {item['approval']}", font=font, fill="#1c1a18")
        canvas.save(comparison_dir / f"{item['targetCode']}_actual_vs_candidate.jpg", quality=92)

    report_fields = ["productCode", "topCode", "bottomCode", "color", "actualColorMatch", "lengthMatch", "detailMatch", "finalStatus", "approvalCandidate", "revisionNeeded", "excluded", "candidateImage", "memo"]
    with (WORK / "reports" / "aug11_approval_candidate_report.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=report_fields)
        writer.writeheader()
        for item in candidates:
            writer.writerow({
                "productCode": item["targetCode"], "topCode": item["topCode"], "bottomCode": item["bottomCode"],
                "color": item["color"], "actualColorMatch": item["colorMatch"], "lengthMatch": item["lengthMatch"],
                "detailMatch": item["detailMatch"], "finalStatus": item["approval"], "approvalCandidate": "true",
                "revisionNeeded": "false", "excluded": "false", "candidateImage": item["candidate"], "memo": item["memo"],
            })
        writer.writerow({"productCode": "S944", "finalStatus": "제외", "approvalCandidate": "false", "revisionNeeded": "false", "excluded": "true", "memo": "작업지시서에 따라 제외"})
    print(out)


def main() -> None:
    parser = argparse.ArgumentParser(description="NICE 쇼룸 모델컷 워크플로")
    sub = parser.add_subparsers(dest="command", required=True)
    prep = sub.add_parser("prepare", help="ZIP 입력과 쇼룸 참조 이미지를 정리")
    prep.add_argument("--archive", required=True); prep.set_defaults(func=prepare)
    approve_parser = sub.add_parser("approve", help="검토 완료 초안을 승인 폴더로 복사")
    approve_parser.add_argument("--image", required=True); approve_parser.add_argument("--memo", default=""); approve_parser.set_defaults(func=approve)
    apply_parser = sub.add_parser("apply", help="승인된 컷만 반영한 products 미리보기를 생성")
    apply_parser.add_argument("--confirm", required=True); apply_parser.set_defaults(func=stage_apply)
    review_parser = sub.add_parser("review", help="초안 상태를 동기화하고 검토 보드를 생성")
    review_parser.set_defaults(func=sync_review)
    args = parser.parse_args(); args.func(args)


if __name__ == "__main__":
    main()
