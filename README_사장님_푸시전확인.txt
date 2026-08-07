NICE 8월 신상 쇼룸 직접 작업본 v3

적용 방법
1. 이 ZIP 압축을 풉니다.
2. GitHub sunny2026ss 저장소 루트에 아래 파일/폴더를 그대로 덮어씁니다.
   - index.html
   - app.js
   - style.css
   - products.json
   - assets/aug01/
3. GitHub Desktop에서 변경 파일 확인 후 Commit + Push 하면 됩니다.

작업 내용
- 8월 신상 상품 83개 유지/정리
- 거래처 신상 정보 기준 가격, 컬러, 같은 디자인 다른 컬러 묶음 반영
- 고객 노출 문구에서 거래처명/매입정보/원산지/수입 표현 제거
- 상품명은 거래처 원문 복붙이 아니라 이미지 기준으로 단순 정리
- 상세설명/포인트/추천문구 중복 표현 축소
- 화면 하단 칩 반복 노출 줄이도록 app.js 중복 필터 보완
- 캐시 버전: aug07direct1

검수 파일
- august_new_final_check.csv : 상품명/가격/컬러/묶음 확인용
- tiara_internal_smartstore_check.csv : 티아라 스마트스토어 원산지/내부 확인용

주의
- 티아라 원산지/수입 여부는 스마트스토어 등록 시 별도 확인 필요합니다.
- 쇼룸에는 수입산 문구를 표시하지 않습니다.
