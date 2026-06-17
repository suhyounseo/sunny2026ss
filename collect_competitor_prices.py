#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Collect public competitor price samples and map them to highheel product categories.

This is a reference-price tool only. It does not copy competitor images, does not
reuse competitor product detail content, and does not mark prices as final sale
prices. Public pages may change or require login; failures are logged as status.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import ssl
import statistics
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen


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

SAMPLE_FIELDS = [
    "site_key",
    "site_name",
    "site_url",
    "competitor_product_name",
    "price_krw",
    "product_url",
    "source_page",
    "category_guess",
    "collected_at",
    "status",
    "remarks",
]

REFERENCE_FIELDS = [
    "product_id",
    "suggested_product_name_ko",
    "category",
    "color",
    "competitor_sample_count",
    "min_price_krw",
    "median_price_krw",
    "max_price_krw",
    "reference_price_note",
    "source_policy",
]


@dataclass
class PriceSample:
    site_key: str
    site_name: str
    site_url: str
    competitor_product_name: str
    price_krw: int | None
    product_url: str
    source_page: str
    category_guess: str
    collected_at: str
    status: str
    remarks: str


class LinkTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._href is not None:
            text = normalize_text(" ".join(self._text))
            if text:
                self.links.append((self._href, text))
            self._href = None
            self._text = []


