NICE 쇼룸 먹통 복구 핫픽스

원인: app.js에서 isBest 함수가 존재하지 않는 isJulyNew()를 호출해서 렌더링 중 오류가 발생했고, fetch catch로 상품 데이터를 불러오지 못했습니다 메시지가 표시됨.

수정:
- isJulyNew() -> isJulyNewProduct()로 수정
- 캐시 버전 july10v5 적용
- products.json은 7월 신상 문구정리/BEST제거 반영본 유지

적용 파일:
app.js
index.html
products.json
style.css

적용 후 Commit 메시지:
Fix July new arrivals loading error
