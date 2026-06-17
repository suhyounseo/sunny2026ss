#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Highheel supplier image analysis pipeline.

This pipeline does not reuse or copy supplier/competitor images as final assets.
It scans the images only as source evidence, extracts conservative metadata,
and creates NICE-ready product copy plus AI image generation prompts that require
a different model, different pose, and different background from the originals.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import re
import shutil
import statistics
import zipfile
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image, ImageDraw, ImageFont, ImageOps
except Exception:  # pragma: no cover - pipeline still works without previews/color probing.
    Image = None
    ImageDraw = None
    ImageFont = None
    ImageOps = None


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}

STYLE_NAME_SEEDS = [
    "세린", "로아", "엘린", "뮤즈", "아린", "리엘", "모아", "셀린", "유나", "라비",
    "하린", "이브", "미엘", "로제", "나린", "소이", "리아", "벨라", "아델", "루나",
    "제인", "마렌", "에일린", "시엘", "다온", "루아", "헤라", "리나", "메이", "라헬",
]

BRAND_RISK_TOKENS = [
    "구찌", "샤넬", "생로랑", "발렌티노", "로에베", "르메르", "미우", "팬디", "펜디",
    "트리오페", "켄달", "제니", "효민",
]

CSV_FIELDS = [
    "product_id",
    "source_folder",
    "source_files",
    "source_file_count",
    "original_name",
    "suggested_product_name_ko",
    "category",
    "sub_category",
    "color",
    "fit",
    "length",
    "neckline",
    "sleeve",
    "material_guess",
    "detail_points",
    "mood_keywords",
    "recommended_use",
    "target_customer",
    "one_line_copy",
    "short_description",
    "selling_points",
    "styling_keywords",
    "prompt_main",
    "prompt_fullbody",
    "prompt_back",
    "prompt_top_closeup",
    "prompt_detail",
    "remarks",
]


@dataclass
class ProductRecord:
    product_id: str
    source_folder: str
    source_files: str
    source_file_count: int
    original_name: str
    suggested_product_name_ko: str
    category: str
    sub_category: str
    color: str
    fit: str
    length: str
    neckline: str
    sleeve: str
    material_guess: str
    detail_points: str
    mood_keywords: str
    recommended_use: str
    target_customer: str
    one_line_copy: str
    short_description: str
    selling_points: str
    styling_keywords: str
    prompt_main: str
    prompt_fullbody: str
    prompt_back: str
    prompt_top_closeup: str
    prompt_detail: str
    remarks: str


