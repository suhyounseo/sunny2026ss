T코드 추가 가격 업데이트 패치

기준 파일:
- showroom_t_products_info_update_patch_20260912.zip
- 상품 수 678개 기준

수정 대상:
- T028, T029: 상의 77,000원 + 하의 75,000원 = 152,000원
- T047, T048, T049: 상의 45,000원 + 하의 54,000원 = 99,000원

검증:
- 작업 전 상품 수: 678
- 작업 후 상품 수: 678
- JS 문법검사: OK

적용 방법:
1. ZIP 압축을 풉니다.
2. sunny2026ss 폴더에 products.json만 덮어쓰기 합니다.
3. GitHub Desktop에서 변경 파일이 products.json 1개만 보이면 정상입니다.
4. Commit 후 Push 합니다.
5. 쇼룸에서 Ctrl+F5로 강력 새로고침합니다.
