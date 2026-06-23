import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

def fetch(url):
    parsed = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit((
        parsed.scheme,
        parsed.netloc,
        urllib.parse.quote(urllib.parse.unquote(parsed.path), safe="/"),
        parsed.query,
        parsed.fragment,
    ))
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    })
    return urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore")

def clean(s):
    import html
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()

def extract_detail(url):
    html = fetch(url)
    text = clean(html)
    info = {
        "detailPrice": "",
        "sizeText": "",
        "fabricText": "",
        "wearInfo": "",
        "rawInfo": "",
    }
    prices = re.findall(r"([0-9]{1,3}(?:,[0-9]{3})+)\s*원", text)
    if prices:
        info["detailPrice"] = prices[-1].replace(",", "")
    # Keep useful snippets around common detail terms.
    terms = ["사이즈", "소재", "혼용", "신축", "안감", "비침", "두께", "지퍼", "착용", "모델", "SIZE", "FABRIC"]
    snippets = []
    for term in terms:
        idx = text.find(term)
        if idx >= 0:
            snippets.append(text[max(0, idx - 120):idx + 500])
    joined = " / ".join(dict.fromkeys(snippets))
    info["rawInfo"] = joined[:3000]
    size_match = re.search(r"(?:사이즈|SIZE)\s*[:：]?\s*([^/]{0,400})", joined, re.I)
    if size_match:
        info["sizeText"] = size_match.group(1).strip()[:500]
    fabric_match = re.search(r"(?:소재|FABRIC|혼용)\s*[:：]?\s*([^/]{0,300})", joined, re.I)
    if fabric_match:
        info["fabricText"] = fabric_match.group(1).strip()[:400]
    wear_bits = []
    for term in ["신축", "안감", "비침", "두께", "지퍼", "착용"]:
        m = re.search(term + r"\s*[:：]?\s*([^/]{0,120})", joined)
        if m:
            wear_bits.append(term + ": " + m.group(1).strip())
    info["wearInfo"] = " / ".join(wear_bits)[:800]
    return info

def main():
    comp = json.loads(Path("_tmp_competitor_products.json").read_text(encoding="utf-8"))
    rows = [r for r in comp if r.get("site") == "judyshop"]
    details = {}
    for i, r in enumerate(rows, 1):
        name = r.get("name", "")
        if not re.search(r"S\d{3}", name, re.I):
            continue
        try:
            details[r["url"]] = extract_detail(r["url"])
            print(i, name, "ok")
        except Exception as e:
            details[r["url"]] = {"error": str(e)}
            print(i, name, "ERR", e)
        time.sleep(0.08)
    Path("_tmp_judy_details.json").write_text(json.dumps(details, ensure_ascii=False, indent=2), encoding="utf-8")
    print("details", len(details))

if __name__ == "__main__":
    main()
