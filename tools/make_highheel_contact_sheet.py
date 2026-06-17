from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(r"C:\Users\UserK\Documents\GitHub\sunny2026ss\source\highheel\하이힐")
OUT = Path(r"C:\Users\UserK\Documents\GitHub\sunny2026ss\outputs\highheel_contact_sheet.jpg")


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    folders = sorted([p for p in ROOT.iterdir() if p.is_dir()], key=lambda p: p.name)
    thumb_w, thumb_h = 180, 230
    label_h = 44
    cols = 5
    rows = (len(folders) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("malgun.ttf", 14)
    except Exception:
        font = ImageFont.load_default()

    for idx, folder in enumerate(folders):
        files = sorted(
            [p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}],
            key=lambda p: p.name,
        )
        if not files:
            continue
        chosen = max(files[:6], key=lambda p: p.stat().st_size) if files[:6] else files[0]
        try:
            image = Image.open(chosen).convert("RGB")
            image = ImageOps.exif_transpose(image)
            image.thumbnail((thumb_w - 12, thumb_h - 12), Image.LANCZOS)
            x = (idx % cols) * thumb_w + (thumb_w - image.width) // 2
            y = (idx // cols) * (thumb_h + label_h) + 6
            sheet.paste(image, (x, y))
        except Exception:
            pass

        label = folder.name
        if len(label) > 17:
            label = label[:17] + "..."
        tx = (idx % cols) * thumb_w + 8
        ty = (idx // cols) * (thumb_h + label_h) + thumb_h + 2
        draw.text((tx, ty), label, fill=(20, 20, 20), font=font)

    sheet.save(OUT, quality=90)
    print(OUT)


if __name__ == "__main__":
    main()
