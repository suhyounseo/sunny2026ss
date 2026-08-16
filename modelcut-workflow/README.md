# NICE 모델컷 multi-image 워크플로우

실제 상의·하의 사진을 여러 장 대조해 상품 일치도 중심의 모델컷 후보를 준비하고 검토하는 독립 테스트 시스템입니다. 분위기보다 컬러, 기장, 실루엣, 디테일, 원단 일치를 우선합니다.

이 MVP는 `modelcut-workflow-test` 브랜치용입니다. 루트 쇼룸의 `products.json`, `index.html`, `app.js`, `style.css`를 수정하지 않으며, 승인 결과를 운영 쇼룸에 자동 반영하지 않습니다. 로컬 FastAPI 서버와 OpenAI 이미지 provider를 통해 생성·상태 조회·자동 후보 연결·재생성을 실행합니다.

## 폴더 구조

```text
modelcut-workflow/
  input/
    tops/                  상의 원본 드롭 폴더(내용 Git 제외)
    bottoms/               하의 원본 드롭 폴더(내용 Git 제외)
    references/            분위기 참고 드롭 폴더(내용 Git 제외)
  data/
    input_items.sample.json  multi-image 입력 예시 5건
    review_items.json        분석·검토판 공통 데이터
  config/
    workflow_settings.json   이미지/후보 수 제한과 참조 정책
    review_rules.json        5개 검수 항목과 승인/hard fail 규칙
    review_state.json        CLI로 저장한 승인 상태(생성 시 유지)
  output/
    analysis/              검증된 입력과 상품 분석 계약
    drafts/                생성 후보 원본(Git 제외)
    review_board/index.html 실제 카드가 삽입된 로컬 검토판
    approved/              명시적으로 승인된 결과만 이동
  templates/
    review_board_template.html  원본 템플릿
  server/
    app.py                  FastAPI 작업·생성·상태·후보 API
    image_provider.py       교체 가능한 OpenAI/test provider
    storage.py              작업별 입력·요청·후보·로그 저장
    schemas.py              API 데이터 계약
    settings.py             .env 기반 서버 설정
    requirements.txt        로컬 서버 의존성
  tools/
    modelcut_workflow.py    입력 검증·검토 상태 저장
    generate_analysis.py    생성 전 상품 분석
    build_review_board.py   카드 삽입 HTML 생성

modelcut-demo/
  index.html               샘플+사용자 작업 통합 검토판
  review.js                검토판 렌더링·상태 저장
  admin.html               새 작업 입력·편집 관리자 화면
  admin.js                 분석·프롬프트·이미지 입력 로직
  job-store.js             IndexedDB 공통 작업 저장소
  assets/                  검토에 필요한 축소 WebP만 추적
  data/review_items.json   썸네일 경로로 변환한 배포 데이터
```

## 브라우저 관리자 사용 흐름

로컬 HTTP 서버를 실행한 뒤 관리자 화면을 엽니다.

```text
http://127.0.0.1:8765/modelcut-demo/admin.html
```

사용 순서는 다음과 같습니다.

1. `admin.html`을 열고 작업 ID, 상의 코드, 하의 코드를 입력합니다.
2. 실제 상의 3~5장과 실제 하의 3~5장을 올리고 각 이미지에 정면·후면·디테일·원단 역할을 지정합니다. 포즈·배경·거래처 분위기 참고 이미지는 선택 사항입니다.
3. `상품 분석 만들기`를 누릅니다. 상품명·컬러·소재·디테일·기장·실루엣·보존/금지 요소는 선택 입력 안에 있으며 비어 있는 값은 실제 사진 기준 문구로 채워집니다.
4. `모델컷 생성 요청 만들기`를 눌러 역할 기반 실전 프롬프트와 생성 요청 패키지를 준비합니다.
5. `모델컷 생성 실행`을 누릅니다. 로컬 API가 상의 최대 3장, 하의 최대 3장, 참고 최대 2장을 실제 생성 provider에 전달합니다.
6. 대기중 → 생성중 → 완료/실패 상태와 후보별 진행률을 확인합니다. 완료 후보 1~3장은 관리자 미리보기와 IndexedDB에 자동 연결됩니다. 수동 업로드는 외부 결과를 가져올 때의 보조 경로입니다.
7. `작업 저장하기`를 눌러 생성 요청과 결과를 브라우저 IndexedDB와 `output/generation_jobs/<jobId>/`에 함께 저장합니다.
8. `검토판에서 확인하기`를 눌러 실제 제품 입력 → 생성 요청 요약 → 생성 결과 후보 → 검수 상태를 한 카드에서 확인합니다.
9. 검토판에서 상태, O/△/X 점수, 승인 체크, 승인/보류 메모, 재생성 메모를 입력합니다.
10. 검토판의 기존 샘플 10건은 기본으로 숨겨집니다. 테스트할 때만 `샘플 데이터 불러오기`를 누릅니다.

