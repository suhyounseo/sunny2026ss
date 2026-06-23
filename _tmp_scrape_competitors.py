import csv
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

SITES = {
    "judyshop": "https://www.judyshop.co.kr",
    "bbprincess": "https://www.bbprincess.com",
}

PATHS = [
    "/product/list.html?cate_no=24",
    "/product/list.html?cate_no=25",
    "/product/list.html?cate_no=26",
    "/product/list.html?cate_no=27",
    "/product/list.html?cate_no=28",
    "/product/list.html?cate_no=29",
    "/product/list.html?cate_no=30",
    "/product/list.html?cate_no=31",
    "/product/list.html?cate_no=42",
    "/product/list.html?cate_no=43",
    "/product/list.html?cate_no=44",
    "/product/list.html?cate_no=344",
    "/product/list.html?cate_no=345",
    "/product/list.html?cate_no=346",
    "/product/list.html?cate_no=347",
    "/product/list.html?cate_no=348",
    "/product/list.html?cate_no=349",
    "/product/list.html?cate_no=350",
    "/product/list.html?cate_no=351",
    "/product/list.html?cate_no=352",
    "/product/list.html?cate_no=353",
    "/product/list.html?cate_no=354",
    "/product/list.html?cate_no=355",
    "/product/list.html?cate_no=356",
]

def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=25) as res:
        raw = res.read()
    enc = "utf-8"
    m = re.search(br"charset=([A-Za-z0-9_-]+)", raw[:3000], re.I)
    if m:
        enc = m.group(1).decode("ascii", "ignore")
    return raw.decode(enc, "ignore")

def clean(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def abs_url(base, url):
    url = html.unescape(url or "")
    if url.startswith("//"):
        return "https:" + url
    return urllib.parse.urljoin(base, url)

def parse_products(base, page_url, html_text):
    out = []
    # Cafe24 product links generally contain /product/name/id/category/display.
    link_re = re.compile(r'<a[^>]+href="([^"]*/product/[^"]+/\d+/[^"]*)"[^>]*>(.*?)</a>', re.S | re.I)
    for href, inner in link_re.findall(html_text):
        url = abs_url(base, href)
        if any(x in url for x in ["recent_view", "search.html", "basket.html"]):
            continue
        text = clean(inner)
        if len(text) < 2:
            continue
        # Drop navigation links and keep product-ish Korean names.
        if not re.search(r"[가-힣]", text):
            continue
        if text in ("관심상품", "옵션보기", "장바구니", "새창보기"):
            continue
        slug = re.sub(r"\?.*$", "", url)
        nearby = ""
        pos = html_text.find(href)
        if pos >= 0:
            nearby = clean(html_text[max(0, pos - 1500):pos + 3500])
        price = ""
        prices = re.findall(r"([0-9]{1,3}(?:,[0-9]{3})+)\s*원", nearby)
        if prices:
            price = prices[-1].replace(",", "")
        img = ""
        imgm = re.search(r'<img[^>]+src="([^"]+)"', inner, re.I)
        if not imgm and pos >= 0:
            imgm = re.search(r'<img[^>]+src="([^"]+)"', html_text[pos:pos + 1200], re.I)
        if imgm:
            img = abs_url(base, imgm.group(1))
        out.append({
            "url": slug,
            "name": text[:160],
            "price": price,
            "image": img,
            "sourcePage": page_url,
        })
    return out

def main():
    rows = []
    seen = set()
    for site, base in SITES.items():
        for path in PATHS:
            for page in range(1, 5):
                url = base + path + ("&page=%d" % page)
                try:
                    text = fetch(url)
                except Exception as e:
                    print("ERR", site, url, e)
                    continue
                products = parse_products(base, url, text)
                print(site, path, page, len(products))
                for p in products:
                    key = (site, p["url"])
                    if key in seen:
                        continue
                    seen.add(key)
                    p["site"] = site
                    rows.append(p)
                time.sleep(0.1)
    Path("_tmp_competitor_products.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    with open("_tmp_competitor_products.csv", "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["site", "name", "price", "url", "image", "sourcePage"])
        writer.writeheader()
        writer.writerows(rows)
    print("TOTAL", len(rows))

if __name__ == "__main__":
    main()
