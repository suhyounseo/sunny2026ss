import re
import sys
import urllib.parse
import urllib.request

sites = {
    "judyshop": "https://www.judyshop.co.kr",
    "bbprincess": "https://www.bbprincess.com",
}

queries = [
    "레이스캉캉 프릴 투피스",
    "배색라인 슬림 원피스",
    "골드버튼 플리츠 투피스",
    "크로스홀터 플레어 롱원피스",
]

def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=25) as res:
        raw = res.read()
    enc = "utf-8"
    m = re.search(br"charset=([A-Za-z0-9_-]+)", raw[:2000], re.I)
    if m:
        enc = m.group(1).decode("ascii", "ignore")
    return raw.decode(enc, "ignore")

for site, base in sites.items():
    print("==", site, "==")
    for q in queries:
        url = base + "/product/search.html?keyword=" + urllib.parse.quote(q)
        try:
            html = fetch(url)
        except Exception as e:
            print(q, "ERR", e)
            continue
        links = re.findall(r'href="([^"]*?/product/[^"]+)"', html)
        prices = re.findall(r'[\d,]+원', html)
        title = re.search(r"<title>(.*?)</title>", html, re.S | re.I)
        print(q, "len", len(html), "links", len(links), "prices", prices[:5], "title", (title.group(1).strip() if title else "")[:80])
        for link in links[:3]:
            print(" ", urllib.parse.urljoin(base, link.replace("&amp;", "&")))
