8월 신상 착용정보 재점검 v9

적용 파일: index.html, app.js, style.css, products.json
assets 폴더는 포함하지 않았습니다. 기존 상품 이미지는 그대로 사용합니다.

수정 내용:
1. 제품정보/사이즈 실측 이미지는 고객 화면에 직접 노출되지 않도록 productInfoImage/productInfoImages 참조 제거
2. 8월신상제품정보.zip의 착용정보 체크 위치를 다시 읽어 캡여부/지퍼/안감/비침/두께감/신축성 재반영
3. 원피스는 착용 정보 1개 테이블, 투피스/세트는 상의/스커트/숏팬츠 착용 정보로 분리
4. 캐시 버전 aug07wearaudit9 적용

검수 파일: august_wear_info_audit_report_v9.csv
