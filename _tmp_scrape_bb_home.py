import csv
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://www.bbprincess.com"

def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    })
    raw = urllib.request.urlopen(req, timeout=25).read()
    return raw.decode("utf-8", "ignore")

def clean(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()

def abs_url(url):
    return urllib.parse.urljoin(BASE, html.unescape(url))

def parse_page(url):
    text = fetch(url)
    rows = []
    # Split around each detail link and inspect nearby content.
    for m in re.finditer(r'href="([^"]*/product/detail\.html\?product_no=[^"]+)"', text):
        href = m.group(1)
        full = abs_url(href)
        start = max(0, m.start() - 2500)
        end = min(len(text), m.end() + 3500)
        nearby = text[start:end]
        nearby_clean = clean(nearby)
        names = []
        for pat in [
            r'상품명\s*:?\s*([^판매가격]+?)(?:판매가|소비자가|할인판매가|원|\s{2,})',
            r'class="[^"]*(?:name|prdName|description)[^"]*"[^>]*>(.*?)</',
            r'alt="([^"]+)"',
            r'title="([^"]+)"',
        ]:
            for n in re.findall(pat, nearby, re.S | re.I):
                n = clean(n)
                if len(n) >= 2 and re.search(r"[가-힣A-Za-z0-9]", n):
                    names.append(n)
        name = ""
        for n in names:
            if not any(x in n for x in ["장바구니", "관심상품", "옵션", "새창"]):
                name = n
                break
        prices = re.findall(r"([0-9]{1,3}(?:,[0-9]{3})+)\s*원", nearby_clean)
        price = prices[-1].replace(",", "") if prices else ""
        img = ""
        im = re.search(r'<img[^>]+src="([^"]+)"', nearby, re.I)
        if im:
            img = abs_url(im.group(1))
        if name:
            rows.append({
                "site": "bbprincess",
                "name": name[:160],
                "price": price,
                "url": re.sub(r"&amp;", "&", full),
                "image": img,
                "sourcePage": url,
            })
    return rows

def main():
    pages = [BASE + "/", BASE + "/product/list.html?cate_no=1"]
    rows = []
    seen = set()
    for url in pages:
        try:
            for r in parse_page(url):
                key = r["url"]
                if key in seen:
                    continue
                seen.add(key)
                rows.append(r)
        except Exception as e:
            print("ERR", url, e)
    Path("_tmp_bb_products.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    with open("_tmp_bb_products.csv", "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["site", "name", "price", "url", "image", "sourcePage"])
        writer.writeheader()
        writer.writerows(rows)
    print("TOTAL", len(rows))
    for r in rows[:30]:
        print(r["name"], r["price"], r["url"])

if __name__ == "__main__":
    main()
