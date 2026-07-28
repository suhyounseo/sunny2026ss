NICE 쇼룸 메인사진/가격 수정 41차

기준:
- 40차 쇼룸 일괄 수정본

반영 내용:
1. N260039
   - 메인사진을 2번째 사진으로 변경
   - 가격 162,000원으로 변경

2. N260209
   - 메인사진을 2번째 사진으로 변경

3. N260125
   - 메인사진을 2번째 사진으로 변경

4. S401
   - 메인사진을 2번째 사진으로 변경
   - 가격 162,000원으로 변경

상세 변경:
- N260039: mainImage assets/N260039_01.jpg → assets/N260039_02.jpg / price 170000 → 162000
- S401: mainImage assets/S401_01.jpg → assets/S401_02.jpg / price 170000 → 162000
- N260209: mainImage assets/N260209_01.jpg → assets/N260209_02.jpg / price 113000 → 113000
- N260125: mainImage assets/N260125_01.jpg → assets/N260125_02.jpg / price 90000 → 90000

주의:
- 이미지 파일/assets 경로는 그대로 유지
- 사진이 연결되어 보이는 상태를 기준으로 mainImage/thumbImage/thumbnail만 2번째 사진으로 변경
- products.json 가격/메인컷만 수정

캐시:
- july10v43

검증:
- products.json: 정상
- app.js 문법: 정상

적용:
- app.js / style.css / index.html / products.json / assets 폴더 덮어쓰기

Commit 메시지:
Update main images and prices for N260039 S401 N260209 N260125