작업 JSON은 관리자 화면의 “작업 JSON 불러오기”로 다시 복원할 수 있습니다. 동일한 작업 ID가 있으면 해당 작업을 최신 가져오기 데이터로 갱신합니다.

생성 요청 패키지의 역할은 다음과 같습니다.

- `generation_prompt.txt`: 상품 일치도·역할별 보존 지시·정면 전신 출력 조건을 담은 실전 프롬프트
- `generation_request.json`: 작업 코드, 이미지 파일 목록, 상품 분석, `generationInstruction`을 담은 API 연결용 계약
- `reference_images_manifest.json`: 원본 이미지 파일명·역할·형식·크기·순서와 역할별 사용 지시

다운로드용 요청 JSON에는 이미지 manifest를 담고, 서버 전송 계약에는 실제 이미지 data URL을 포함합니다. 서버는 이를 파일로 분리 저장하고 `request.json`에는 대용량 원문 대신 상대 경로를 기록합니다. 현재 계약은 `schemaVersion: 3`입니다.

브라우저 작업은 IndexedDB에, 생성 작업은 로컬 파일 시스템에도 저장됩니다. IndexedDB는 현재 브라우저·도메인에 종속되므로 JSON 내보내기로 별도 백업할 수 있습니다. API 키는 프론트 코드나 JSON에 넣지 않고 서버의 `.env`에서만 읽습니다.

## 입력 형식

`data/input_items.sample.json`을 복사해 작업 파일로 사용합니다. 조합마다 다음을 입력합니다.

- 실제 상의 이미지 `topImages`: 정면·디테일·측면/후면·원단 등 최대 5장
- 실제 하의 이미지 `bottomImages`: 최대 5장
- 분위기/거래처 이미지 `referenceImages`: 최대 3장
- 상·하의 코드, 상품명, 실제 컬러
- 상·하의별 실제 허용 컬러 `allowedColors`(입력 컬러가 목록 밖이면 prepare 중단)
- 상·하의 기장·실루엣·디테일, 원단 키워드
- 반드시 보존할 요소 `mustPreserve`, 생성 금지 요소 `avoidList`
- 생성 후보 수 `candidateCount`: 1~3

거래처 이미지는 포즈·분위기만 참고합니다. 상품 컬러, 구조, 프릴, 리본, 컵라인, 허리선, 원단의 근거는 실제 제품 사진이어야 합니다.

샘플에는 S939의 과도한 스커트 연장, S941의 핑크 하의, S942의 잘못된 하의 reference, S943의 없는 그레이/소라 톤을 금지 규칙으로 포함했습니다. S942는 실제 reference 승인 전 생성 차단 상태입니다.

## 로컬 생성 서버 실행

Python 3.11 이상에서 별도 가상환경을 권장합니다. `modelcut-workflow/.env.example`을 `.env`로 복사하고 `OPENAI_API_KEY`에 로컬 키를 입력합니다. `.env`와 생성 원본은 Git에서 제외됩니다.

```powershell
cd modelcut-workflow
python -m venv .venv
.\.venv\Scripts\python -m pip install -r server\requirements.txt
Copy-Item server\.env.example .env
# .env의 OPENAI_API_KEY를 입력
.\.venv\Scripts\python server\app.py
```

