# NICE 모델컷 워크플로

제품컷·마네킹컷과 기존 쇼룸 상품 이미지를 조합해 검토용 모델컷을 준비하는 반자동 시스템입니다. 초안은 자동으로 쇼룸에 게시되지 않으며, 승인된 이미지만 별도 미리보기 JSON으로 반영합니다.

## 이번 배치

- 1차 생성: S939, S940, S941, S942, S943
- 보류: S945, S946 (상의 확정 필요)
- 제외: S944
- 운영 원칙: 제품정보 이미지·거래처·매입정보 등 내부 자료는 고객 화면에 노출하지 않음

## 사용법

프로젝트 루트에서 번들 Python 또는 Python 3.11 이상으로 실행합니다.

```powershell
python tools/modelcut_workflow.py prepare --archive "C:\path\8월 11일 제품이미지.zip"
python tools/modelcut_workflow.py approve --image "modelcut-workflow\output\drafts\S939_N260195_model_draft_01.png" --memo "사장님 승인"
python tools/modelcut_workflow.py apply --confirm APPROVED_ONLY
```

`prepare`는 입력 이미지, 쇼룸 참조 이미지, 조합별 프롬프트, CSV 보고서, 참조 보드를 만듭니다. `approve`는 검토된 초안만 `output/approved`로 복사합니다. `apply`는 원본 `products.json`을 직접 수정하지 않고 `output/products.approved-preview.json`을 만들며, 기존 제품컷을 유지한 채 승인 모델컷을 `cuts` 첫 번째에 넣습니다.

## 이미지 생성

`config/generation_jobs.json`의 각 작업에 적힌 참조 보드와 프롬프트를 사용합니다. 결과는 지정된 `output/drafts` 파일명으로 저장하고, 의상 색상·디자인·인체 비율·AI 느낌을 검수한 뒤에만 승인합니다.
