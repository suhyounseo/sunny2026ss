(function () {
  "use strict";
  const store = window.ModelcutStore;
  const API_BASE = "http://127.0.0.1:8787";
  const limits = { top: 5, bottom: 5, reference: 3, candidate: 3 };
  const fileInputs = { top: "topFiles", bottom: "bottomFiles", reference: "referenceFiles", candidate: "candidateFiles" };
  const previewTargets = { top: "topPreviews", bottom: "bottomPreviews", reference: "referencePreviews", candidate: "candidatePreviews" };
  const roleOptions = {
    top: ["상의 정면", "상의 후면", "상의 디테일", "상의 원단", "상의 기타"],
    bottom: ["하의 정면", "하의 후면", "하의 디테일", "하의 원단", "하의 기타"],
    reference: ["포즈 참고", "배경 참고", "거래처 분위기 참고"],
    candidate: ["후보 1", "후보 2", "후보 3"],
  };
  const sourceAnalysisMap = { topColor: "topColor", bottomColor: "bottomColor", topLength: "topLength", bottomLength: "bottomLength", topSilhouette: "topSilhouette", bottomSilhouette: "bottomSilhouette", topDetails: "topDetails", bottomDetails: "bottomDetails", fabricKeywords: "fabricKeywords", mustPreserve: "mustPreserve", avoidList: "avoidList" };
  const arrayAnalysisFields = new Set(["topDetails", "bottomDetails", "fabricKeywords", "mustPreserve", "avoidList"]);
  const images = { top: [], bottom: [], reference: [], candidate: [] };
  const editedAnalysis = new Set();
  let analysisGenerated = false;
  let generationPackage = null;
  let pollTimer = null;
  const byId = id => document.getElementById(id);
  const value = id => byId(id).value.trim();
  const escapeHtml = input => String(input ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

  function setStatus(message, error = false) {
    byId("statusLine").textContent = message;
    byId("statusLine").classList.toggle("error", error);
    if (error) byId("saveSuccess").classList.add("hidden");
  }
  function setGenerationState(status, message = "", completed = 0, total = Number(value("candidateCount")) || 3, error = "") {
    byId("generationState").textContent = status;
    byId("generationMessage").textContent = message || status;
    byId("generationProgressBar").style.width = `${total ? Math.min(100, (completed / total) * 100) : 0}%`;
    byId("generationError").textContent = error;
    byId("generationError").classList.toggle("hidden", !error);
    const busy = ["대기중", "생성중"].includes(status);
    byId("executeGeneration").disabled = busy;
    byId("regenerateGeneration").disabled = busy;
  }
  function invalidateRequest() {
    generationPackage = null;
    byId("requestResult").classList.add("hidden");
    setGenerationState("준비 전", "상품 분석 또는 입력이 변경되었습니다. 생성 요청을 다시 만드세요.");
  }
  function fillAdvancedDefaults() {
    const defaults = {
      fabricKeywords: "실제 제품 사진 기준 원단 질감",
      topDetails: "실제 상의 이미지의 넥라인, 컵라인, 어깨끈, 프릴, 리본, 버튼, 절개 등 핵심 디테일 보존",
      bottomDetails: "실제 하의 이미지의 허리선, 포켓, 버튼, 플리츠, 트임, 튤 레이어 등 핵심 디테일 보존",
      topLength: "실제 상의 이미지 기준 기장", bottomLength: "실제 하의 이미지 기준 기장",
      topSilhouette: "실제 상의 이미지 기준 실루엣", bottomSilhouette: "실제 하의 이미지 기준 실루엣",
      mustPreserve: [value("topColor") && `상의 ${value("topColor")} 컬러`, value("bottomColor") && `하의 ${value("bottomColor")} 컬러`, "실제 기장", "실제 실루엣", "이미지에 보이는 핵심 디테일"].filter(Boolean).join(", "),
      avoidList: "입력에 없는 컬러, 실제에 없는 장식, 기장 변경, 실루엣 변경, 핵심 디테일 단순화",
      allowedColors: [value("topColor"), value("bottomColor")].filter(Boolean).join(", "),
    };
    Object.entries(defaults).forEach(([field, defaultValue]) => { if (!value(field)) byId(field).value = defaultValue; });
  }
  const analysisControl = field => document.querySelector(`[data-analysis="${field}"]`);
  function collectAnalysis() {
    const analysis = {};
    document.querySelectorAll("[data-analysis]").forEach(control => { const field = control.dataset.analysis; analysis[field] = arrayAnalysisFields.has(field) ? store.splitKeywords(control.value) : control.value.trim(); });
    return analysis;
  }
  function generateAnalysis(force = false) {
    fillAdvancedDefaults(); if (force) editedAnalysis.clear();
    Object.entries(sourceAnalysisMap).forEach(([field, sourceId]) => { if (force || !editedAnalysis.has(field)) analysisControl(field).value = arrayAnalysisFields.has(field) ? store.splitKeywords(value(sourceId)).join(", ") : value(sourceId); });
    analysisGenerated = true; generationPackage = null; byId("analysisResult").classList.remove("hidden"); byId("status").value = "프롬프트 준비";
    setGenerationState("준비 전", "상품 분석 완료. 모델컷 생성 요청을 만드세요.");
  }
  function renderPreviews(type) {
    byId(previewTargets[type]).innerHTML = images[type].map((image, index) => `<article class="preview" data-type="${type}" data-index="${index}"><button type="button" class="remove" aria-label="이미지 삭제">×</button><img src="${image.dataUrl}" alt="${escapeHtml(image.name)}"><select aria-label="이미지 역할">${roleOptions[type].map(role => `<option${role === image.role ? " selected" : ""}>${role}</option>`).join("")}</select></article>`).join("");
  }
  async function addFiles(type, files) {
    const valid = Array.from(files).filter(file => file.type.startsWith("image/")); const available = limits[type] - images[type].length;
    if (!available) throw new Error(`${type} 이미지는 최대 ${limits[type]}장입니다.`);
    const converted = await Promise.all(valid.slice(0, available).map((file, index) => store.fileToImage(file, roleOptions[type][Math.min(images[type].length + index, roleOptions[type].length - 1)])));
    images[type].push(...converted); renderPreviews(type); if (type !== "candidate") invalidateRequest(); else byId("status").value = "후보 검토"; byId(fileInputs[type]).value = "";
  }
  function roleInstruction(image) {
    const rules = {
      "상의 정면": "컵라인, 넥라인, 어깨선과 전면 장식을 정확히 유지", "상의 후면": "후면 여밈과 등판 구조를 유지", "상의 디테일": "프릴, 리본, 버튼, 배색과 절개 위치를 유지", "상의 원단": "실제 원단 조직과 광택을 유지", "상의 기타": "보조 상품 정보로만 사용",
      "하의 정면": "허리선, 전체 길이와 전면 실루엣을 정확히 유지", "하의 후면": "후면 여밈과 실루엣을 유지", "하의 디테일": "허리 장식, 포켓, 버튼, 트임과 레이어 위치를 유지", "하의 원단": "실제 원단 조직, 튤/샤 레이어와 광택을 유지", "하의 기타": "보조 상품 정보로만 사용",
      "포즈 참고": "포즈만 참고하고 의상 구조는 복사하지 않음", "배경 참고": "배경 톤만 참고하고 상품 컬러에 영향을 주지 않음", "거래처 분위기 참고": "분위기만 참고하고 거래처 의상을 복사하지 않음",
    }; return `${image.role}: ${rules[image.role] || "실제 제품 정보를 유지"}`;
  }
  const descriptor = type => images[type].map((image, index) => ({ fileName: image.name, role: image.role, order: index + 1, mimeType: image.type, size: image.size }));
  function validateRequestInputs() {
    const missing = []; if (!value("jobId")) missing.push("작업 ID"); if (!value("topCode")) missing.push("상의 코드"); if (!value("bottomCode")) missing.push("하의 코드"); if (!images.top.length) missing.push("상의 이미지"); if (!images.bottom.length) missing.push("하의 이미지");
    if (missing.length) throw new Error(`생성 요청을 만들 수 없습니다. ${missing.join(", ")}를 확인하세요.`);
  }
  function buildPrompt(analysis) {
    const roles = [...images.top, ...images.bottom, ...images.reference].map(roleInstruction);
    return `[역할]\n당신은 의류 쇼룸용 모델컷 생성 도구입니다. 실제 제품 이미지를 기준으로 상의와 하의를 조합한 모델 전신컷을 생성합니다.\n\n[입력 이미지]\n- 상의 이미지: ${descriptor("top").map(item => `${item.order}. ${item.role}`).join(", ")}\n- 하의 이미지: ${descriptor("bottom").map(item => `${item.order}. ${item.role}`).join(", ")}\n- 참고 이미지: ${descriptor("reference").map(item => `${item.order}. ${item.role}`).join(", ") || "없음"}\n\n[이미지 역할별 보존 지시]\n${roles.map(rule => `- ${rule}`).join("\n")}\n\n[상품 분석]\n- 상의: ${value("topCode")} / ${analysis.topColor || "실제 사진 컬러"} / ${analysis.topLength} / ${analysis.topSilhouette}\n- 하의: ${value("bottomCode")} / ${analysis.bottomColor || "실제 사진 컬러"} / ${analysis.bottomLength} / ${analysis.bottomSilhouette}\n- 상의 디테일: ${analysis.topDetails.join(", ")}\n- 하의 디테일: ${analysis.bottomDetails.join(", ")}\n- 소재: ${analysis.fabricKeywords.join(", ")}\n- 반드시 보존: ${analysis.mustPreserve.join(", ")}\n- 금지: ${analysis.avoidList.join(", ")}\n- 허용 컬러: ${store.splitKeywords(value("allowedColors")).join(", ") || "업로드된 실제 제품 사진에 존재하는 컬러만"}\n\n[가장 중요한 원칙]\n- 실제 상의 사진의 컬러, 길이, 디테일을 유지\n- 실제 하의 사진의 컬러, 길이, 디테일을 유지\n- 실제 없는 컬러 생성 금지\n- 실제 없는 디테일과 장식 추가 금지\n- 상의와 하의의 실제 기장, 실루엣, 원단감 유지\n- 참고 이미지는 포즈와 무드만 참고하고 상품 구조 기준으로 사용하지 않음\n- 거래처 이미지와 실제 제품 사진이 다르면 실제 제품 사진 우선\n- 상품 일치도를 아름다움이나 분위기보다 우선\n\n[출력]\n- 쇼룸 상세페이지용 정면 전신 모델컷\n- 심플한 아이보리/화이트 스튜디오 배경\n- 자연스럽고 과장 없는 체형과 자세\n- 상품 디테일이 분명히 보이는 구성\n- 신발은 상품보다 튀지 않는 깔끔한 스타일\n- 과도한 배경 장식 금지${value("additionalMemo") ? `\n\n[추가 메모]\n${value("additionalMemo")}` : ""}`;
  }
  function buildGenerationPackage() {
    validateRequestInputs(); if (!analysisGenerated) generateAnalysis(true); const analysis = collectAnalysis(); const prompt = buildPrompt(analysis); const createdAt = new Date().toISOString();
    const manifest = { schemaVersion: 3, jobId: value("jobId"), createdAt, usagePriority: ["actual top", "actual bottom", "product details", "style reference"], topImages: descriptor("top"), bottomImages: descriptor("bottom"), referenceImages: descriptor("reference") };
    const request = { schemaVersion: 3, jobId: value("jobId"), topCode: value("topCode"), bottomCode: value("bottomCode"), topImages: descriptor("top"), bottomImages: descriptor("bottom"), candidateImages: [], referenceImages: descriptor("reference"), analysis, allowedColors: store.splitKeywords(value("allowedColors")), candidateCount: Number(value("candidateCount")), generationInstruction: prompt };
    generationPackage = { prompt, request, manifest, createdAt }; byId("prompt").value = prompt; byId("requestResult").classList.remove("hidden"); byId("status").value = "생성 대기"; setGenerationState("생성 요청 준비 완료", "로컬 생성 서버로 요청을 보낼 수 있습니다."); setStatus("모델컷 생성 요청 패키지가 준비되었습니다."); return generationPackage;
  }
  const ensureGenerationPackage = () => generationPackage || buildGenerationPackage();
  function serverPayload() {
    const packageData = ensureGenerationPackage();
    return { schemaVersion: 3, jobId: value("jobId"), topCode: value("topCode"), bottomCode: value("bottomCode"), topName: value("topName"), bottomName: value("bottomName"), topColor: value("topColor"), bottomColor: value("bottomColor"), allowedColors: store.splitKeywords(value("allowedColors")), analysis: collectAnalysis(), prompt: packageData.prompt, generationRequest: structuredClone(packageData.request), referenceImagesManifest: structuredClone(packageData.manifest), images: structuredClone(images), candidateCount: Number(value("candidateCount")) || 3, regenerationMemo: value("regenerationMemo"), referenceApproved: byId("referenceApproved").checked };
  }
  function collectJob() { const payload = serverPayload(); return { ...payload, requestCreatedAt: generationPackage.createdAt, status: images.candidate.length ? "후보 검토" : "생성 대기", memo: value("additionalMemo"), generationStatus: byId("generationState").textContent }; }
  function validateJob(job) {
    const missing = []; if (!job.jobId) missing.push("작업 ID"); if (!job.topCode) missing.push("상의 코드"); if (!job.bottomCode) missing.push("하의 코드"); if (!job.images.top.length) missing.push("상의 이미지"); if (!job.images.bottom.length) missing.push("하의 이미지"); if (!job.images.candidate.length) missing.push("생성 결과");
    if (missing.length) throw new Error(`저장할 수 없습니다. ${missing.join(", ")}를 확인하세요.`);
  }
  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); let body = null; try { body = await response.json(); } catch { body = {}; }
    if (!response.ok) throw new Error(body.detail || body.message || `서버 오류 HTTP ${response.status}`); return body;
  }
  function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
  async function loadCandidates(autoSave = true) {
    const jobId = value("jobId"); if (!jobId) throw new Error("작업 ID를 입력하세요."); const candidates = await api(`/api/jobs/${encodeURIComponent(jobId)}/candidates`); if (!candidates.length) throw new Error("서버에 생성된 후보가 없습니다."); images.candidate.length = 0;
    for (const candidate of candidates) { const response = await fetch(`${API_BASE}${candidate.url}`); if (!response.ok) throw new Error(`후보 이미지 로드 실패: HTTP ${response.status}`); const blob = await response.blob(); images.candidate.push({ id: crypto.randomUUID?.() || `${Date.now()}-${candidate.index}`, name: candidate.fileName, type: blob.type || "image/png", size: blob.size, role: `후보 ${candidate.index}`, dataUrl: await blobToDataUrl(blob), serverUrl: `${API_BASE}${candidate.url}` }); }
    renderPreviews("candidate"); byId("status").value = "후보 검토"; if (autoSave) { await store.putJob(collectJob()); await renderJobList(); } setStatus(`생성 후보 ${images.candidate.length}장이 자동 연결되었습니다.`);
  }
  async function pollGeneration() {
    clearTimeout(pollTimer);
    try { const state = await api(`/api/jobs/${encodeURIComponent(value("jobId"))}/status`); setGenerationState(state.status, state.message, state.completedCount || 0, state.candidateCount || 3, state.error || ""); if (["대기중", "생성중"].includes(state.status)) pollTimer = setTimeout(pollGeneration, 1500); else if (state.status === "완료") await loadCandidates(true); }
    catch (error) { setGenerationState("실패", "상태 확인 실패", 0, 3, error.message); setStatus(error.message, true); }
  }
  async function executeGeneration() {
    try { const payload = serverPayload(); setGenerationState("대기중", "모델컷 생성 요청을 서버에 전송중..."); await api(`/api/jobs/${encodeURIComponent(payload.jobId)}/generate`, { method: "POST", body: JSON.stringify(payload) }); await pollGeneration(); }
    catch (error) { setGenerationState("실패", "모델컷 생성 요청 실패", 0, 3, error.message); setStatus(error.message, true); }
  }
  async function regenerate() {
    const memo = value("regenerationMemo"); if (!memo) return setStatus("재생성 메모를 먼저 입력하세요.", true);
    try { const jobId = value("jobId"); if (!jobId) throw new Error("작업 ID를 입력하세요."); setGenerationState("대기중", "재생성 요청을 서버에 전송중..."); await api(`/api/jobs/${encodeURIComponent(jobId)}/regenerate`, { method: "POST", body: JSON.stringify({ regenerationMemo: memo, candidateCount: Number(value("candidateCount")) || 3 }) }); await pollGeneration(); }
    catch (error) { setGenerationState("실패", "재생성 요청 실패", 0, 3, error.message); setStatus(error.message, true); }
  }
  async function renderJobList() {
    const jobs = await store.listJobs(); byId("jobList").innerHTML = jobs.length ? jobs.map(job => `<article class="job-item"><strong>${escapeHtml(job.jobId)}</strong><span>${escapeHtml(job.topCode)} + ${escapeHtml(job.bottomCode)}</span><span>상태: ${escapeHtml(job.status)}</span><div class="job-actions"><a href="index.html#card-${encodeURIComponent(job.jobId)}_candidate_01">검토판에서 보기</a><button type="button" class="delete" data-delete-job="${escapeHtml(job.jobId)}">삭제</button></div></article>`).join("") : '<p class="empty">아직 저장된 작업이 없습니다.<br><br>왼쪽에서 상품 이미지와 생성 결과를 준비한 뒤<br>[작업 저장하기]를 누르세요.</p>';
  }
  function resetForm() {
    clearTimeout(pollTimer); byId("jobForm").reset(); Object.keys(images).forEach(type => { images[type].length = 0; renderPreviews(type); }); byId("prompt").value = ""; byId("status").value = "입력중"; analysisGenerated = false; generationPackage = null; editedAnalysis.clear(); byId("analysisResult").classList.add("hidden"); byId("requestResult").classList.add("hidden"); byId("advancedSettings").open = false; byId("saveSuccess").classList.add("hidden"); byId("savedReviewLink").href = "index.html"; setGenerationState("준비 전", "먼저 상품 분석과 생성 요청을 만드세요."); setStatus("");
  }

  Object.entries(fileInputs).forEach(([type, id]) => byId(id).addEventListener("change", event => addFiles(type, event.target.files).catch(error => setStatus(error.message, true))));
  Object.values(previewTargets).forEach(targetId => { byId(targetId).addEventListener("click", event => { const button = event.target.closest(".remove"); if (!button) return; const card = button.closest(".preview"); images[card.dataset.type].splice(Number(card.dataset.index), 1); renderPreviews(card.dataset.type); if (card.dataset.type !== "candidate") invalidateRequest(); }); byId(targetId).addEventListener("change", event => { if (!event.target.matches("select")) return; const card = event.target.closest(".preview"); images[card.dataset.type][Number(card.dataset.index)].role = event.target.value; if (card.dataset.type !== "candidate") invalidateRequest(); }); });
  document.querySelectorAll("[data-upload-type]").forEach(dropzone => { dropzone.addEventListener("dragover", event => { event.preventDefault(); dropzone.classList.add("dragover"); }); dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover")); dropzone.addEventListener("drop", event => { event.preventDefault(); dropzone.classList.remove("dragover"); addFiles(dropzone.dataset.uploadType, event.dataTransfer.files).catch(error => setStatus(error.message, true)); }); });
  Object.values(sourceAnalysisMap).forEach(sourceId => byId(sourceId).addEventListener("input", invalidateRequest));
  ["jobId", "topCode", "bottomCode", "allowedColors", "additionalMemo", "referenceApproved"].forEach(id => byId(id).addEventListener("input", invalidateRequest));
  document.querySelectorAll("[data-analysis]").forEach(control => control.addEventListener("input", () => { editedAnalysis.add(control.dataset.analysis); invalidateRequest(); }));
  byId("generateAnalysis").addEventListener("click", () => { try { validateRequestInputs(); generateAnalysis(true); setStatus("상품 분석이 완료되었습니다."); } catch (error) { setStatus(error.message, true); } });
  byId("generateRequest").addEventListener("click", () => { try { buildGenerationPackage(); } catch (error) { setStatus(error.message, true); } });
  byId("executeGeneration").addEventListener("click", executeGeneration); byId("regenerateGeneration").addEventListener("click", regenerate); byId("loadGenerated").addEventListener("click", () => loadCandidates(true).catch(error => setStatus(error.message, true)));
  byId("copyPrompt").addEventListener("click", async () => { try { await navigator.clipboard.writeText(ensureGenerationPackage().prompt); setStatus("모델컷 생성 요청 프롬프트를 복사했습니다."); } catch (error) { setStatus(error.message, true); } });
  byId("downloadPrompt").addEventListener("click", () => { try { store.downloadText(ensureGenerationPackage().prompt, "generation_prompt.txt"); } catch (error) { setStatus(error.message, true); } });
  byId("downloadRequest").addEventListener("click", () => { try { store.downloadText(JSON.stringify(ensureGenerationPackage().request, null, 2), "generation_request.json", "application/json;charset=utf-8"); } catch (error) { setStatus(error.message, true); } });
  byId("downloadManifest").addEventListener("click", () => { try { store.downloadText(JSON.stringify(ensureGenerationPackage().manifest, null, 2), "reference_images_manifest.json", "application/json;charset=utf-8"); } catch (error) { setStatus(error.message, true); } });
  byId("resetTop").addEventListener("click", resetForm);
  byId("jobForm").addEventListener("submit", async event => { event.preventDefault(); try { const job = collectJob(); validateJob(job); await api("/api/jobs/save", { method: "POST", body: JSON.stringify(job) }); await store.putJob(job); await renderJobList(); const message = "저장 완료: 작업이 브라우저와 로컬 작업 폴더에 저장되었습니다. 검토판에서 확인할 수 있습니다."; setStatus(message); byId("savedMessage").textContent = message; byId("saveSuccess").classList.remove("hidden"); byId("savedReviewLink").href = `index.html#card-${encodeURIComponent(job.jobId)}_candidate_01`; } catch (error) { setStatus(error.message, true); } });
  byId("jobList").addEventListener("click", async event => { const button = event.target.closest("[data-delete-job]"); if (!button || !confirm(`${button.dataset.deleteJob} 작업을 브라우저와 로컬 작업 폴더에서 삭제할까요?`)) return; try { await api(`/api/jobs/${encodeURIComponent(button.dataset.deleteJob)}`, { method: "DELETE" }); await store.deleteJob(button.dataset.deleteJob); await renderJobList(); setStatus(`${button.dataset.deleteJob} 작업을 삭제했습니다.`); } catch (error) { setStatus(error.message, true); } });
  byId("exportJobs").addEventListener("click", async () => { try { const jobs = await store.listJobs(); store.downloadText(JSON.stringify({ schemaVersion: 3, exportedAt: new Date().toISOString(), jobs }, null, 2), "modelcut_jobs_export.json", "application/json;charset=utf-8"); } catch (error) { setStatus(error.message, true); } });
  byId("importJobs").addEventListener("click", () => byId("importJobsFile").click());
  byId("importJobsFile").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { const payload = JSON.parse(await file.text()); if (![1, 2, 3].includes(payload?.schemaVersion) || !Array.isArray(payload.jobs)) throw new Error("지원하지 않는 작업 JSON 형식입니다."); await store.importJobs(payload.jobs); await renderJobList(); setStatus(`JSON에서 작업 ${payload.jobs.length}건을 불러왔습니다.`); } catch (error) { setStatus(`JSON 불러오기 실패: ${error.message}`, true); } event.target.value = ""; });
  renderJobList().catch(error => setStatus(`저장소 초기화 실패: ${error.message}`, true)); store.subscribe(renderJobList);
  api("/api/health").then(info => setGenerationState("준비 전", `로컬 생성 서버 연결됨 · ${info.provider} / ${info.model}${info.apiKeyConfigured ? "" : " · API 키 미설정"}`)).catch(() => setGenerationState("준비 전", "로컬 생성 서버가 꺼져 있습니다. README의 서버 실행 방법을 확인하세요."));
})();
