from __future__ import annotations

import sys
import threading
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from server.image_provider import get_provider
from server.rules import GenerationBlockedError, enrich_prompt, validate_job_policy
from server.schemas import CandidateItem, GenerationStartResponse, JobPayload, RegenerateRequest
from server.settings import settings
from server.storage import candidate_paths, clear_candidates, delete_job, job_dir, list_jobs, load_job, load_log, save_job, utc_now, write_log


app = FastAPI(title="NICE Modelcut Generation API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8765", "http://localhost:8765"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
_running: set[str] = set()
_running_lock = threading.Lock()


def _select_inputs(base: Path, stored: dict[str, list[dict[str, Any]]]) -> list[Path]:
    priorities = {
        "top": {"상의 정면": 0, "상의 디테일": 1, "상의 후면": 2, "상의 원단": 3, "상의 기타": 4},
        "bottom": {"하의 정면": 0, "하의 디테일": 1, "하의 후면": 2, "하의 원단": 3, "하의 기타": 4},
        "reference": {"포즈 참고": 0, "배경 참고": 1, "거래처 분위기 참고": 2},
    }
    selected: list[Path] = []
    for group, limit in (("top", 3), ("bottom", 3), ("reference", 2)):
        entries = sorted(stored.get(group, []), key=lambda item: priorities[group].get(item.get("role", ""), 99))[:limit]
        selected.extend(base / item["path"] for item in entries)
    return selected


def _run_generation(job_id: str, persisted: dict[str, Any], candidate_count: int, regeneration_memo: str = "") -> None:
    base = job_dir(job_id)
    prompt = enrich_prompt(persisted.get("prompt", ""), persisted, regeneration_memo)
    log = {
        "jobId": job_id, "status": "생성중", "provider": settings.provider, "model": settings.image_model,
        "candidateCount": candidate_count, "completedCount": 0, "message": "모델컷 후보 생성중...", "regenerationMemo": regeneration_memo,
        "startedAt": utc_now(), "updatedAt": utc_now(), "error": "",
    }
    write_log(job_id, log)

    def progress(completed: int, total: int, message: str) -> None:
        log.update({"completedCount": completed, "candidateCount": total, "message": message, "updatedAt": utc_now()})
        write_log(job_id, log)

    try:
        provider = get_provider()
        log.update({"provider": provider.name, "model": settings.image_model if provider.name == "openai" else "diagnostic-test"})
        write_log(job_id, log)
        clear_candidates(job_id)
        inputs = _select_inputs(base, persisted.get("storedInputs") or {})
        if len(inputs) < 2:
            raise RuntimeError("생성에 사용할 상의·하의 이미지가 부족합니다.")
        outputs = provider.generate_candidates(job_id, prompt, inputs, base / "generated", candidate_count, progress)
        log.update({"status": "완료", "completedCount": len(outputs), "message": f"후보 {len(outputs)}장 생성 완료", "finishedAt": utc_now(), "updatedAt": utc_now()})
    except Exception as error:
        log.update({"status": "실패", "message": "모델컷 생성 실패", "error": str(error), "finishedAt": utc_now(), "updatedAt": utc_now()})
    finally:
        write_log(job_id, log)
        with _running_lock:
            _running.discard(job_id)


def _start(job_id: str, persisted: dict[str, Any], candidate_count: int, background_tasks: BackgroundTasks, regeneration_memo: str = "") -> GenerationStartResponse:
    with _running_lock:
        if job_id in _running:
            raise HTTPException(status_code=409, detail="이미 생성중인 작업입니다.")
        _running.add(job_id)
    write_log(job_id, {"jobId": job_id, "status": "대기중", "candidateCount": candidate_count, "completedCount": 0, "message": "생성 대기중", "updatedAt": utc_now(), "error": ""})
    background_tasks.add_task(_run_generation, job_id, persisted, candidate_count, regeneration_memo)
    return GenerationStartResponse(jobId=job_id, status="대기중", message="모델컷 생성 요청을 접수했습니다.")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "provider": settings.provider, "model": settings.image_model, "apiKeyConfigured": bool(settings.openai_api_key)}


@app.post("/api/jobs/save")
def save(payload: JobPayload) -> dict[str, Any]:
    raw = payload.model_dump()
    try:
        validate_job_policy(raw)
        prompt = enrich_prompt(payload.prompt or payload.generationRequest.get("generationInstruction", ""), raw)
        persisted = save_job(raw, prompt)
    except (ValueError, GenerationBlockedError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"jobId": payload.jobId, "saved": True, "storedInputs": persisted["storedInputs"]}


@app.get("/api/jobs")
def jobs() -> list[dict[str, Any]]:
    return list_jobs()


@app.get("/api/jobs/{job_id}")
def job(job_id: str) -> dict[str, Any]:
    try:
        result = load_job(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if not result:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    return result


@app.delete("/api/jobs/{job_id}")
def remove(job_id: str) -> dict[str, bool]:
    try:
        delete_job(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"deleted": True}


@app.post("/api/jobs/{job_id}/generate", response_model=GenerationStartResponse)
def generate(job_id: str, payload: JobPayload, background_tasks: BackgroundTasks) -> GenerationStartResponse:
    if payload.jobId != job_id:
        raise HTTPException(status_code=400, detail="URL과 작업 ID가 일치하지 않습니다.")
    raw = payload.model_dump()
    try:
        validate_job_policy(raw)
        prompt = enrich_prompt(payload.prompt or payload.generationRequest.get("generationInstruction", ""), raw)
        persisted = save_job(raw, prompt)
    except GenerationBlockedError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return _start(job_id, persisted, payload.candidateCount, background_tasks)


@app.post("/api/jobs/{job_id}/regenerate", response_model=GenerationStartResponse)
def regenerate(job_id: str, request: RegenerateRequest, background_tasks: BackgroundTasks) -> GenerationStartResponse:
    persisted = load_job(job_id)
    if not persisted:
        raise HTTPException(status_code=404, detail="기존 생성 작업을 찾을 수 없습니다.")
    try:
        validate_job_policy(persisted)
    except GenerationBlockedError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return _start(job_id, persisted, request.candidateCount, background_tasks, request.regenerationMemo)


@app.get("/api/jobs/{job_id}/status")
def status(job_id: str) -> dict[str, Any]:
    try:
        return load_log(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/jobs/{job_id}/candidates", response_model=list[CandidateItem])
def candidates(job_id: str) -> list[CandidateItem]:
    try:
        paths = candidate_paths(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return [CandidateItem(index=index, fileName=path.name, url=f"/api/jobs/{job_id}/files/{path.name}") for index, path in enumerate(paths, start=1)]


@app.get("/api/jobs/{job_id}/files/{file_name}")
def generated_file(job_id: str, file_name: str) -> FileResponse:
    if not file_name.startswith("candidate_") or not file_name.endswith(".png") or "/" in file_name or "\\" in file_name:
        raise HTTPException(status_code=400, detail="잘못된 후보 파일명입니다.")
    path = job_dir(job_id) / "generated" / file_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="후보 이미지를 찾을 수 없습니다.")
    return FileResponse(path, media_type="image/png", filename=file_name)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.app:app", host=settings.api_host, port=settings.api_port, reload=False)
