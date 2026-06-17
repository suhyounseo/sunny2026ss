# AI 이미지 생성 작업 체크리스트

- 총 상품 수: 55
- 총 이미지 생성 작업 수: 275
- 상품당 생성할 이미지 수: 5
- 원본 이미지 사용 금지: source_files는 참고 기록이며 쇼룸/스마트스토어 업로드 이미지로 사용하지 않습니다.
- 현재 상태: 모든 이미지 작업은 `need_generation`, 모든 `upload_allowed` 값은 `false`입니다.

## 생성 후 검수 기준

- 원본과 같은 모델이면 탈락
- 원본과 같은 포즈이면 탈락
- 원본과 같은 배경이면 탈락
- 원본 워터마크/로고/텍스트가 있으면 탈락
- 옷 디테일이 너무 달라지면 재생성
- 손/얼굴/몸 비율이 이상하면 재생성
- 상품 디테일이 잘 보이지 않으면 재생성

## 샘플 상품 10개 작업 목록

| 상품 ID | 상품명 | 생성 작업 | 예정 이미지 경로 |
|---|---|---|---|
| HH-001 | 세린 민트 탑 | main, fullbody, back, top_closeup, detail | generated_images/HH-001/HH-001_main.jpg<br>generated_images/HH-001/HH-001_fullbody.jpg<br>generated_images/HH-001/HH-001_back.jpg<br>generated_images/HH-001/HH-001_top_closeup.jpg<br>generated_images/HH-001/HH-001_detail.jpg |
| HH-002 | 로아 그레이 블라우스 | main, fullbody, back, top_closeup, detail | generated_images/HH-002/HH-002_main.jpg<br>generated_images/HH-002/HH-002_fullbody.jpg<br>generated_images/HH-002/HH-002_back.jpg<br>generated_images/HH-002/HH-002_top_closeup.jpg<br>generated_images/HH-002/HH-002_detail.jpg |
| HH-003 | 엘린 화이트 블라우스 | main, fullbody, back, top_closeup, detail | generated_images/HH-003/HH-003_main.jpg<br>generated_images/HH-003/HH-003_fullbody.jpg<br>generated_images/HH-003/HH-003_back.jpg<br>generated_images/HH-003/HH-003_top_closeup.jpg<br>generated_images/HH-003/HH-003_detail.jpg |
| HH-004 | 뮤즈 블랙 블라우스 | main, fullbody, back, top_closeup, detail | generated_images/HH-004/HH-004_main.jpg<br>generated_images/HH-004/HH-004_fullbody.jpg<br>generated_images/HH-004/HH-004_back.jpg<br>generated_images/HH-004/HH-004_top_closeup.jpg<br>generated_images/HH-004/HH-004_detail.jpg |
| HH-005 | 아린 화이트 리본 블라우스 | main, fullbody, back, top_closeup, detail | generated_images/HH-005/HH-005_main.jpg<br>generated_images/HH-005/HH-005_fullbody.jpg<br>generated_images/HH-005/HH-005_back.jpg<br>generated_images/HH-005/HH-005_top_closeup.jpg<br>generated_images/HH-005/HH-005_detail.jpg |
| HH-006 | 리엘 블랙 레오파드 패턴 탑 | main, fullbody, back, top_closeup, detail | generated_images/HH-006/HH-006_main.jpg<br>generated_images/HH-006/HH-006_fullbody.jpg<br>generated_images/HH-006/HH-006_back.jpg<br>generated_images/HH-006/HH-006_top_closeup.jpg<br>generated_images/HH-006/HH-006_detail.jpg |
| HH-007 | 모아 그레이 레이스 탑 | main, fullbody, back, top_closeup, detail | generated_images/HH-007/HH-007_main.jpg<br>generated_images/HH-007/HH-007_fullbody.jpg<br>generated_images/HH-007/HH-007_back.jpg<br>generated_images/HH-007/HH-007_top_closeup.jpg<br>generated_images/HH-007/HH-007_detail.jpg |
| HH-008 | 셀린 그레이 블라우스 | main, fullbody, back, top_closeup, detail | generated_images/HH-008/HH-008_main.jpg<br>generated_images/HH-008/HH-008_fullbody.jpg<br>generated_images/HH-008/HH-008_back.jpg<br>generated_images/HH-008/HH-008_top_closeup.jpg<br>generated_images/HH-008/HH-008_detail.jpg |
| HH-009 | 유나 그레이 슬림핏 원피스 | main, fullbody, back, top_closeup, detail | generated_images/HH-009/HH-009_main.jpg<br>generated_images/HH-009/HH-009_fullbody.jpg<br>generated_images/HH-009/HH-009_back.jpg<br>generated_images/HH-009/HH-009_top_closeup.jpg<br>generated_images/HH-009/HH-009_detail.jpg |
| HH-010 | 라비 민트 슬림핏 원피스 | main, fullbody, back, top_closeup, detail | generated_images/HH-010/HH-010_main.jpg<br>generated_images/HH-010/HH-010_fullbody.jpg<br>generated_images/HH-010/HH-010_back.jpg<br>generated_images/HH-010/HH-010_top_closeup.jpg<br>generated_images/HH-010/HH-010_detail.jpg |
