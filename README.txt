NICE 쇼룸 상단 NICE COLLECTION 브랜드명 반영 점검/수정 30차

점검 결과:
- 업로드된 index.html에는 sticky-tools 안에 언어 버튼만 있고, NICE COLLECTION 브랜드 텍스트가 들어갈 sticky-head 구조가 없었습니다.
- 그래서 29차 CSS만으로는 화면에 반영되지 않았을 가능성이 큽니다.
- 이번 파일은 현재 업로드해주신 app/style/index/products 기준으로 다시 직접 반영했습니다.

반영 내용:
1. 검색창 위 좌측 빈 공간에 NICE COLLECTION 텍스트 추가
2. 언어 버튼은 오른쪽 유지
3. 데스크탑/모바일 모두 보이도록 CSS 우선순위 강화
4. 브라우저 캐시 방지를 위해 style.css/app.js 버전 july10v33 적용
5. 기존 products.json 유지

검증:
- products.json: 정상
- app.js 문법: 정상

적용:
app.js / style.css / index.html / products.json 덮어쓰기

Commit 메시지:
Fix NICE COLLECTION sticky header brand
