NICE 쇼룸 이미지 assets 연결 수정 33차

기준:
- 32차 ANC 색상묶음/사이즈/이미지 수정본 유지
- 업로드 파일: 쇼핑몰 이미지.zip

핵심 원칙:
- 이미지는 무조건 assets 폴더에서 연결

반영 내용:
- N260035 이미지 SmartStore 외부 URL 제거 → assets/N260035_01... 로 연결
- N260037 이미지 SmartStore 외부 URL 제거 → assets/N260037_01... 로 연결
- N260038 이미지 SmartStore 외부 URL 제거 → assets/N260038_01... 로 연결
- 실제 이미지 파일도 assets 폴더에 함께 포함
- 캐시 버전 july10v36 적용

반영 상세:
- N260035: 7개 assets 이미지 연결
- N260037: 9개 assets 이미지 연결
- N260038: 8개 assets 이미지 연결

검증:
- products.json: 정상
- app.js 문법: 정상

적용:
app.js / style.css / index.html / products.json / assets 폴더 덮어쓰기

Commit 메시지:
Use local assets for N260035 N260037 N260038 images