또는 같은 환경에서 다음 명령을 사용할 수 있습니다.

```powershell
uvicorn server.app:app --reload --host 127.0.0.1 --port 8787
```

서버 기본 주소는 `http://127.0.0.1:8787`입니다. API는 작업 저장/조회/목록/삭제, 생성, 상태, 재생성, 후보 조회를 제공합니다. 기본 provider는 `openai`, 모델은 `gpt-image-2`입니다. 생성 호출마다 상의 정면·디테일·후면/원단 우선 최대 3장, 하의 최대 3장, 포즈·배경 참고 최대 2장만 선택합니다.

실제 API 비용 없이 배관만 점검하려면 `.env`에서 `MODELCUT_PROVIDER=test`를 사용할 수 있습니다. 이 공급자는 결과 전면에 `MODELCUT TEST PROVIDER / DIAGNOSTIC ONLY`를 표시하는 입력 접촉판만 만들며 실제 모델컷이나 승인 후보가 아닙니다.

작업별 파일은 다음 위치에 저장됩니다.

```text
output/generation_jobs/<jobId>/
  request.json
  prompt.txt
  manifest.json
  inputs/tops/
  inputs/bottoms/
  inputs/references/
  generated/candidate_01.png ... candidate_03.png
  logs/generation_log.json
```

## 정적 화면 실행

Python 3.11 이상과 데모 썸네일 생성용 Pillow가 필요합니다. 저장소 루트에서 먼저 워크플로우 폴더로 이동합니다.

```powershell
cd modelcut-workflow
python tools/modelcut_workflow.py prepare
python tools/generate_analysis.py
python tools/build_review_board.py
python scripts/build_demo.py
cd ..
python -m http.server 8765 --bind 127.0.0.1
```

브라우저에서 다음 주소를 엽니다.

- 로컬 결과: `http://127.0.0.1:8765/modelcut-workflow/output/review_board/`
- GitHub Pages 테스트 묶음: `http://127.0.0.1:8765/modelcut-demo/`
- 새 작업 관리자: `http://127.0.0.1:8765/modelcut-demo/admin.html`

`templates/review_board_template.html`을 직접 열면 `{{CARDS}}` 플레이스홀더가 보이는 것이 정상입니다. 사용자는 템플릿이 아니라 반드시 빌드 결과인 `output/review_board/index.html`을 열어야 합니다.

## 5단계 운영

1. 입력: 실제 상의 최대 5장, 실제 하의 최대 5장, 포즈·배경 참고 최대 3장에 역할을 지정합니다.
2. 상품 분석: 컬러·기장·실루엣·디테일·원단·필수 보존·금지 목록을 생성합니다.
3. 생성 요청·실행: 세 요청 파일을 만들고 로컬 API에 원본 이미지·분석·프롬프트를 전송합니다.
4. 결과 확인: 후보 1~3장이 자동 미리보기에 채워집니다. 필요하면 외부 결과를 수동 업로드할 수도 있습니다.
5. 검토·재생성: 생성 전 제품/참고 이미지, 요청 요약, 생성 후보를 대조하고 상태·점수·승인/보류 메모를 저장합니다. 재생성 메모는 기존 입력·분석과 함께 서버 프롬프트에 강제 추가됩니다.

정적 페이지의 변경값은 해당 브라우저의 `localStorage`에 저장됩니다. “검토 상태 JSON 내보내기”로 공유 가능한 파일을 받습니다. 저장소 데이터에 명시적으로 반영할 때는 다음 CLI를 사용합니다.

```powershell
python tools/modelcut_workflow.py review --candidate-id S941_N260007_model_draft_03 --status "조건부 승인" --approved false --regeneration-memo "프릴 폭과 튤 레이어 재보정"
```

## 승인 규칙

