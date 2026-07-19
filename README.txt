NICE 쇼룸 모바일 확대 + 상세설명 폭 조정 26차

반영 내용:
1. 모바일 상세페이지 큰 사진 터치 시 전체화면 확대 보기 복구
2. 모바일에서 터치 이벤트가 막히지 않도록 click + touchend 동시 적용
3. 웹 상세페이지 오른쪽 설명/제품정보 영역을 약 2cm 더 넓힘
4. 기존 25차 TIA 제품정보 업데이트 내용 유지
5. 기존 NICE COLLECTION 문구 유지
6. 캐시 버전 july10v30 적용

적용:
app.js / style.css / index.html / products.json 덮어쓰기
Commit 메시지: Fix mobile image zoom and widen detail info