def normalize_text(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def fetch(url: str, timeout: int = 15) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; HighheelPriceReference/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    context = ssl.create_default_context()
    with urlopen(req, timeout=timeout, context=context) as response:
        raw = response.read()
        charset = response.headers.get_content_charset() or "utf-8"
        try:
            return raw.decode(charset, errors="replace")
        except LookupError:
            return raw.decode("utf-8", errors="replace")


def infer_category(name: str) -> str:
    lowered = name.lower()
    if any(token in lowered for token in ["투피스", "세트", "set"]):
        return "투피스"
    if any(token in lowered for token in ["블라우스", "blouse", "셔츠"]):
        return "블라우스"
    if any(token in lowered for token in ["스커트", "skirt"]):
        return "스커트"
    if any(token in lowered for token in ["롱드레스", "long dress"]):
        return "롱드레스"
    if any(token in lowered for token in ["원피스", "ops", "dress"]):
        return "원피스"
    if any(token in lowered for token in ["탑", "top", " t", " 티"]):
        return "탑"
    return "기타"


def price_to_int(value: str) -> int | None:
    digits = re.sub(r"[^0-9]", "", value)
    if not digits:
        return None
    price = int(digits)
    if price < 1000 or price > 1000000:
        return None
    return price


def extract_samples_from_html(site: dict[str, str], page_url: str, body: str, collected_at: str) -> list[PriceSample]:
    text = normalize_text(body)
    samples: list[PriceSample] = []

    # Cafe24-style listing text: "상품명 : ... 판매가 : 75,000원"
    pattern = re.compile(
        r"상품명\s*:\s*(?P<name>.{1,90}?)(?:상품\s*요약설명|상품요약정보|판매가)\s*:\s*(?P<price>[0-9,]+)\s*원",
        re.S,
    )
    for match in pattern.finditer(text):
        name = normalize_text(match.group("name"))
        price = price_to_int(match.group("price"))
        if name and price:
            samples.append(make_sample(site, page_url, name, price, "", collected_at, "ok", "public_page"))

    # Looser fallback around product image alt/title + nearby price number.
    if len(samples) < 5:
        chunks = re.split(r"(?:\*|\n|Image:)", text)
        for chunk in chunks:
            if "원" not in chunk:
                continue
            price_match = re.search(r"([0-9]{2,3}(?:,[0-9]{3})+|[0-9]{5,6})\s*원?", chunk)
            if not price_match:
                continue
            price = price_to_int(price_match.group(1))
            name = normalize_text(chunk[: price_match.start()])
            name = re.sub(r"^(상품명\s*:|판매가\s*:|0\s*%\s*)", "", name).strip()
            if price and 2 <= len(name) <= 80 and not any(s.competitor_product_name == name for s in samples):
                samples.append(make_sample(site, page_url, name, price, "", collected_at, "ok", "fallback_extract"))

    parser = LinkTextParser()
    try:
        parser.feed(body)
    except Exception:
        pass
    link_by_text = {text: urljoin(page_url, href) for href, text in parser.links}
    for sample in samples:
        if not sample.product_url:
            for link_text, href in link_by_text.items():
                if sample.competitor_product_name in link_text or link_text in sample.competitor_product_name:
                    sample.product_url = href
                    break

    dedup: dict[tuple[str, int | None], PriceSample] = {}
    for sample in samples:
        dedup[(sample.competitor_product_name, sample.price_krw)] = sample
    return list(dedup.values())


def discover_listing_pages(base_url: str, body: str, limit: int) -> list[str]:
    parser = LinkTextParser()
    try:
        parser.feed(body)
    except Exception:
        return []

    category_words = [
        "원피스", "드레스", "투피스", "블라우스", "탑", "스커트", "신상", "베스트",
        "mini", "dress", "onepiece", "top", "blouse", "skirt", "best", "new",
    ]
    href_patterns = [
        "product/list", "category", "shopbrand", "product_list", "goods", "shop/list",
        "board/product", "m_product", "cate_no", "xcode",
    ]

    candidates: list[str] = []
    for href, text in parser.links:
        lowered_href = href.lower()
        lowered_text = text.lower()
        if href.startswith("#") or href.startswith("javascript:"):
            continue
        if any(word.lower() in lowered_text for word in category_words) or any(p in lowered_href for p in href_patterns):
            url = urljoin(base_url, href)
            if url.startswith("http") and url not in candidates:
                candidates.append(url)
        if len(candidates) >= limit:
            break
    return candidates


def make_sample(
    site: dict[str, str],
    page_url: str,
    name: str,
    price: int | None,
    product_url: str,
    collected_at: str,
    status: str,
    remarks: str,
) -> PriceSample:
    return PriceSample(
        site_key=site["site_key"],
        site_name=site["site_name"],
        site_url=site["url"],
        competitor_product_name=name,
        price_krw=price,
        product_url=product_url,
        source_page=page_url,
        category_guess=infer_category(name),
        collected_at=collected_at,
        status=status,
        remarks=remarks,
    )


def collect_samples(max_per_site: int, delay: float, max_pages_per_site: int) -> list[PriceSample]:
    collected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    all_samples: list[PriceSample] = []
    for site in COMPETITOR_SITES:
        try:
            body = fetch(site["url"])
            pages = [site["url"]] + discover_listing_pages(site["url"], body, max_pages_per_site)
            samples: list[PriceSample] = []
            for page_url in pages:
                try:
                    page_body = body if page_url == site["url"] else fetch(page_url)
                    samples.extend(extract_samples_from_html(site, page_url, page_body, collected_at))
                except Exception:
                    continue
                dedup = {(s.competitor_product_name, s.price_krw, s.site_key): s for s in samples if s.price_krw}
                samples = list(dedup.values())
                if len(samples) >= max_per_site:
                    break
                time.sleep(delay)
            all_samples.extend(samples[:max_per_site])
            if not samples:
                all_samples.append(
                    make_sample(site, site["url"], "", None, "", collected_at, "no_price_found", "public_homepage_no_parseable_price")
                )
        except Exception as exc:
            all_samples.append(make_sample(site, site["url"], "", None, "", collected_at, "fetch_failed", str(exc)))
        time.sleep(delay)
    return all_samples


def read_products(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        return json.loads(path.read_text(encoding="utf-8"))
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def make_reference_rows(products: list[dict[str, Any]], samples: list[PriceSample]) -> list[dict[str, Any]]:
    prices_by_category: dict[str, list[int]] = {}
    for sample in samples:
        if sample.status == "ok" and sample.price_krw:
            prices_by_category.setdefault(sample.category_guess, []).append(sample.price_krw)
            prices_by_category.setdefault("전체", []).append(sample.price_krw)

    rows = []
    for product in products:
        category = product.get("category", "기타") or "기타"
        prices = prices_by_category.get(category) or prices_by_category.get("전체") or []
        if prices:
            min_price = min(prices)
            median_price = round(statistics.median(prices))
            max_price = max(prices)
            count = len(prices)
        else:
            min_price = median_price = max_price = ""
            count = 0
        rows.append(
            {
                "product_id": product.get("product_id", ""),
                "suggested_product_name_ko": product.get("suggested_product_name_ko", ""),
                "category": category,
                "color": product.get("color", ""),
                "competitor_sample_count": count,
                "min_price_krw": min_price,
                "median_price_krw": median_price,
                "max_price_krw": max_price,
                "reference_price_note": "공개 경쟁사 페이지에서 수집한 참고 가격 범위입니다. 최종 판매가는 수동 검토 필요.",
                "source_policy": "competitor prices are reference only; do not copy competitor images or descriptions.",
            }
        )
    return rows


def write_summary(path: Path, samples: list[PriceSample], reference_rows: list[dict[str, Any]]) -> None:
    ok_samples = [s for s in samples if s.status == "ok" and s.price_krw]
    status_counts: dict[str, int] = {}
    site_counts: dict[str, int] = {}
    for sample in samples:
        status_counts[sample.status] = status_counts.get(sample.status, 0) + 1
        if sample.status == "ok":
            site_counts[sample.site_name] = site_counts.get(sample.site_name, 0) + 1

    lines = [
        "# 경쟁사 가격 참고 수집 요약",
        "",
        "- 용도: NICE/스마트스토어 가격 책정 참고용",
        "- 원칙: 경쟁사 이미지/상세문구는 복제하지 않고 공개 가격 숫자만 참고합니다.",
        f"- 수집 샘플 수: {len(ok_samples)}",
        f"- 상품 가격 참고 행 수: {len(reference_rows)}",
        "",
        "## 사이트별 수집 현황",
        "",
        "| 사이트 | 수집 샘플 수 |",
        "|---|---:|",
    ]
    for name, count in sorted(site_counts.items()):
        lines.append(f"| {name} | {count} |")
    lines += ["", "## 상태별 현황", "", "| 상태 | 개수 |", "|---|---:|"]
    for status, count in sorted(status_counts.items()):
        lines.append(f"| {status} | {count} |")
    lines += [
        "",
        "## 주의",
        "",
        "- 가격은 수집 시점의 공개 페이지 기준이며 이후 변경될 수 있습니다.",
        "- 로그인 전용, 차단, 스크립트 렌더링 사이트는 `fetch_failed` 또는 `no_price_found`로 남을 수 있습니다.",
        "- 최종 판매가는 마진, 촬영/생성 비용, 배송비, 플랫폼 수수료를 반영해 별도 결정해야 합니다.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect public competitor price samples.")
    parser.add_argument("--products", required=True, help="products_master.csv/json path")
    parser.add_argument("--out", required=True, help="output directory")
    parser.add_argument("--max-per-site", type=int, default=80)
    parser.add_argument("--max-pages-per-site", type=int, default=8)
    parser.add_argument("--delay", type=float, default=0.5)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    products_path = Path(args.products)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    products = read_products(products_path)
    samples = collect_samples(args.max_per_site, args.delay, args.max_pages_per_site)
    sample_rows = [asdict(sample) for sample in samples]
    reference_rows = make_reference_rows(products, samples)

    write_csv(out_dir / "competitor_price_samples.csv", sample_rows, SAMPLE_FIELDS)
    (out_dir / "competitor_price_samples.json").write_text(json.dumps(sample_rows, ensure_ascii=False, indent=2), encoding="utf-8")
    write_csv(out_dir / "product_price_reference.csv", reference_rows, REFERENCE_FIELDS)
    (out_dir / "product_price_reference.json").write_text(json.dumps(reference_rows, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "competitor_sites.json").write_text(json.dumps(COMPETITOR_SITES, ensure_ascii=False, indent=2), encoding="utf-8")
    write_summary(out_dir / "price_collection_summary.md", samples, reference_rows)

    print(f"samples: {len([s for s in samples if s.status == 'ok'])}")
    print(f"products: {len(products)}")
    print(f"out: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