- 5개 항목 중 4개 이상 O: 승인 후보
- 3개 O이고 hard fail 없음: 조건부 승인 후보
- 실제에 없는 컬러·기장, 상품 종류 변경, 큰 장식 임의 추가, 핵심 디테일 누락: 즉시 반려
- S942처럼 실제 reference가 잘못된 경우: 모델컷 생성을 멈추고 `reference 재선정`

`approved` 체크는 검토 기록일 뿐 운영 반영 승인이 아닙니다. 운영 쇼룸 반영은 main 병합 이후 별도 승인 절차에서만 수행합니다.

## GitHub Pages 테스트

`modelcut-demo/`만으로 정적 배포가 가능합니다. 테스트 브랜치를 별도 테스트 저장소나 fork에 push하고 Pages 소스를 해당 브랜치의 루트로 지정한 뒤 아래 경로를 엽니다.

```text
https://<account>.github.io/<repository>/modelcut-demo/
```

운영 Pages의 배포 브랜치를 테스트 브랜치로 바꾸지 마세요. 원본·대량 이미지는 Git에서 제외하며 `scripts/build_demo.py`가 만든 최소 WebP 썸네일만 추적합니다.

## 승인 산출물 경로

검토 완료 후 승인된 이미지 원본은 사람이 확인한 뒤 `output/approved/`에 별도로 배치합니다. 이 폴더의 파일도 쇼룸 자동 반영 대상이 아니며, `products.json` 수정은 이 워크플로우 범위 밖입니다.

## MVP 테스트 체크 결과

테스트 일자: 2026-08-15

테스트 주소: `http://127.0.0.1:8765/modelcut-demo/`

| 항목 | 결과 | 확인 내용 |
|---|---|---|
| 검토 카드 10개 표시 | 통과 | 브라우저 DOM에서 `article.card` 10개 렌더링 확인 |
| 상의·하의 다중 이미지 | 통과 | 10개 카드 모두 상의·하의 각각 2장 이상 연결, 렌더링된 상의 24장·하의 24장 확인 |
| 상태·승인·메모 저장 | 통과 | 상태를 `승인`으로 변경하고 승인 체크, 검토 메모, 재생성 메모를 입력한 뒤 저장 확인 |
| 새로고침 후 유지 | 통과 | 페이지 새로고침 후 변경 상태·승인 체크·두 메모가 동일하게 복원됨 |
| JSON 내보내기·불러오기 | 통과 | 내려받은 `modelcut_review_state.json`의 `schemaVersion: 1`과 상태 10건을 확인하고, 테스트 JSON을 불러와 상태·점수·두 메모 복원 확인 |
| S942 승인 차단 | 통과 | S942 두 카드는 `reference 재선정`으로 시작하며 최종 승인 체크가 비활성화됨. 상태를 `승인`으로 바꾸려는 경우 즉시 `반려`로 교정됨 |
| 쇼룸 운영 파일 보호 | 통과 | 이번 MVP 변경 내역에 루트 `products.json`, `index.html`, `app.js`, `style.css`가 포함되지 않음을 확인 |

추가 확인:

- 검토판과 JSON 요청은 로컬 HTTP 서버에서 HTTP 200으로 응답합니다.
- 생성 후보 이미지 파일이 아직 없는 슬롯은 오류 이미지 대신 `이미지 연결 대기`로 표시됩니다.
- 검토 상태는 브라우저별 `localStorage`에 저장되므로 다른 브라우저나 기기로 옮길 때는 JSON 내보내기·불러오기를 사용합니다.

## 입력형 관리자 MVP 테스트 결과 (이전 단계 기록)

테스트 일자: 2026-08-15

