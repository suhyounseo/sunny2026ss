from __future__ import annotations

from typing import Any


SPECIAL_RULES = {
    "S939": [
        "하의 길이가 실제 제품보다 길어지지 않게 하고 실제 미니 기장을 유지한다.",
        "N260195 하의는 실제 화이트/아이보리 계열 컬러만 사용한다.",
    ],
    "S941": [
        "핑크 하의 생성 금지. N260007은 실제 블랙 하의만 사용한다.",
        "상의의 오프숄더 프릴과 리본 구조를 실제 사진 그대로 보존한다.",
    ],
    "S943": [
        "그레이 또는 소라 계열 생성 금지. 실제 블랙+화이트 조합만 사용한다.",
        "가슴 배색 라인과 코르셋 구조를 실제 사진 그대로 보존한다.",
    ],
}


class GenerationBlockedError(ValueError):
    pass


def validate_job_policy(payload: dict[str, Any]) -> None:
    if payload.get("topCode", "").upper() == "S942" and not payload.get("referenceApproved", False):
        raise GenerationBlockedError(
            "S942는 실제 TIA-S799 reference 재선정과 확인이 필요합니다. 고급 설정에서 reference 확인 완료 후 다시 실행하세요."
        )


def enrich_prompt(prompt: str, payload: dict[str, Any], regeneration_memo: str = "") -> str:
    top_code = payload.get("topCode", "").upper()
    rules = SPECIAL_RULES.get(top_code, [])
    allowed = payload.get("allowedColors") or []
    additions = [
        "[서버 강제 상품 일치 규칙]",
        "업로드된 실제 상의와 하의 제품 사진이 유일한 상품 진실 소스다.",
        "참고 이미지는 포즈와 스튜디오 분위기만 참고하며 상품 구조의 근거로 사용하지 않는다.",
        "실제에 없는 컬러, 디테일, 장식, 길이 변경을 금지한다.",
        "전신 정면 구도, 심플한 아이보리/화이트 스튜디오, 상품보다 튀지 않는 깔끔한 신발을 사용한다.",
        "과도한 배경 장식을 금지한다.",
        *rules,
    ]
    if allowed:
        additions.append(f"허용 컬러는 {', '.join(map(str, allowed))}뿐이며 그 외 컬러는 생성하지 않는다.")
    if regeneration_memo:
        additions.extend(["", "[재생성 메모 — 반드시 수정]", regeneration_memo])
    return f"{prompt.strip()}\n\n" + "\n".join(additions)
