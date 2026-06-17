#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prepare AI image generation jobs and upload-facing product data.

Important policy:
- Supplier/source images are reference records only.
- Source image paths must never be placed in upload images arrays.
- Generated image paths are placeholders until real AI images are produced.
- All jobs start as need_generation and upload_allowed=false.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any


IMAGE_TYPES = [
    ("main", "prompt_main"),
    ("fullbody", "prompt_fullbody"),
    ("back", "prompt_back"),
    ("top_closeup", "prompt_top_closeup"),
    ("detail", "prompt_detail"),
]

JOB_FIELDS = [
    "job_id",
    "product_id",
    "original_name",
    "suggested_product_name_ko",
    "category",
    "color",
    "image_type",
    "prompt",
    "output_filename",
    "output_path",
    "status",
    "source_reference_note",
    "upload_allowed",
]

SOURCE_REFERENCE_NOTE = "원본 이미지는 참고용이며 최종 업로드 금지"
SOURCE_USAGE_POLICY = "source_files are reference only. Do not upload original supplier images."


def read_products(input_path: Path) -> list[dict[str, Any]]:
    if input_path.suffix.lower() == ".json":
        data = json.loads(input_path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("JSON input must be a list of product objects.")
        return [dict(item) for item in data]

    with input_path.open("r", encoding="utf-8-sig", newline="") as f:
        return [dict(row) for row in csv.DictReader(f)]


def generated_image_path(product_id: str, image_type: str) -> tuple[str, str]:
    filename = f"{product_id}_{image_type}.jpg"
    return filename, f"generated_images/{product_id}/{filename}"


def make_jobs(products: list[dict[str, Any]], out_dir: Path) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    generated_root = out_dir / "generated_images"
    generated_root.mkdir(parents=True, exist_ok=True)

    for product in products:
        product_id = product["product_id"]
        (generated_root / product_id).mkdir(parents=True, exist_ok=True)
        for image_type, prompt_field in IMAGE_TYPES:
            output_filename, output_path = generated_image_path(product_id, image_type)
            jobs.append(
                {
                    "job_id": f"{product_id}_{image_type}",
                    "product_id": product_id,
                    "original_name": product.get("original_name", ""),
                    "suggested_product_name_ko": product.get("suggested_product_name_ko", ""),
                    "category": product.get("category", ""),
                    "color": product.get("color", ""),
                    "image_type": image_type,
                    "prompt": product.get(prompt_field, ""),
                    "output_filename": output_filename,
                    "output_path": output_path,
                    "status": "need_generation",
                    "source_reference_note": SOURCE_REFERENCE_NOTE,
                    "upload_allowed": False,
                }
            )
    return jobs


def make_upload_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    upload_products: list[dict[str, Any]] = []
    for product in products:
        product_id = product["product_id"]
        images = [generated_image_path(product_id, image_type)[1] for image_type, _ in IMAGE_TYPES]
        upload_products.append(
            {
                "product_id": product_id,
                "product_name": product.get("suggested_product_name_ko", ""),
                "category": product.get("category", ""),
                "sub_category": product.get("sub_category", ""),
                "color": product.get("color", ""),
                "fit": product.get("fit", ""),
                "length": product.get("length", ""),
                "detail_points": product.get("detail_points", ""),
                "one_line_copy": product.get("one_line_copy", ""),
                "short_description": product.get("short_description", ""),
                "selling_points": product.get("selling_points", ""),
                "styling_keywords": product.get("styling_keywords", ""),
                "images": images,
                "image_status": "need_generation",
                "source_usage_policy": SOURCE_USAGE_POLICY,
            }
        )
    return upload_products


def write_jobs(jobs: list[dict[str, Any]], out_dir: Path) -> None:
    csv_path = out_dir / "image_generation_jobs.csv"
    json_path = out_dir / "image_generation_jobs.json"

    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=JOB_FIELDS)
        writer.writeheader()
        writer.writerows(jobs)

    json_path.write_text(json.dumps(jobs, ensure_ascii=False, indent=2), encoding="utf-8")


def write_upload_products(upload_products: list[dict[str, Any]], out_dir: Path) -> None:
    path = out_dir / "upload_ready_products.json"
    path.write_text(json.dumps(upload_products, ensure_ascii=False, indent=2), encoding="utf-8")


def write_checklist(products: list[dict[str, Any]], jobs: list[dict[str, Any]], out_dir: Path) -> None:
    lines = [
        "# AI 이미지 생성 작업 체크리스트",
        "",
        f"- 총 상품 수: {len(products)}",
        f"- 총 이미지 생성 작업 수: {len(jobs)}",
        f"- 상품당 생성할 이미지 수: {len(IMAGE_TYPES)}",
        "- 원본 이미지 사용 금지: source_files는 참고 기록이며 쇼룸/스마트스토어 업로드 이미지로 사용하지 않습니다.",
        "- 현재 상태: 모든 이미지 작업은 `need_generation`, 모든 `upload_allowed` 값은 `false`입니다.",
        "",
        "## 생성 후 검수 기준",
        "",
        "- 원본과 같은 모델이면 탈락",
        "- 원본과 같은 포즈이면 탈락",
        "- 원본과 같은 배경이면 탈락",
        "- 원본 워터마크/로고/텍스트가 있으면 탈락",
        "- 옷 디테일이 너무 달라지면 재생성",
        "- 손/얼굴/몸 비율이 이상하면 재생성",
        "- 상품 디테일이 잘 보이지 않으면 재생성",
        "",
        "## 샘플 상품 10개 작업 목록",
        "",
        "| 상품 ID | 상품명 | 생성 작업 | 예정 이미지 경로 |",
        "|---|---|---|---|",
    ]
    for product in products[:10]:
        product_id = product["product_id"]
        product_name = product.get("suggested_product_name_ko", "")
        job_names = ", ".join(image_type for image_type, _ in IMAGE_TYPES)
        image_paths = "<br>".join(generated_image_path(product_id, image_type)[1] for image_type, _ in IMAGE_TYPES)
        lines.append(f"| {product_id} | {product_name} | {job_names} | {image_paths} |")

    (out_dir / "generation_checklist.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def validate_outputs(jobs: list[dict[str, Any]], upload_products: list[dict[str, Any]]) -> None:
    if any(job["status"] != "need_generation" for job in jobs):
        raise ValueError("Every job status must be need_generation.")
    if any(job["upload_allowed"] is not False for job in jobs):
        raise ValueError("Every job upload_allowed must be false.")
    for product in upload_products:
        for image_path in product["images"]:
            lowered = image_path.lower()
            if "source" in lowered or "source_files" in lowered or "_extracted" in lowered:
                raise ValueError(f"Upload image path appears to reference source data: {image_path}")
            if not lowered.startswith("generated_images/"):
                raise ValueError(f"Upload image path must be under generated_images/: {image_path}")
        if product["image_status"] != "need_generation":
            raise ValueError("Every upload product image_status must be need_generation.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare highheel AI image generation jobs.")
    parser.add_argument("--input", required=True, help="Path to products_master.csv or products_master.json")
    parser.add_argument("--out", required=True, help="Output directory for next step files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser()
    out_dir = Path(args.out).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    products = read_products(input_path)
    jobs = make_jobs(products, out_dir)
    upload_products = make_upload_products(products)
    validate_outputs(jobs, upload_products)

    write_jobs(jobs, out_dir)
    write_upload_products(upload_products, out_dir)
    write_checklist(products, jobs, out_dir)

    print(f"products: {len(products)}")
    print(f"jobs: {len(jobs)}")
    print(f"out: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