| 항목 | 결과 | 확인 내용 |
|---|---|---|
| 신규 작업 입력 | 통과 | `MVP_ADMIN_TEST_01` 작업에 코드·상품명·컬러·소재·디테일·기장·실루엣·보존/금지 요소 입력 |
| 다중 이미지·미리보기 | 통과 | 상의 2장·하의 2장·참고 1장·생성 후보 1장을 선택하고 역할별 미리보기 확인 |
| 이미지 제한 | 통과 | 참고 이미지가 추가 선택 후에도 최대 3장으로 제한됨을 확인 |
| 분석 자동 생성·수정 | 통과 | 입력값이 11개 분석 필드에 자동 반영되고 `topColor` 직접 수정값이 프롬프트에 유지됨 |
| 프롬프트 자동 생성 | 통과 | 실제 사진 우선, 없는 컬러/디테일 금지, 기장/실루엣 유지, 참고 이미지 용도 제한, 상품 일치도 우선 원칙 확인 |
| 프롬프트 TXT | 통과 | `MVP_ADMIN_TEST_01_prompt.txt` 다운로드 및 필수 원칙 포함 확인 |
| IndexedDB 저장·편집 | 통과 | 새로고침 후 작업, 이미지 역할, 분석 수정값, 프롬프트가 복원되고 편집 가능함을 확인 |
| 검토판 즉시 반영 | 통과 | 샘플 10개에 사용자 후보 1개가 추가되어 전체 11카드로 렌더링됨 |
| 사용자 작업 상태 관리 | 통과 | 승인 후보·승인 체크·두 메모 저장 후 새로고침 복원 확인 |
| 작업 JSON 이동 | 통과 | `modelcut_jobs_export.json`에 작업 1건과 이미지 6장·프롬프트를 확인하고 동일 JSON 재불러오기 성공 |
| 브라우저 오류 | 통과 | 관리자와 통합 검토판 콘솔 오류 0건 |

## Admin 단순화 UI 테스트 결과 (이전 단계 기록)

테스트 일자: 2026-08-15

| 항목 | 결과 | 확인 내용 |
|---|---|---|
| 기본 입력 단순화 | 통과 | 첫 화면에는 작업 ID, 상의 코드, 하의 코드 3개만 표시되고 나머지 상품 정보는 닫힌 선택 입력에 배치 |
| 단계 안내 | 통과 | 이미지 입력부터 저장·검토판 확인까지 5단계 버튼을 화면에 표시 |
| 다중 이미지 미리보기 | 통과 | 상의·하의·생성 모델컷 후보 업로드 직후 역할 선택이 포함된 미리보기 표시 |
| 후보 이미지 필수 확인 | 통과 | 상의·하의·생성 모델컷 후보 중 하나라도 없으면 누락 항목을 안내하고 저장 차단 |
| 자동 분석 | 통과 | 고급 설정을 열지 않아도 소재, 디테일, 기장, 실루엣, mustPreserve, avoidList 자동 입력 확인 |
| 프롬프트 생성·복사 | 통과 | 상품 일치도 우선, 없는 컬러 금지, 기장 유지, 디테일 보존 원칙과 복사 완료 안내 확인 |
| 필수값 검증 | 통과 | 작업 ID·코드·상품명·컬러·상의/하의 이미지 중 빠진 항목을 한국어 오류 메시지로 안내 |
| 저장 피드백 | 통과 | `저장 완료: 작업이 브라우저에 저장되었습니다. 검토판에서 확인할 수 있습니다.` 알림과 오른쪽 작업 카드 즉시 표시 |
| 검토판 연결 | 통과 | `ADMIN_SIMPLE_V2` 저장 완료 링크가 해당 카드로 이동하고 사용자 작업 중 맨 위 렌더링 확인 |
| 샘플 기본 숨김 | 통과 | 검토판 기본 화면에는 저장 작업만 표시되고 샘플 10건은 별도 버튼을 눌렀을 때만 뒤에 추가 |
| JSON 원문 숨김 | 통과 | 상품 분석을 읽기 쉬운 한글 항목으로 표시하고 JSON 원문은 화면에 노출하지 않음 |
| 저장 작업 관리 | 통과 | 카드에 작업 ID, 상·하의 코드, 상태, 검토판 보기, 삭제 기능 표시 |
| 쇼룸 운영 파일 보호 | 통과 | 루트 `products.json`, `index.html`, `app.js`, `style.css`를 수정하지 않음 |

## 모델컷 생성 요청 워크플로우 테스트 결과

테스트 일자: 2026-08-15

테스트 작업: `GENERATION_FLOW_MVP` (`S939` + `TIA-S859`)

