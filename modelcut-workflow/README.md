# NICE 모델컷 multi-image 워크플로우

실제 상의·하의 사진을 여러 장 대조해 상품 일치도 중심의 모델컷 후보를 준비하고 검토하는 독립 테스트 시스템입니다. 분위기보다 컬러, 기장, 실루엣, 디테일, 원단 일치를 우선합니다.

이 MVP는 `modelcut-workflow-test` 브랜치용입니다. 루트 쇼룸의 `products.json`, `index.html`, `app.js`, `style.css`를 읽거나 수정하지 않으며, 승인 결과를 운영 쇼룸에 자동 반영하지 않습니다. 실제 AI 이미지 생성과 재생성 API 연결은 2단계 범위입니다.

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
  tools/
    modelcut_workflow.py    입력 검증·검토 상태 저장
    generate_analysis.py    생성 전 상품 분석
    build_review_board.py   카드 삽입 HTML 생성

modelcut-demo/
  index.html               GitHub Pages용 정적 검토판
  assets/                  검토에 필요한 축소 WebP만 추적
  data/review_items.json   썸네일 경로로 변환한 배포 데이터
```

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

## 실행

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

`templates/review_board_template.html`을 직접 열면 `{{CARDS}}` 플레이스홀더가 보이는 것이 정상입니다. 사용자는 템플릿이 아니라 반드시 빌드 결과인 `output/review_board/index.html`을 열어야 합니다.

## 5단계 운영

1. 입력: 실제 상의 최대 5장, 실제 하의 최대 5장, 분위기 참고 최대 3장과 상품 메타데이터를 JSON에 등록합니다.
2. 상품 분석: `generate_analysis.py`가 컬러·기장·실루엣·디테일·원단·필수 보존·금지 목록을 생성합니다. 검토판의 분석 패널에서 보완할 수 있습니다.
3. 생성: `output/drafts/`에 조합당 1~3개 후보를 연결합니다. MVP에서는 외부 생성 API를 자동 호출하지 않습니다.
4. 검토: 실제 상의·하의의 여러 컷과 후보를 나란히 보고 `colorMatch`, `lengthMatch`, `detailMatch`, `fabricMatch`, `silhouetteMatch`를 O/△/X로 평가합니다.
5. 승인 관리: 상태, 최종 승인 체크, 검토 메모, 재생성 메모를 관리합니다.

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
