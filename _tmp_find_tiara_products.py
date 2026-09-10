import zipfile
import shutil
from pathlib import Path

zip_path = Path(r"C:\Users\UserK\Pictures\티아라 수입의류 모음.zip")
targets = [
    "꽃쟈가드나시", "나비망사탑", "등레이스니트", "딥브이니트", "리아니트",
    "뷔스티에리본테이프나시", "삥줄라인나시", "시어시트", "위빙나시",
    "자개훌나시", "컷아웃나시", "코바나시", "쿠치니트", "프린세스나시",
    "피버나시", "노방꽃나시", "스파크니트", "아일릿니트", "카니발니트",
    "트레져블라", "까멜부클니트", "비엘니트",
    "트윈벨트스커트", "벨트장식스커트", "송이스팽클스커트", "사각찡벨트스커트",
    "타원깡스커트", "오마쥬스커트",
]

out_root = Path(r"C:\Users\UserK\Documents\GitHub\sunny2026ss\tmp\tiara-club-20260906\refs")
image_exts = {".jpg", ".jpeg", ".png", ".webp"}

with zipfile.ZipFile(zip_path, metadata_encoding="cp949") as zf:
    names = zf.namelist()
    for target in targets:
        out_dir = out_root / target
        if out_dir.exists() and any(out_dir.iterdir()):
            print(f"SKIP {target}: existing")
            continue
        matches = [n for n in names if target in n and Path(n).suffix.lower() in image_exts]
        out_dir.mkdir(parents=True, exist_ok=True)
        for index, member in enumerate(matches, start=1):
            suffix = Path(member).suffix.lower() or ".jpg"
            with zf.open(member) as src, (out_dir / f"ref-{index:02d}{suffix}").open("wb") as dst:
                shutil.copyfileobj(src, dst)
        print(f"EXTRACT {target}: {len(matches)}")
