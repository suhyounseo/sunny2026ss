import re
import urllib.request

url = "https://www.bbprincess.com/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
print("len", len(html))
print("cate nums", sorted(set(re.findall(r"cate_no=(\d+)", html)))[:200])
links = re.findall(r'href="([^"]*/product/[^"]+)"', html)
print("product links", len(links))
for link in links[:80]:
    print(link)
for term in ["신상품", "NEW", "BEST", "원피스", "홀복"]:
    print(term, html.find(term))