def setup_logging(out_dir: Path) -> logging.Logger:
    log_dir = out_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("highheel_pipeline")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    file_handler = logging.FileHandler(log_dir / "pipeline.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger


def safe_extract(zip_path: Path, extract_dir: Path, logger: logging.Logger) -> None:
    logger.info("Extracting zip: %s", zip_path)
    extract_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            target = extract_dir / member.filename
            resolved = target.resolve()
            if not str(resolved).startswith(str(extract_dir.resolve())):
                logger.warning("Skipped suspicious zip member: %s", member.filename)
                continue
            try:
                zf.extract(member, extract_dir)
            except Exception as exc:
                logger.warning("Failed to extract %s: %s", member.filename, exc)
    logger.info("Extraction complete: %s", extract_dir)


def scan_images(root: Path, logger: logging.Logger) -> list[Path]:
    files = [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    logger.info("Scanned image files: %d", len(files))
    return sorted(files, key=lambda p: str(p).lower())


def normalize_group_name(name: str) -> str:
    stem = Path(name).stem
    stem = re.sub(r"\s*\(\d+\)\s*", "", stem)
    stem = re.sub(r"[_-]?\d{1,4}$", "", stem)
    stem = re.sub(r"\d{1,4}$", "", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem or Path(name).stem


def group_images(images: list[Path], extract_dir: Path, logger: logging.Logger) -> dict[str, list[Path]]:
    grouped: dict[str, list[Path]] = defaultdict(list)
    for image_path in images:
        rel_parent = image_path.parent.relative_to(extract_dir)
        if str(rel_parent) in {".", ""}:
            key = normalize_group_name(image_path.name)
        else:
            key = rel_parent.parts[-1]
        grouped[key].append(image_path)

    # Split suspicious mixed root groups by filename prefix when a folder is too broad.
    refined: dict[str, list[Path]] = {}
    for key, files in grouped.items():
        prefixes = defaultdict(list)
        for f in files:
            prefixes[normalize_group_name(f.name)].append(f)
        if key.lower() in {"images", "image", "img", "하이힐"} and len(prefixes) > 1:
            for prefix, prefix_files in prefixes.items():
                refined[prefix] = prefix_files
        else:
            refined[key] = files

    logger.info("Grouped products: %d", len(refined))
    return dict(sorted(refined.items(), key=lambda item: item[0]))


def contains_any(text: str, words: Iterable[str]) -> bool:
    lowered = text.lower()
    return any(word.lower() in lowered for word in words)


def infer_category(name: str) -> tuple[str, str]:
    lowered = name.lower()
    if "롱드레스" in name or "longdress" in lowered:
        return "롱드레스", "롱드레스"
    if "코스튬" in name or "costume" in lowered:
        return "코스튬", "코스튬"
    if "ops" in lowered or "원피스" in name:
        return "원피스", "원피스"
    has_top = "top" in lowered or "탑" in name
    has_bl = "bl" in lowered or "블라우스" in name
    has_sk = "sk" in lowered or "스커트" in name
    if (has_top or has_bl) and has_sk:
        return "투피스", "상하의 세트"
    if has_bl:
        return "블라우스", "블라우스"
    if has_top:
        return "탑", "탑"
    if has_sk:
        return "스커트", "스커트"
    return "기타", "추정"


def infer_details(name: str, category: str) -> dict[str, str]:
    text = name.lower()
    color = []
    color_rules = [
        ("블랙", ["블랙", "black", " bk", " b"]),
        ("화이트/아이보리", ["화이트", "아이보리", "ivory", "white", " w", " i"]),
        ("베이지", ["베이지", "beige"]),
        ("크림", ["크림", "cream"]),
        ("민트", ["민트", "mint"]),
        ("소라", ["소라", "sky", "블루", "blue"]),
        ("핑크", ["핑크", "pink"]),
        ("그레이", ["그레이", "gray", "grey"]),
        ("브라운", ["브라운", "brown"]),
        ("레오파드", ["레오파드", "leopard"]),
        ("체크", ["체크", "check"]),
    ]
    padded = f" {text} "
    for label, keys in color_rules:
        if contains_any(padded, keys):
            color.append(label)
    color_text = ", ".join(dict.fromkeys(color[:2])) if color else "추정"

    detail_points = []
    detail_rules = [
        ("배색", ["배색"]),
        ("셔링", ["셔링"]),
        ("리본", ["리본", "ribbon"]),
        ("레이스", ["레이스", "lace"]),
        ("버튼", ["버튼", "button"]),
        ("트임", ["트임", "슬릿", "slit"]),
        ("러플", ["러플", "ruffle"]),
        ("쥬얼리 장식", ["쥬얼리", "주얼리", "jewel"]),
        ("체크 패턴", ["체크", "check"]),
        ("레오파드 패턴", ["레오파드", "leopard"]),
        ("스카프 포인트", ["스카프"]),
        ("크로스 디테일", ["크로스"]),
        ("절개 라인", ["절개"]),
    ]
    for label, keys in detail_rules:
        if contains_any(text, keys):
            detail_points.append(label)

    material = []
    material_rules = [
        ("새틴", ["새틴", "satin"]),
        ("레이스", ["레이스", "lace"]),
        ("쉬폰", ["쉬폰", "chiffon"]),
        ("니트", ["니트", "knit"]),
        ("트위드", ["트위드", "tweed"]),
        ("코튼", ["코튼", "cotton"]),
        ("폴리", ["폴리", "poly"]),
    ]
    for label, keys in material_rules:
        if contains_any(text, keys):
            material.append(label)

    neckline = "추정"
    if contains_any(text, ["오프", "오프숄더"]):
        neckline = "오프숄더"
    elif contains_any(text, ["홀터"]):
        neckline = "홀터"
    elif contains_any(text, ["카라"]):
        neckline = "카라"
    elif contains_any(text, ["브이", "v넥", "v-neck"]):
        neckline = "브이넥"
    elif contains_any(text, ["스퀘어"]):
        neckline = "스퀘어"
    elif category in {"탑", "블라우스", "원피스"}:
        neckline = "추정"

    sleeve = "추정"
    if contains_any(text, ["민소매", "나시", "슬립", "sleeveless"]):
        sleeve = "민소매"
    elif contains_any(text, ["반팔", "short"]):
        sleeve = "반팔"
    elif contains_any(text, ["7부", "칠부"]):
        sleeve = "7부"
    elif contains_any(text, ["긴팔", "long"]):
        sleeve = "긴팔"
    elif contains_any(text, ["퍼프"]):
        sleeve = "퍼프"
    elif contains_any(text, ["시스루"]):
        sleeve = "시스루"

    length = "추정"
    if contains_any(text, ["미니", "mini"]):
        length = "미니"
    elif contains_any(text, ["미디", "midi"]):
        length = "미디"
    elif contains_any(text, ["롱", "long"]):
        length = "롱"
    elif category in {"롱드레스"}:
        length = "롱"

    fit = "추정"
    if contains_any(text, ["슬림"]):
        fit = "슬림핏"
    elif contains_any(text, ["에이", "a라인", "a-line"]):
        fit = "A라인"
    elif contains_any(text, ["h라인", "h-line"]):
        fit = "H라인"
    elif contains_any(text, ["바디", "body"]):
        fit = "바디핏"
    elif contains_any(text, ["루즈"]):
        fit = "루즈핏"
    elif category in {"스커트", "원피스", "투피스"}:
        fit = "슬림핏"

    if not detail_points and category != "기타":
        detail_points.append("실루엣 중심")

    return {
        "color": color_text,
        "fit": fit,
        "length": length,
        "neckline": neckline,
        "sleeve": sleeve,
        "material_guess": ", ".join(dict.fromkeys(material)) if material else "추정",
        "detail_points": ", ".join(dict.fromkeys(detail_points)) if detail_points else "추정",
    }


def infer_color_from_images(files: list[Path], logger: logging.Logger) -> str:
    if Image is None:
        return "추정"
    color_names = []
    palette = [
        ("블랙", (30, 30, 30)),
        ("화이트/아이보리", (235, 230, 215)),
        ("베이지", (205, 175, 135)),
        ("핑크", (220, 150, 170)),
        ("민트", (165, 195, 180)),
        ("소라", (155, 185, 220)),
        ("그레이", (145, 145, 145)),
        ("브라운", (125, 80, 55)),
        ("레드", (175, 55, 55)),
    ]
    for path in files[:3]:
        try:
            with Image.open(path) as img:
                img = ImageOps.exif_transpose(img).convert("RGB")
                img.thumbnail((80, 80))
                getter = getattr(img, "get_flattened_data", img.getdata)
                pixels = list(getter())
                if not pixels:
                    continue
                # Ignore very bright background and skin-like pixels as much as a simple heuristic can.
                sampled = [
                    p for p in pixels
                    if not (p[0] > 235 and p[1] > 225 and p[2] > 215)
                    and not (p[0] > 170 and p[1] > 115 and p[2] > 90 and p[0] > p[2] + 35)
                ]
                if not sampled:
                    sampled = pixels
                mean = tuple(int(statistics.mean(channel)) for channel in zip(*sampled))
                nearest = min(
                    palette,
                    key=lambda item: sum((mean[i] - item[1][i]) ** 2 for i in range(3)),
                )[0]
                color_names.append(nearest)
        except Exception as exc:
            logger.warning("Image color read failed: %s (%s)", path, exc)
    if not color_names:
        return "추정"
    return ", ".join([name for name, _ in Counter(color_names).most_common(2)])


def clean_name_seed(idx: int, original_name: str, category: str, details: dict[str, str]) -> str:
    name = original_name
    for token in BRAND_RISK_TOKENS:
        name = name.replace(token, "")
    name = re.sub(r"(top|ops|bl|sk)", " ", name, flags=re.IGNORECASE)
    name = re.sub(r"\d+", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    for token in ["블랙", "민트", "베이지", "크림", "화이트", "소라", "아이보리", "그리스", "사틴"]:
        name = name.replace(token, "")
    name = re.sub(r"\s+", " ", name).strip()
    seed = STYLE_NAME_SEEDS[(idx - 1) % len(STYLE_NAME_SEEDS)]
    detail = details["detail_points"].split(", ")[0]
    if detail == "실루엣 중심" or detail == "추정":
        detail = details["fit"] if details["fit"] != "추정" else ""
    category_word = {
        "원피스": "원피스",
        "투피스": "투피스",
        "탑": "탑",
        "블라우스": "블라우스",
        "스커트": "스커트",
        "롱드레스": "롱드레스",
        "코스튬": "코스튬",
    }.get(category, "아이템")
    parts = [seed]
    if details["color"] != "추정":
        display_color = details["color"].split(" (")[0].split(", ")[0].replace("/아이보리", "")
        parts.append(display_color)
    if detail:
        parts.append(detail)
    if details["length"] in {"미니", "미디", "롱"} and category in {"원피스", "스커트", "롱드레스"}:
        parts.append(details["length"])
    parts.append(category_word)
    candidate = " ".join(dict.fromkeys([p for p in parts if p])).strip()
    return candidate or f"{seed} {category_word}"


def make_copy(name: str, category: str, details: dict[str, str]) -> dict[str, str]:
    color = details["color"] if details["color"] != "추정" else "은은한 컬러감"
    detail = details["detail_points"] if details["detail_points"] != "추정" else "깔끔한 실루엣"
    fit = details["fit"] if details["fit"] != "추정" else "자연스러운 핏"
    material = details["material_guess"] if details["material_guess"] != "추정" else "소재감은 이미지 기준 확인 필요"
    use = infer_recommended_use(category, details)
    one_line = f"{color} 무드와 {detail} 포인트가 돋보이는 {name}"
    short = (
        f"{name}은 {fit}으로 여성스러운 라인을 살려주는 {category} 상품입니다. "
        f"{detail} 디테일이 룩에 포인트를 더해주며, {use}에 자연스럽게 어울립니다. "
        f"{material} 기반으로 추정되며 실제 소재는 입고 후 확인을 권장합니다."
    )
    selling = [
        f"{color} 중심의 쇼룸 감성",
        f"{detail} 포인트",
        f"{fit} 실루엣",
        "상세페이지용 AI 촬영컷 제작에 적합",
    ]
    if details["length"] != "추정":
        selling.append(f"{details['length']} 기장")
    styling = ["동대문쇼룸", "여성의류", "글램룩", "데이트룩"]
    if category in {"탑", "블라우스"}:
        styling += ["하이웨스트스커트", "슬랙스코디"]
    elif category in {"스커트"}:
        styling += ["블라우스코디", "힐코디"]
    else:
        styling += ["단독코디", "힐코디"]
    return {
        "recommended_use": use,
        "target_customer": "20대 여성, 쇼룸/촬영용 여성의류 구매 고객",
        "one_line_copy": one_line,
        "short_description": short,
        "selling_points": " | ".join(selling[:5]),
        "styling_keywords": ", ".join(dict.fromkeys(styling)),
    }


def infer_recommended_use(category: str, details: dict[str, str]) -> str:
    details_text = " ".join(details.values())
    uses = []
    if contains_any(details_text, ["레이스", "쥬얼리", "새틴", "셔링", "트임"]):
        uses.extend(["파티룩", "글램룩"])
    if category in {"원피스", "투피스", "롱드레스", "코스튬"}:
        uses.extend(["클럽룩", "BJ룩"])
    if category in {"탑", "블라우스", "스커트"}:
        uses.extend(["데이트룩", "글램룩"])
    if "롱드레스" == category:
        uses.append("무대의상")
    return " / ".join(dict.fromkeys(uses[:4])) if uses else "데이트룩 / 글램룩"


def prompt_base(product_name: str, category: str, details: dict[str, str]) -> str:
    return (
        f"한국 여성 쇼핑몰 상세페이지 스타일의 {product_name} {category} 상품 이미지. "
        "20대 한국 여성 모델, 동대문 쇼룸 느낌, 고급스럽고 자연스러운 조명, 상품 디테일이 잘 보이게. "
        f"상품 특징: 색상 {details['color']}, 핏 {details['fit']}, 기장 {details['length']}, "
        f"네크라인 {details['neckline']}, 소매 {details['sleeve']}, 소재 {details['material_guess']}, "
        f"디테일 {details['detail_points']}. "
        "반드시 원본과 다른 모델, 다른 포즈, 다른 배경으로 생성. "
        "원본 사진의 얼굴, 포즈, 배경, 구도, 워터마크, 경쟁사 스타일을 복제하지 않음. "
        "로고, 텍스트, 워터마크 없음."
    )


def make_prompts(product_name: str, category: str, details: dict[str, str]) -> dict[str, str]:
    base = prompt_base(product_name, category, details)
    return {
        "prompt_main": base + " 메인컷: 전면 3/4 포즈, 상품 실루엣과 첫인상이 잘 보이는 세로 4:5 카탈로그 이미지.",
        "prompt_fullbody": base + " 전신컷: 머리부터 신발까지 보이는 전신 착장, 자연스러운 쇼룸 배경, 코디 균형 강조.",
        "prompt_back": base + " 뒷모습컷: 원본과 다른 포즈로 등판, 허리선, 뒤 실루엣이 보이게 촬영.",
        "prompt_top_closeup": base + " 상반신 클로즈업: 네크라인, 소매, 가슴선, 허리 디테일이 선명하게 보이는 컷.",
        "prompt_detail": base + " 디테일컷: 원단 질감, 레이스/셔링/버튼/트임 등 핵심 디테일을 확대 촬영한 상품 중심 이미지.",
    }


def build_record(idx: int, name: str, files: list[Path], extract_dir: Path, logger: logging.Logger) -> ProductRecord:
    category, sub_category = infer_category(name)
    details = infer_details(name, category)
    if details["color"] == "추정":
        image_color = infer_color_from_images(files, logger)
        if image_color != "추정":
            details["color"] = f"{image_color} (이미지 기반 추정)"

    product_name = clean_name_seed(idx, name, category, details)
    copy = make_copy(product_name, category, details)
    prompts = make_prompts(product_name, category, details)
    uncertain = []
    for key in ["color", "fit", "length", "neckline", "sleeve", "material_guess"]:
        if "추정" in details[key]:
            uncertain.append(key)
    if len(files) <= 1:
        uncertain.append("single_image_group")
    remarks = (
        "원본 이미지는 분석 참고용이며 최종 이미지로 재사용하지 않음. "
        "AI 프롬프트는 원본과 다른 모델/포즈/배경을 필수 조건으로 포함함."
    )
    if uncertain:
        remarks += " 수작업 확인 필요: " + ", ".join(dict.fromkeys(uncertain))

    source_files = [str(p.relative_to(extract_dir)) for p in files]
    return ProductRecord(
        product_id=f"HH-{idx:03d}",
        source_folder=str(files[0].parent.relative_to(extract_dir)),
        source_files=" | ".join(source_files),
        source_file_count=len(files),
        original_name=name,
        suggested_product_name_ko=product_name,
        category=category,
        sub_category=sub_category,
        color=details["color"],
        fit=details["fit"],
        length=details["length"],
        neckline=details["neckline"],
        sleeve=details["sleeve"],
        material_guess=details["material_guess"],
        detail_points=details["detail_points"],
        mood_keywords="고급스러운, 여성스러운, 쇼룸감성, 글램",
        recommended_use=copy["recommended_use"],
        target_customer=copy["target_customer"],
        one_line_copy=copy["one_line_copy"],
        short_description=copy["short_description"],
        selling_points=copy["selling_points"],
        styling_keywords=copy["styling_keywords"],
        prompt_main=prompts["prompt_main"],
        prompt_fullbody=prompts["prompt_fullbody"],
        prompt_back=prompts["prompt_back"],
        prompt_top_closeup=prompts["prompt_top_closeup"],
        prompt_detail=prompts["prompt_detail"],
        remarks=remarks,
    )


def write_outputs(records: list[ProductRecord], out_dir: Path, logger: logging.Logger) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / "products_master.csv"
    json_path = out_dir / "products_master.json"

    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for record in records:
            writer.writerow(asdict(record))

    json_path.write_text(
        json.dumps([asdict(r) for r in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    logger.info("Wrote CSV: %s", csv_path)
    logger.info("Wrote JSON: %s", json_path)


def write_grouped_products(records: list[ProductRecord], out_dir: Path, logger: logging.Logger) -> None:
    grouped_dir = out_dir / "grouped_products"
    grouped_dir.mkdir(parents=True, exist_ok=True)
    for record in records:
        folder = grouped_dir / record.product_id
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "source_index.txt").write_text(
            "원본 이미지는 분석 참고용입니다. 이 폴더에는 원본 이미지를 복사하지 않습니다.\n"
            f"original_name: {record.original_name}\n"
            f"source_folder: {record.source_folder}\n"
            f"source_files:\n{record.source_files.replace(' | ', chr(10))}\n",
            encoding="utf-8",
        )
        (folder / "product.json").write_text(
            json.dumps(asdict(record), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    logger.info("Wrote grouped product indexes: %s", grouped_dir)


def make_contact_sheet(records: list[ProductRecord], extract_dir: Path, out_dir: Path, logger: logging.Logger) -> None:
    if Image is None:
        logger.warning("Pillow unavailable; skipped contact sheet")
        return
    preview_dir = out_dir / "previews"
    preview_dir.mkdir(parents=True, exist_ok=True)
    thumb_w, thumb_h, label_h = 180, 230, 46
    cols = 5
    sample = records[: min(30, len(records))]
    rows = (len(sample) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("malgun.ttf", 13)
    except Exception:
        font = ImageFont.load_default()

    for idx, record in enumerate(sample):
        rel_first = record.source_files.split(" | ")[0]
        path = extract_dir / rel_first
        try:
            image = Image.open(path).convert("RGB")
            image = ImageOps.exif_transpose(image)
            image.thumbnail((thumb_w - 12, thumb_h - 12), Image.LANCZOS)
            x = (idx % cols) * thumb_w + (thumb_w - image.width) // 2
            y = (idx // cols) * (thumb_h + label_h) + 6
            sheet.paste(image, (x, y))
        except Exception as exc:
            logger.warning("Contact sheet image failed: %s (%s)", path, exc)
        label = f"{record.product_id} {record.original_name}"
        if len(label) > 20:
            label = label[:20] + "..."
        tx = (idx % cols) * thumb_w + 8
        ty = (idx // cols) * (thumb_h + label_h) + thumb_h + 2
        draw.text((tx, ty), label, fill=(20, 20, 20), font=font)

    out_path = preview_dir / "sample_contact_sheet.jpg"
    sheet.save(out_path, quality=90)
    logger.info("Wrote contact sheet: %s", out_path)


def write_summary(records: list[ProductRecord], total_images: int, out_dir: Path, logger: logging.Logger) -> None:
    category_counts = Counter(r.category for r in records)
    color_counts = Counter((r.color.split(" (")[0] if r.color else "추정") for r in records)
    uncertain = [r for r in records if "수작업 확인 필요" in r.remarks]
    success_count = len(records) - len([r for r in records if r.source_file_count <= 1])

    lines = [
        "# 하이힐 상품 데이터 자동 정리 요약",
        "",
        f"- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "- 처리 원칙: 원본 이미지는 복제/재사용하지 않고 상품 특징 분석 참고용으로만 사용했습니다.",
        "- AI 프롬프트 공통 원칙: 원본과 다른 모델, 다른 포즈, 다른 배경으로 생성하도록 명시했습니다.",
        "",
        "## 처리 결과",
        "",
        f"1. 총 이미지 수: {total_images}",
        f"2. 총 상품 그룹 수: {len(records)}",
        f"3. 그룹화 성공 수: {success_count}",
        f"4. 불확실 그룹 수: {len(uncertain)}",
        "",
        "## 카테고리 분포",
        "",
        "| 카테고리 | 개수 |",
        "|---|---:|",
    ]
    lines += [f"| {k} | {v} |" for k, v in category_counts.most_common()]
    lines += ["", "## 색상 분포", "", "| 색상 | 개수 |", "|---|---:|"]
    lines += [f"| {k} | {v} |" for k, v in color_counts.most_common()]
    lines += ["", "## 수작업 확인 필요 항목", ""]
    if uncertain:
        for r in uncertain[:50]:
            lines.append(f"- {r.product_id} {r.original_name}: {r.remarks}")
    else:
        lines.append("- 없음")
    lines += [
        "",
        "## 샘플 상품 10개",
        "",
        "| ID | 원본명 | 제안 상품명 | 카테고리 | 색상 | 한 줄 카피 |",
        "|---|---|---|---|---|---|",
    ]
    for r in records[:10]:
        lines.append(
            f"| {r.product_id} | {r.original_name} | {r.suggested_product_name_ko} | "
            f"{r.category} | {r.color} | {r.one_line_copy} |"
        )

    summary_path = out_dir / "summary.md"
    summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    logger.info("Wrote summary: %s", summary_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build NICE-ready highheel product metadata from a zip archive.")
    parser.add_argument("--zip", required=True, help="Path to 하이힐.zip")
    parser.add_argument("--out", required=True, help="Output directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    zip_path = Path(args.zip).expanduser()
    out_dir = Path(args.out).expanduser()
    logger = setup_logging(out_dir)
    logger.info("Pipeline started")
    logger.info("Zip path: %s", zip_path)
    logger.info("Output dir: %s", out_dir)

    if not zip_path.exists():
        logger.error("Zip file not found: %s", zip_path)
        return 2

    extract_dir = out_dir / "_extracted"
    if extract_dir.exists():
        logger.info("Removing previous extraction directory: %s", extract_dir)
        shutil.rmtree(extract_dir)
    safe_extract(zip_path, extract_dir, logger)

    images = scan_images(extract_dir, logger)
    groups = group_images(images, extract_dir, logger)
    records = [
        build_record(idx, name, files, extract_dir, logger)
        for idx, (name, files) in enumerate(groups.items(), start=1)
    ]

    write_outputs(records, out_dir, logger)
    write_grouped_products(records, out_dir, logger)
    make_contact_sheet(records, extract_dir, out_dir, logger)
    write_summary(records, len(images), out_dir, logger)

    logger.info("Pipeline finished successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
