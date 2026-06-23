import json
import re
from pathlib import Path

products = json.loads(Path("products.json").read_text(encoding="utf-8"))
judy = json.loads(Path("_tmp_competitor_products.json").read_text(encoding="utf-8"))
bb = json.loads(Path("_tmp_bb_products.json").read_text(encoding="utf-8"))
details = json.loads(Path("_tmp_judy_details.json").read_text(encoding="utf-8"))

def is_s(code):
    return bool(re.match(r"^S\d{3}$", code or ""))

def clean_name(name):
    name = re.sub(r"^상품명\s*:\s*", "", name or "").strip()
    name = re.sub(r"\s+", " ", name)
    return name

def size_options(text):
    text = text or ""
    opts = []
    for pat in [r"55\(S\)", r"66\(M\)", r"77\(L\)", r"88\(XL\)", r"44\(XS\)", r"99\(XXL\)", r"FREE"]:
        if re.search(pat, text, re.I):
            opts.append(pat.replace("\\", ""))
    # Preserve common custom sizes if present.
    for label in ["33반", "44반", "55반", "66반", "77반", "88반"]:
        if label in text and label not in opts:
            opts.append(label)
    return ", ".join(opts)

def by_code(rows):
    out = {}
    for r in rows:
        text = (r.get("name", "") + " " + r.get("url", "")).lower()
        for c in re.findall(r"s\d{3}", text):
            out.setdefault(c.upper(), []).append(r)
    return out

judy_by_code = by_code([r for r in judy if r.get("site") == "judyshop"])
bb_by_code = by_code(bb)

review_rows = []
for p in sorted([x for x in products if is_s(x.get("code"))], key=lambda x: x["code"]):
    code = p["code"]
    jmatch = (judy_by_code.get(code) or [None])[0]
    bmatch = (bb_by_code.get(code) or [None])[0]
    jdetail = details.get(jmatch["url"], {}) if jmatch else {}
    jname = clean_name(jmatch.get("name", "")) if jmatch else ""
    bname = clean_name(bmatch.get("name", "")) if bmatch else ""
    jsize = size_options(jdetail.get("sizeText", ""))
    memo = []
    match_status = "직접매칭" if jmatch else "미확인"
    if jmatch:
        if not jsize:
            memo.append("사이즈 옵션 텍스트 확인 필요")
        if p.get("category") == "TWO PIECE" and any(k in jname for k in ["블라우스", "스커트", "니트", "탑"]) and "투피스" not in jname and "세트" not in jname:
            memo.append("우리 상품은 투피스이나 경쟁사명은 단품처럼 보여 구성 확인 필요")
        if p.get("category") != "TWO PIECE" and any(k in jname for k in ["블라우스", "스커트", "니트", "탑"]):
            memo.append("카테고리/상품명 확인 필요")
    else:
        memo.append("쥬디샵 직접 코드 매칭 없음")
    if not bmatch:
        memo.append("비비공주 직접 코드 매칭 없음")
    review_rows.append({
        "code": code,
        "niceName": p.get("name", ""),
        "color": p.get("color", ""),
        "category": p.get("category", ""),
        "folder": p.get("zipFolder") or p.get("folder") or "",
        "nicePrice": p.get("price") or "",
        "niceSize": p.get("size") or "",
        "judyStatus": match_status,
        "judyName": jname,
        "judyPrice": int(jmatch["price"]) if jmatch and str(jmatch.get("price", "")).isdigit() else "",
        "judySize": jsize or ("상세페이지 확인필요" if jmatch else ""),
        "judyFabric": jdetail.get("fabricText") or ("상세이미지 확인필요" if jmatch else ""),
        "judyWear": "상세이미지 확인필요" if jmatch else "",
        "judyUrl": jmatch.get("url", "") if jmatch else "",
        "bbStatus": "직접매칭" if bmatch else "미확인",
        "bbName": bname,
        "bbPrice": int(bmatch["price"]) if bmatch and str(bmatch.get("price", "")).isdigit() else "",
        "bbUrl": bmatch.get("url", "") if bmatch else "",
        "reviewAction": "가격/사이즈 우선 검토" if jmatch else "수동검색 필요",
        "memo": " / ".join(memo),
    })

candidate_rows = []
for source, rows in [("judyshop", judy), ("bbprincess", bb)]:
    for r in rows:
        code_match = re.search(r"S\d{3}", r.get("name", ""), re.I)
        candidate_rows.append({
            "site": source,
            "codeInName": code_match.group(0).upper() if code_match else "",
            "name": clean_name(r.get("name", "")),
            "price": int(r["price"]) if str(r.get("price", "")).isdigit() else "",
            "url": r.get("url", ""),
            "sourcePage": r.get("sourcePage", ""),
        })

summary = {
    "totalNewProducts": len(review_rows),
    "judyDirectMatches": sum(1 for r in review_rows if r["judyStatus"] == "직접매칭"),
    "bbDirectMatches": sum(1 for r in review_rows if r["bbStatus"] == "직접매칭"),
    "judyPriceCaptured": sum(1 for r in review_rows if r["judyPrice"] != ""),
    "needsManualSearch": sum(1 for r in review_rows if r["judyStatus"] != "직접매칭"),
}

Path("_tmp_review_data.json").write_text(json.dumps({
    "summary": summary,
    "reviewRows": review_rows,
    "candidateRows": candidate_rows,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
