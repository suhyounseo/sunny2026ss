#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Match highheel source-reference products to competitor products by image similarity.

Policy:
- Source and competitor images are used only for analysis/fingerprinting.
- Competitor images are not copied into output folders.
- Outputs store URLs, prices, similarity scores, and review status only.
"""

from __future__ import annotations

import argparse
import csv
import html
import io
import json
import re
import ssl
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

from PIL import Image, ImageOps, UnidentifiedImageError


COMPETITOR_SITES = [
    {"site_key": "judyshop", "site_name": "쥬디샵", "url": "https://www.judyshop.co.kr/"},
    {"site_key": "ongirl", "site_name": "온걸", "url": "https://ongirl.co.kr/"},
    {"site_key": "bbprincess", "site_name": "비비공주", "url": "https://www.bbprincess.com/"},
    {"site_key": "tomissmall", "site_name": "투미쓰몰", "url": "https://www.tomissmall.com/"},
    {"site_key": "tnani", "site_name": "티나니", "url": "https://www.t-nani.co.kr/"},
    {"site_key": "kjoli", "site_name": "깜장오리", "url": "https://kjoli.com/"},
    {"site_key": "danbe", "site_name": "단비", "url": "https://www.danbe.co.kr/"},
    {"site_key": "jungmadam", "site_name": "정마담", "url": "https://www.jungmadam.co.kr/"},
    {"site_key": "hidiva", "site_name": "하이디바", "url": "https://hi-diva.com/"},
    {"site_key": "cocoshop", "site_name": "코코몰", "url": "https://www.thecocoshop.co.kr/"},
]

MATCH_FIELDS = [
    "product_id",
    "original_name",
    "suggested_product_name_ko",
    "category",
    "source_reference_image",
    "match_rank",
    "site_key",
    "site_name",
    "competitor_product_name",
    "competitor_price_krw",
    "competitor_product_url",
    "competitor_image_url",
    "similarity_score",
    "image_hash_distance",
    "color_distance",
    "match_status",
    "source_usage_policy",
    "remarks",
]

PRICE_RE = re.compile(r"([0-9]{2,3}(?:,[0-9]{3})+|[0-9]{5,6})\s*원?")
SOURCE_USAGE_POLICY = "source and competitor images are reference only; do not upload or reuse original images."


@dataclass
class ProductImageRef:
    product_id: str
    original_name: str
    suggested_product_name_ko: str
    category: str
    source_image: Path
    dhash: int
    color: tuple[float, float, float]


@dataclass
class CompetitorCandidate:
    site_key: str
    site_name: str
    product_name: str
    price_krw: int | None
    product_url: str
    image_url: str
    source_page: str
    dhash: int
    color: tuple[float, float, float]


class ProductCardParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.cards: list[dict[str, str]] = []
        self._link_stack: list[str] = []
        self._current_link: str = ""
        self._current_img: str = ""
        self._current_alt: str = ""
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {k.lower(): v or "" for k, v in attrs}
        if tag.lower() == "a":
            href = attrs_dict.get("href", "")
            self._link_stack.append(urljoin(self.base_url, href) if href else "")
            self._current_link = self._link_stack[-1]
            self._text = []
        elif tag.lower() == "img":
            src = attrs_dict.get("src") or attrs_dict.get("data-src") or attrs_dict.get("ec-data-src") or ""
            alt = attrs_dict.get("alt") or attrs_dict.get("title") or ""
            if src:
                self._current_img = urljoin(self.base_url, src)
                self._current_alt = normalize_text(alt)

    def handle_data(self, data: str) -> None:
        if self._link_stack:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._link_stack:
            text = normalize_text(" ".join(self._text))
            if self._current_img:
                self.cards.append(
                    {
                        "product_url": self._current_link,
                        "image_url": self._current_img,
                        "name": self._current_alt or text,
                        "text": text,
                    }
                )
            self._link_stack.pop()
            if not self._link_stack:
                self._current_link = ""
                self._current_img = ""
                self._current_alt = ""
                self._text = []


def normalize_text(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def price_to_int(value: str) -> int | None:
    digits = re.sub(r"[^0-9]", "", value)
    if not digits:
        return None
    price = int(digits)
    return price if 1000 <= price <= 1000000 else None


def fetch_bytes(url: str, timeout: int = 15) -> bytes:
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; HighheelImageMatcher/1.0)",
            "Accept": "text/html,image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*",
        },
    )
    context = ssl.create_default_context()
    with urlopen(req, timeout=timeout, context=context) as response:
        return response.read()


def fetch_text(url: str, timeout: int = 15) -> str:
    data = fetch_bytes(url, timeout=timeout)
    for charset in ("utf-8", "cp949", "euc-kr"):
        try:
            return data.decode(charset)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def image_features_from_bytes(data: bytes) -> tuple[int, tuple[float, float, float]]:
    with Image.open(io.BytesIO(data)) as image:
        if image.width < 180 or image.height < 180:
            raise ValueError("image too small for product matching")
        return image_features(image)


def image_features_from_path(path: Path) -> tuple[int, tuple[float, float, float]]:
    with Image.open(path) as image:
        return image_features(image)


def image_features(image: Image.Image) -> tuple[int, tuple[float, float, float]]:
    image = ImageOps.exif_transpose(image).convert("RGB")
    small = ImageOps.grayscale(image.resize((9, 8), Image.Resampling.LANCZOS))
    getter = getattr(small, "get_flattened_data", small.getdata)
    pixels = list(getter())
    bits = []
    for row in range(8):
        offset = row * 9
        for col in range(8):
            bits.append(1 if pixels[offset + col] > pixels[offset + col + 1] else 0)
    dhash = 0
    for bit in bits:
        dhash = (dhash << 1) | bit

    color_image = image.resize((32, 32), Image.Resampling.LANCZOS)
    color_getter = getattr(color_image, "get_flattened_data", color_image.getdata)
    color_pixels = list(color_getter())
    filtered = [
        p for p in color_pixels
        if not (p[0] > 235 and p[1] > 225 and p[2] > 215)
        and not (p[0] > 170 and p[1] > 115 and p[2] > 90 and p[0] > p[2] + 35)
    ]
    if not filtered:
        filtered = color_pixels
    avg = tuple(sum(p[i] for p in filtered) / len(filtered) for i in range(3))
    return dhash, avg


def hamming(a: int, b: int) -> int:
    return (a ^ b).bit_count()


def color_distance(a: tuple[float, float, float], b: tuple[float, float, float]) -> float:
    return sum((a[i] - b[i]) ** 2 for i in range(3)) ** 0.5


def similarity(source: ProductImageRef, candidate: CompetitorCandidate) -> tuple[float, int, float]:
    hash_dist = hamming(source.dhash, candidate.dhash)
    color_dist = color_distance(source.color, candidate.color)
    hash_score = max(0.0, 1.0 - hash_dist / 64.0)
    color_score = max(0.0, 1.0 - color_dist / 260.0)
    score = round((hash_score * 0.75 + color_score * 0.25) * 100, 2)
    return score, hash_dist, round(color_dist, 2)


def keyword_variants(original_name: str) -> list[str]:
    base = re.sub(r"\d+", " ", original_name)
    base = re.sub(r"\b(top|ops|bl|sk)\b", " ", base, flags=re.IGNORECASE)
    base = re.sub(r"\s+", " ", base).strip()
    tokens = [t for t in re.split(r"\s+", base) if len(t) >= 2]
    variants = [original_name, base]
    variants.extend(tokens[:2])
    cleaned = []
    for value in variants:
        value = value.strip()
        if value and value not in cleaned:
            cleaned.append(value)
    return cleaned[:3]


def search_urls(site: dict[str, str], keyword: str) -> list[str]:
    q = quote(keyword)
    base = site["url"]
    return [
        urljoin(base, f"/product/search.html?keyword={q}"),
        urljoin(base, f"/shop/shopbrand.html?search={q}"),
        urljoin(base, f"/shop/shopbrand.html?search.x=0&search.y=0&search={q}"),
        urljoin(base, f"/search?q={q}"),
    ]


def extract_candidates(site: dict[str, str], page_url: str, body: str) -> list[dict[str, str | int | None]]:
    parser = ProductCardParser(page_url)
    try:
        parser.feed(body)
    except Exception:
        pass
    full_text = normalize_text(body)
    candidates = []
    for card in parser.cards:
        name = normalize_text(card.get("name", "") or card.get("text", ""))
        if not name or len(name) < 2:
            continue
        lowered_name = name.lower()
        image_url = str(card.get("image_url", ""))
        lowered_image = image_url.lower()
        noise_words = [
            "검색", "search", "instagram", "관심상품", "장바구니", "basket", "cart",
            "kakao", "naver", "logo", "open", "닫기", "close",
        ]
        noise_path = [
            "/icon", "icon_", "/btn", "btn_", "logo", "banner", "instagram",
            "facebook", "kakao", "search", "basket", "cart", "common/",
        ]
        if any(word in lowered_name for word in noise_words):
            continue
        if any(part in lowered_image for part in noise_path):
            continue
        # Try nearby text first, then whole page fallback.
        price = None
        text = normalize_text(card.get("text", ""))
        price_match = PRICE_RE.search(text)
        if price_match:
            price = price_to_int(price_match.group(1))
        if price is None:
            name_pos = full_text.find(name[:20])
            if name_pos >= 0:
                nearby = full_text[name_pos:name_pos + 500]
                price_match = PRICE_RE.search(nearby)
                if price_match:
                    price = price_to_int(price_match.group(1))
        candidates.append(
            {
                "site_key": site["site_key"],
                "site_name": site["site_name"],
                "product_name": name,
                "price_krw": price,
                "product_url": str(card.get("product_url", "")),
                "image_url": str(card.get("image_url", "")),
                "source_page": page_url,
            }
        )
    dedup: dict[str, dict[str, str | int | None]] = {}
    for candidate in candidates:
        image_url = str(candidate["image_url"])
        if image_url:
            dedup[image_url] = candidate
    return list(dedup.values())


def read_products(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        return json.loads(path.read_text(encoding="utf-8"))
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def first_source_image(product: dict[str, Any], source_root: Path) -> Path | None:
    source_files = str(product.get("source_files", "")).split(" | ")
    for rel in source_files:
        path = source_root / rel
        if path.exists():
            return path
    return None


def build_source_refs(products: list[dict[str, Any]], source_root: Path) -> list[ProductImageRef]:
    refs = []
    for product in products:
        path = first_source_image(product, source_root)
        if not path:
            continue
        try:
            dhash, color = image_features_from_path(path)
        except (OSError, UnidentifiedImageError):
            continue
        refs.append(
            ProductImageRef(
                product_id=product.get("product_id", ""),
                original_name=product.get("original_name", ""),
                suggested_product_name_ko=product.get("suggested_product_name_ko", ""),
                category=product.get("category", ""),
                source_image=path,
                dhash=dhash,
                color=color,
            )
        )
    return refs


def collect_candidates_for_product(
    product: ProductImageRef,
    max_sites: int,
    max_candidates_per_site: int,
    delay: float,
) -> list[CompetitorCandidate]:
    candidates: list[CompetitorCandidate] = []
    for site in COMPETITOR_SITES[:max_sites]:
        seen_images: set[str] = set()
        for keyword in keyword_variants(product.original_name):
            for url in search_urls(site, keyword):
                try:
                    body = fetch_text(url)
                    raw_candidates = extract_candidates(site, url, body)
                except Exception:
                    continue
                for raw in raw_candidates:
                    image_url = str(raw["image_url"])
                    if not image_url or image_url in seen_images:
                        continue
                    seen_images.add(image_url)
                    try:
                        data = fetch_bytes(image_url, timeout=12)
                        dhash, color = image_features_from_bytes(data)
                    except Exception:
                        continue
                    candidates.append(
                        CompetitorCandidate(
                            site_key=str(raw["site_key"]),
                            site_name=str(raw["site_name"]),
                            product_name=str(raw["product_name"]),
                            price_krw=raw["price_krw"] if isinstance(raw["price_krw"], int) else None,
                            product_url=str(raw["product_url"]),
                            image_url=image_url,
                            source_page=str(raw["source_page"]),
                            dhash=dhash,
                            color=color,
                        )
                    )
                    if len([c for c in candidates if c.site_key == site["site_key"]]) >= max_candidates_per_site:
                        break
                if len([c for c in candidates if c.site_key == site["site_key"]]) >= max_candidates_per_site:
                    break
                time.sleep(delay)
            time.sleep(delay)
    return candidates


def match_products(
    products: list[ProductImageRef],
    max_sites: int,
    max_candidates_per_site: int,
    top_n: int,
    delay: float,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for product in products:
        candidates = collect_candidates_for_product(product, max_sites, max_candidates_per_site, delay)
        scored = []
        for candidate in candidates:
            score, hash_dist, cdist = similarity(product, candidate)
            scored.append((score, hash_dist, cdist, candidate))
        scored.sort(key=lambda item: item[0], reverse=True)
        if not scored:
            rows.append(
                {
                    "product_id": product.product_id,
                    "original_name": product.original_name,
                    "suggested_product_name_ko": product.suggested_product_name_ko,
                    "category": product.category,
                    "source_reference_image": str(product.source_image),
                    "match_rank": "",
                    "site_key": "",
                    "site_name": "",
                    "competitor_product_name": "",
                    "competitor_price_krw": "",
                    "competitor_product_url": "",
                    "competitor_image_url": "",
                    "similarity_score": "",
                    "image_hash_distance": "",
                    "color_distance": "",
                    "match_status": "no_candidate",
                    "source_usage_policy": SOURCE_USAGE_POLICY,
                    "remarks": "검색 결과 또는 이미지 후보를 찾지 못함. 수작업 확인 필요.",
                }
            )
            continue
        for rank, (score, hash_dist, cdist, candidate) in enumerate(scored[:top_n], start=1):
            status = "review"
            if score >= 82 and hash_dist <= 12:
                status = "strong_candidate"
            elif score >= 68:
                status = "possible_candidate"
            rows.append(
                {
                    "product_id": product.product_id,
                    "original_name": product.original_name,
                    "suggested_product_name_ko": product.suggested_product_name_ko,
                    "category": product.category,
                    "source_reference_image": str(product.source_image),
                    "match_rank": rank,
                    "site_key": candidate.site_key,
                    "site_name": candidate.site_name,
                    "competitor_product_name": candidate.product_name,
                    "competitor_price_krw": candidate.price_krw or "",
                    "competitor_product_url": candidate.product_url,
                    "competitor_image_url": candidate.image_url,
                    "similarity_score": score,
                    "image_hash_distance": hash_dist,
                    "color_distance": cdist,
                    "match_status": status,
                    "source_usage_policy": SOURCE_USAGE_POLICY,
                    "remarks": "이미지 유사도 기반 후보. 가격/동일상품 여부는 최종 수작업 확인 권장.",
                }
            )
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=MATCH_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def write_summary(path: Path, rows: list[dict[str, Any]]) -> None:
    total_products = len({row["product_id"] for row in rows})
    strong = sum(1 for row in rows if row["match_status"] == "strong_candidate")
    possible = sum(1 for row in rows if row["match_status"] == "possible_candidate")
    no_candidate = sum(1 for row in rows if row["match_status"] == "no_candidate")
    lines = [
        "# 하이힐 상품 이미지 기반 경쟁사 가격 매칭 요약",
        "",
        f"- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"- 대상 상품 수: {total_products}",
        f"- 강한 후보 수: {strong}",
        f"- 가능 후보 수: {possible}",
        f"- 후보 없음 수: {no_candidate}",
        "",
        "## 원칙",
        "",
        "- 원본 이미지는 업로드/재사용하지 않고 이미지 지문 비교 참고용으로만 사용했습니다.",
        "- 경쟁사 이미지는 다운로드 저장하지 않고 유사도 계산 후 URL과 점수만 기록합니다.",
        "- 매칭 가격은 참고용이며 최종 가격 반영 전 수작업 확인이 필요합니다.",
        "",
        "## 샘플 후보",
        "",
        "| 상품 ID | 원본명 | 경쟁사 | 후보명 | 가격 | 점수 | 상태 |",
        "|---|---|---|---|---:|---:|---|",
    ]
    for row in rows[:20]:
        lines.append(
            f"| {row['product_id']} | {row['original_name']} | {row['site_name']} | "
            f"{row['competitor_product_name']} | {row['competitor_price_krw']} | "
            f"{row['similarity_score']} | {row['match_status']} |"
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Match highheel products to competitor prices by image similarity.")
    parser.add_argument("--products", required=True, help="products_master.csv/json")
    parser.add_argument("--source-root", help="Root where source_files are located. Defaults to sibling _extracted.")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--max-products", type=int, default=0, help="Limit products for testing; 0 means all.")
    parser.add_argument("--max-sites", type=int, default=len(COMPETITOR_SITES))
    parser.add_argument("--max-candidates-per-site", type=int, default=8)
    parser.add_argument("--top-n", type=int, default=5)
    parser.add_argument("--delay", type=float, default=0.2)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    products_path = Path(args.products)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    source_root = Path(args.source_root) if args.source_root else products_path.parent / "_extracted"

    products = read_products(products_path)
    if args.max_products > 0:
        products = products[: args.max_products]
    refs = build_source_refs(products, source_root)
    rows = match_products(
        refs,
        max_sites=args.max_sites,
        max_candidates_per_site=args.max_candidates_per_site,
        top_n=args.top_n,
        delay=args.delay,
    )
    write_csv(out_dir / "image_price_match_candidates.csv", rows)
    (out_dir / "image_price_match_candidates.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    write_summary(out_dir / "image_price_match_summary.md", rows)
    print(f"products: {len(refs)}")
    print(f"rows: {len(rows)}")
    print(f"out: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
