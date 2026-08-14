# NICE 모델컷 워크플로우

마네킹컷·제품컷만 있는 상품을 실제 판매 가능한 모델 전신컷 후보로 확장하기 위한 테스트 시스템입니다. 목표는 예쁜 AI 이미지가 아니라 실제 상품과 최대한 일치하는 후보를 반복 가능하게 만들고 검수하는 것입니다.

이 시스템은 `modelcut-workflow-test` 브랜치에서만 작업합니다. `products.json`, `index.html`, `app.js`, `style.css`를 수정하지 않으며 승인 후보를 운영 쇼룸에 자동 반영하지 않습니다.

## 구조

```text
modelcut-workflow/
  config/                 상품 후보·매칭·프롬프트·검수 규칙
  input/raw/               원본 입력(비공개, Git 제외)
  input/normalized/        정규화 manifest(재생성 가능, Git 제외)
  refs/products/           실제 상품 참조 이미지(이미지만 Git 제외)
  refs/mood/               거래처·분위기 보조 참조(이미지만 Git 제외)
  output/drafts/           생성 초안(Git 제외)
  output/revised/          수정본(Git 제외)
  output/approved/         명시적으로 승인된 결과만 관리
  output/review_board/     HTML 검토판
  reports/csv/             기계 판독용 검수 보고서
  reports/markdown/        사람이 읽는 검수 보고서
  prompts/                 조합별 생성 프롬프트
  scripts/                 재현 가능한 파이프라인
  templates/               프롬프트·HTML 템플릿
```

## 빠른 실행

저장소 루트에서 Python 3.11 이상으로 실행합니다. 모든 스크립트는 표준 라이브러리만 사용합니다.

```powershell
python modelcut-workflow/scripts/build_manifest.py
python modelcut-workflow/scripts/generate_prompts.py
python modelcut-workflow/scripts/build_review_report.py
python modelcut-workflow/scripts/build_review_board.py
```

로컬의 Git 제외 이미지를 HTML에 연결하려면 마지막 명령에 옵션을 추가합니다.

```powershell
python modelcut-workflow/scripts/build_review_board.py --use-local-images
```

기본 검토판은 커밋과 공유가 가능하도록 이미지 자리표시자를 사용합니다.

## 입력 데이터

`config/candidate_items.json`은 상품 단위 작업 큐입니다. 각 항목은 다음 정보를 가집니다.

- `targetCode`, `targetName`, `targetType`
- `exclude`, `status`, `colorOptions`
- 실제 상품 `referenceImages`
- `matchCandidates`의 코드·유형·컬러·우선순위·참조 이미지
- 상품별 변경 금지 사항인 `guardrails`

S944는 명시적으로 제외됩니다. S945와 S946은 단품 스커트이며 상의 조합 확정 전까지 보류합니다.

## 매칭

`config/match_rules.json`의 검색 순서는 다음과 같습니다.

1. `code` 정확히 일치
2. `vendorCode` 일치
3. 상품명·태그에 품번 포함

S799/S800은 `TIA-S799`/`TIA-S800`으로 등록된 경우를 고려해 양쪽 코드를 별칭으로 처리합니다. manifest 생성은 루트 `products.json`을 읽기만 하며 수정하지 않습니다.

## 프롬프트

`generate_prompts.py`가 활성 조합별 TXT를 만듭니다. 모든 프롬프트에는 다음 원칙이 포함됩니다.

- `Prioritize product accuracy over beauty or mood.`
- `Prioritize exact product matching over beauty or mood.`
- `Do not invent new colors.`
- `Do not simplify or replace the actual skirt silhouette.`
- `Do not invent new colors, decorations, silhouette changes, or fabric details.`
- `Use the real product images as the primary reference.`

실제 제품컷이 최우선이며 거래처 이미지는 착용 비율과 원단 반응을 확인하는 보조 자료일 뿐입니다. 거래처 모델·포즈·배경은 복제하지 않습니다. 실제 reference가 확정되지 않은 `reference 재선정` 항목은 프롬프트와 model draft를 생성하지 않습니다.

## 검수 보고서

`build_review_report.py`는 `config/review_results.sample.json` 형식의 입력을 검증한 뒤 다음 파일을 만듭니다.

- `reports/csv/modelcut_quality_review.csv`
- `reports/markdown/modelcut_quality_review.md`

상의와 하의를 각각 컬러, 기장, 실루엣, 디테일, 원단으로 검증하며 값은 `O`, `△`, `X`만 허용합니다. 현실감은 1~5점입니다. `△`와 `X`는 메모로 수정 이유를 남깁니다. 어느 항목이든 `X`이면 승인 후보가 될 수 없으며 상태는 `재생성` 또는 `reference 재선정`이어야 합니다.

현재 재작업 게이트는 다음과 같습니다.

- `S940_S729_vendorref_01`: S729 스커트를 블랙으로 고정하여 재생성
- `S941_N260007_model_draft_01`: 핑크 하의 후보 폐기, 블랙 튤/샤 스커트로 재생성
- `S942_TIA-S799_vendorref_01`: 기존 reference 탈락, 실제 하의 reference 재선정 전 model draft 생성 금지

## 검토판

`build_review_board.py`는 실제 상의·실제 하의·생성 후보와 검수 상태를 한 카드에 표시합니다. 기본 HTML은 이미지가 없어도 동작하는 자리표시자 구조입니다. 로컬 검수 시에만 `--use-local-images`로 Git 제외 파일을 연결합니다.

## Git 운영 원칙

- 작업 브랜치: `modelcut-workflow-test`
- 원본 이미지, drafts, revised, 임시 파일은 추적하지 않습니다.
- 설정, 스크립트, 템플릿, README, 샘플 CSV/Markdown/HTML은 추적합니다.
- `output/approved/`에는 별도 명시적 승인을 받은 최종본만 둡니다.
- 운영 쇼룸 핵심 파일과 main 브랜치는 이 워크플로우에서 수정하지 않습니다.

## 향후 확장

- 업로드 폴더 자동 분류와 상품코드 인식
- 제품정보 기반 프롬프트 자동 보강
- 이미지 생성 제공자 어댑터와 작업 큐
- 검수 점수 기반 수정·승인 후보 추천
- 승인 산출물을 쇼룸 반영 단계에 안전하게 넘기는 별도 승인 게이트
- 멀티테넌트 저장소와 사용자 권한을 갖춘 SaaS 구조
