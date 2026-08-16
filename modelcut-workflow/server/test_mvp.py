"""Credential-free integration smoke test for storage, rules and provider plumbing.

The test provider produces visibly labelled diagnostic contact sheets. It does not
claim to generate sellable model cuts; real generation requires OPENAI_API_KEY.
"""
from __future__ import annotations

import base64
import os
from pathlib import Path

os.environ["MODELCUT_PROVIDER"] = "test"

from server.image_provider import get_provider
from server.rules import GenerationBlockedError, enrich_prompt, validate_job_policy
from server.storage import clear_candidates, job_dir, save_job, write_log


ROOT = Path(__file__).resolve().parents[2]
ASSETS = sorted((ROOT / "modelcut-demo" / "assets").glob("*.webp"))
CASES = [
    ("MVP_S939_N260195", "S939", "N260195", ["화이트", "아이보리"]),
    ("MVP_S941_N260007", "S941", "N260007", ["연핑크", "블랙"]),
    ("MVP_S943_TIA-S800", "S943", "TIA-S800", ["블랙", "화이트"]),
]


def encoded(path: Path, role: str) -> dict[str, object]:
    return {
        "name": path.name,
        "role": role,
        "type": "image/webp",
        "size": path.stat().st_size,
        "dataUrl": "data:image/webp;base64," + base64.b64encode(path.read_bytes()).decode("ascii"),
    }


def run() -> None:
    assert len(ASSETS) >= 6, "demo assets are missing"
    provider = get_provider()
    for offset, (job_id, top_code, bottom_code, colors) in enumerate(CASES):
        payload = {
            "schemaVersion": 3,
            "jobId": job_id,
            "topCode": top_code,
            "bottomCode": bottom_code,
            "allowedColors": colors,
            "referenceApproved": True,
            "analysis": {"mustPreserve": ["실제 기장", "실제 실루엣"], "avoidList": ["없는 컬러"]},
            "images": {
                "top": [encoded(ASSETS[offset], "상의 정면"), encoded(ASSETS[offset + 1], "상의 디테일")],
                "bottom": [encoded(ASSETS[offset + 2], "하의 정면"), encoded(ASSETS[offset + 3], "하의 디테일")],
                "reference": [],
                "candidate": [],
            },
        }
        validate_job_policy(payload)
        prompt = enrich_prompt("정면 전신 모델컷", payload)
        assert top_code in {"S939", "S941", "S943"} and "서버 강제 상품 일치 규칙" in prompt
        saved = save_job(payload, prompt)
        base = job_dir(job_id)
        inputs = [base / item["path"] for group in ("top", "bottom") for item in saved["storedInputs"][group]]
        clear_candidates(job_id)
        outputs = provider.generate_candidates(job_id, prompt, inputs, base / "generated", 1, lambda *_: None)
        assert outputs[0].exists() and outputs[0].stat().st_size > 0
        write_log(job_id, {"jobId": job_id, "status": "완료", "provider": "test", "candidateCount": 1, "completedCount": 1, "message": "진단 통합 테스트 완료"})

    try:
        validate_job_policy({"topCode": "S942", "referenceApproved": False})
        raise AssertionError("S942 generation should be blocked")
    except GenerationBlockedError:
        pass
    print("PASS: S939/N260195, S941/N260007, S943/TIA-S800 diagnostic integration and S942 block")


if __name__ == "__main__":
    run()
