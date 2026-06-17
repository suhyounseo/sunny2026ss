import csv
import json
from pathlib import Path


ROOT = Path(r"C:\Users\UserK\Documents\GitHub\sunny2026ss\source\highheel\하이힐")
OUT_DIR = Path(r"C:\Users\UserK\Documents\GitHub\sunny2026ss\outputs\highheel_ai_model")
CSV_OUT = OUT_DIR / "highheel_ai_generation_manifest.csv"
JSON_OUT = OUT_DIR / "highheel_ai_generation_manifest.json"


def classify_product(name: str) -> str:
    lowered = name.lower()
    if "ops" in lowered:
        return "one-piece dress"
    if "sk" in lowered:
        return "skirt or coordinated set with skirt"
    if "bl" in lowered:
        return "blouse or coordinated blouse look"
    if "top" in lowered:
        return "top or coordinated top look"
    return "women's apparel item"


def product_notes(name: str) -> str:
    notes = []
    if "블랙" in name or name.endswith("B"):
        notes.append("black colorway")
    if "W" in name:
        notes.append("white or ivory colorway")
    if "민트" in name or "소라" in name:
        notes.append("cool pastel colorway")
    if "레이스" in name:
        notes.append("lace texture")
    if "리본" in name:
        notes.append("ribbon detail")
    if "체크" in name:
        notes.append("check pattern")
    if "레오파드" in name:
        notes.append("leopard pattern")
    if "러플" in name:
        notes.append("ruffle detail")
    if "쥬얼리" in name:
        notes.append("jewelry-like trim")
    return ", ".join(notes) if notes else "follow the reference garment silhouette, color, and fabric details"


def build_prompt(name: str) -> str:
    category = classify_product(name)
    notes = product_notes(name)
    return (
        "Use case: product-mockup\n"
        "Asset type: main product image for NICE Showroom upload\n"
        "Primary request: Create a new original catalog photo of the fixed fictional AI model wearing this product. "
        "Use the source images only to understand garment color, silhouette, fabric, and key details; do not copy the original model, face, pose, room, mirror selfie, background, crop, or competitor styling.\n"
        "Fixed model: use the same original adult Korean female AI model as ai_model_reference_v2_showroom-bg.png: shoulder-length dark brown soft-wave hair, elegant natural face, realistic slim proportions, calm boutique expression.\n"
        f"Product: {name}, {category}, {notes}.\n"
        "Styling rule: keep the actual product's color, silhouette, fabric, and signature details accurate, but freely choose tasteful coordinating bottoms, shoes, and minimal accessories when they are not the core product. Remove or replace outerwear, cardigans, bags, jeans, jewelry, and original styling items unless they are clearly part of the product being sold. The final styling should make the main product easier to see than in the source photo.\n"
        "Scene/backdrop: tasteful warm ivory Korean boutique showroom studio, softly blurred neutral clothing rack or curved wall detail in the distance, pale matte floor, subtle depth, clean negative space, no readable signs.\n"
        "Style/medium: photorealistic premium Korean online boutique catalog photography.\n"
        "Composition/framing: vertical 4:5 full-body or knee-up crop depending on product length, front 3/4 pose, garment clearly visible, no phone, no mirror.\n"
        "Lighting/mood: soft diffused commercial studio lighting, accurate fabric texture, natural skin tone.\n"
        "Constraints: original generated image only, no watermark, no text, no logos, no brand symbols, no exact copy of competitor photo, no extra people, no distorted hands.\n"
        "Avoid: revealing or lingerie styling, celebrity resemblance, dramatic editorial scene, cluttered room, selfie angle."
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    for idx, folder in enumerate(sorted([p for p in ROOT.iterdir() if p.is_dir()], key=lambda p: p.name), start=1):
        files = sorted(
            [p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}],
            key=lambda p: (p.name, -p.stat().st_size),
        )
        representative = sorted(files, key=lambda p: p.stat().st_size, reverse=True)[:3]
        code = f"HH-{idx:03d}"
        rows.append(
            {
                "code": code,
                "upload_status": "HOLD_DO_NOT_UPLOAD",
                "showroom_ready": "NO",
                "product_name": folder.name,
                "source_folder": str(folder),
                "reference_images": " | ".join(str(p) for p in representative),
                "output_main_image": str(OUT_DIR / f"{code}_{folder.name}_main.png"),
                "output_detail_image": str(OUT_DIR / f"{code}_{folder.name}_detail.png"),
                "prompt": build_prompt(folder.name),
            }
        )

    with CSV_OUT.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    JSON_OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(CSV_OUT)
    print(JSON_OUT)
    print(len(rows))


if __name__ == "__main__":
    main()