| 항목 | 결과 | 확인 내용 |
|---|---|---|
| 5단계 제작 흐름 | 통과 | 제품 이미지 → 상품 분석 → 생성 요청 → 결과 업로드 → 검토판 순서와 버튼 문구 확인 |
| 상의·하의 다중 이미지 | 통과 | 상의 3장, 하의 3장 업로드 후 즉시 미리보기 표시 |
| 이미지 역할 지정 | 통과 | 상의·하의 각각 정면·후면·디테일, 참고 이미지 `포즈 참고` 역할 지정 확인 |
| 역할 기반 프롬프트 | 통과 | `[역할]`, `[입력 이미지]`, `[이미지 역할별 보존 지시]`, `[가장 중요한 원칙]`, `[출력]` 구조 확인 |
| 생성 요청 파일 | 통과 | `generation_prompt.txt`, `generation_request.json`, `reference_images_manifest.json` 생성·다운로드 버튼과 고정 파일명 확인 |
| 요청 JSON 계약 | 통과 | 작업 코드, 상의·하의·참고 이미지 manifest, 빈 `candidateImages`, 상품 분석, `generationInstruction` 포함 |
| 생성 결과 재업로드 | 통과 | 결과 2장 업로드 후 `후보 1`, `후보 2` 역할 자동 지정 |
| 작업 저장 | 통과 | 상태 `후보 검토`로 IndexedDB 저장 후 오른쪽 작업 목록에 즉시 표시 |
| 생성 전후 검토 카드 | 통과 | 실제 상의 3장·하의 3장, 요청 요약, 결과 후보 2장을 한 카드에 순서대로 표시 |
| 검토 메모 유지 | 통과 | 상태 `보류`, 승인/보류 메모, 재생성 메모 입력 후 새로고침 복원 확인 |
| 샘플 기본 숨김 | 통과 | 사용자 작업이 먼저 표시되며 기존 샘플은 별도 버튼을 누를 때만 표시 |
| 쇼룸 운영 파일 보호 | 통과 | 루트 `products.json`, `index.html`, `app.js`, `style.css`를 수정하지 않음 |

## 로컬 생성 실행 시스템 테스트 결과

테스트 일자: 2026-08-16

실행 명령:

```powershell
cd modelcut-workflow
python -m server.test_mvp
```

| 항목 | 결과 | 확인 내용 |
|---|---|---|
| S939 + N260195 | 진단 통과 | 요청/입력/강제 규칙 저장, 흰색 계열·미니 기장 규칙 포함, 후보 파일·로그 생성 |
| S941 + N260007 | 진단 통과 | 핑크 하의 금지, 블랙 하의·오프숄더 프릴/리본 보존 규칙 포함, 후보 파일·로그 생성 |
| S943 + TIA-S800 | 진단 통과 | 그레이/소라 금지, 블랙+화이트·가슴 배색 라인 보존 규칙 포함, 후보 파일·로그 생성 |
| S942 reference 차단 | 통과 | `referenceApproved=false`인 경우 생성 전 `GenerationBlockedError` 발생 확인 |
| 생성 provider 배관 | 통과 | 입력 저장 → 우선 참조 선택 → 후보 생성 → 진행 로그 → 후보 조회 구조 확인 |
| 실제 OpenAI 생성 | 환경 대기 | 현재 실행 환경에 `OPENAI_API_KEY`가 없어 유료 실제 후보 호출은 수행하지 않음. 키와 서버 의존성 설치 후 동일 버튼/API 경로로 실행 가능 |
| 쇼룸 운영 파일 보호 | 통과 | Git 변경 목록에 루트 `products.json`, `index.html`, `app.js`, `style.css` 없음 |

진단 테스트의 후보 이미지는 의도적으로 큰 워터마크가 들어간 접촉판이며 상품 모델컷으로 사용할 수 없습니다. 실제 결과 품질 검증과 세 조합의 상품 일치도 판정은 OpenAI provider 실행 후 사람 검수로 완료해야 합니다.
