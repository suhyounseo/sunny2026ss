(function () {
  "use strict";

  const store = window.ModelcutStore;
  const limits = { top: 5, bottom: 5, reference: 3, candidate: 3 };
  const fileInputs = { top: "topFiles", bottom: "bottomFiles", reference: "referenceFiles", candidate: "candidateFiles" };
  const previewTargets = { top: "topPreviews", bottom: "bottomPreviews", reference: "referencePreviews", candidate: "candidatePreviews" };
  const roleOptions = {
    top: ["상의 정면", "상의 후면", "상의 디테일", "상의 원단", "상의 기타"],
    bottom: ["하의 정면", "하의 후면", "하의 디테일", "하의 원단", "하의 기타"],
    reference: ["포즈 참고", "배경 참고", "거래처 분위기 참고"],
    candidate: ["후보 1", "후보 2", "후보 3"],
  };
  const sourceAnalysisMap = {
    topColor: "topColor", bottomColor: "bottomColor", topLength: "topLength", bottomLength: "bottomLength",
    topSilhouette: "topSilhouette", bottomSilhouette: "bottomSilhouette", topDetails: "topDetails",
    bottomDetails: "bottomDetails", fabricKeywords: "fabricKeywords", mustPreserve: "mustPreserve", avoidList: "avoidList",
  };
  const arrayAnalysisFields = new Set(["topDetails", "bottomDetails", "fabricKeywords", "mustPreserve", "avoidList"]);
  const images = { top: [], bottom: [], reference: [], candidate: [] };
  const editedAnalysis = new Set();
  let analysisGenerated = false;
  let generationPackage = null;

  const byId = id => document.getElementById(id);
  const value = id => byId(id).value.trim();
  const escapeHtml = input => String(input ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

  function setStatus(message, error = false) {
    byId("statusLine").textContent = message;
    byId("statusLine").classList.toggle("error", error);
    if (error) byId("saveSuccess").classList.add("hidden");
  }

  function invalidateRequest() {
    generationPackage = null;
    byId("requestResult").classList.add("hidden");
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
    };
    Object.entries(defaults).forEach(([field, defaultValue]) => { if (!value(field)) byId(field).value = defaultValue; });
  }

  function analysisControl(field) { return document.querySelector(`[data-analysis="${field}"]`); }

  function setAnalysisValue(field, nextValue, force = false) {
    if (!force && editedAnalysis.has(field)) return;
    analysisControl(field).value = Array.isArray(nextValue) ? nextValue.join(", ") : nextValue;
  }

  function collectAnalysis() {
    const analysis = {};
    document.querySelectorAll("[data-analysis]").forEach(control => {
      const field = control.dataset.analysis;
      analysis[field] = arrayAnalysisFields.has(field) ? store.splitKeywords(control.value) : control.value.trim();
    });
    return analysis;
  }

  function generateAnalysis(force = false) {
    fillAdvancedDefaults();
    if (force) editedAnalysis.clear();
    Object.entries(sourceAnalysisMap).forEach(([field, sourceId]) => {
      const sourceValue = value(sourceId);
      setAnalysisValue(field, arrayAnalysisFields.has(field) ? store.splitKeywords(sourceValue) : sourceValue, force);
    });
    analysisGenerated = true;
    byId("analysisResult").classList.remove("hidden");
    invalidateRequest();
    return collectAnalysis();
  }

  function previewCard(type, image, index) {
    const options = roleOptions[type].map(role => `<option${role === image.role ? " selected" : ""}>${escapeHtml(role)}</option>`).join("");
    return `<article class="preview" data-type="${type}" data-index="${index}"><img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.role)}"><button type="button" class="remove" aria-label="${escapeHtml(image.role)} 삭제">×</button><select aria-label="이미지 역할">${options}</select></article>`;
  }

  function renderPreviews(type) { byId(previewTargets[type]).innerHTML = images[type].map((image, index) => previewCard(type, image, index)).join(""); }

  async function addFiles(type, selectedFiles) {
    const remaining = limits[type] - images[type].length;
    const files = Array.from(selectedFiles).slice(0, Math.max(remaining, 0));
    if (!files.length) return setStatus(`${type} 이미지는 최대 ${limits[type]}장까지 선택할 수 있습니다.`, true);
    const converted = await Promise.all(files.map((file, offset) => store.fileToImage(file, roleOptions[type][images[type].length + offset])));
    images[type].push(...converted);
    renderPreviews(type);
    if (type !== "candidate") invalidateRequest();
    if (type === "candidate") byId("status").value = "후보 검토";
    setStatus(`${files.length}개 이미지 미리보기를 추가했습니다.`);
  }

  function imageDescriptors(type) {
    return images[type].map((image, index) => ({ id: image.id, fileName: image.name, role: image.role, type: image.type, size: image.size, order: index + 1 }));
  }

  function imageRoleLines(type) {
    return images[type].map((image, index) => `- ${image.role}: ${image.name} (${index + 1}번 이미지)`).join("\n") || "- 없음";
  }

  function roleInstruction(role) {
    const instructions = {
      "상의 정면": "상의 정면 이미지를 기준으로 넥라인, 컵라인, 어깨끈, 프릴과 전체 앞면 비율을 유지합니다.",
      "상의 후면": "상의 후면 이미지를 기준으로 등판, 지퍼, 끈과 뒤쪽 절개 위치를 유지합니다.",
      "상의 디테일": "상의 디테일 이미지를 기준으로 리본, 버튼, 셔링, 배색과 장식 위치를 유지합니다.",
      "상의 원단": "상의 원단 이미지를 기준으로 실제 조직감, 광택, 쉬폰·니트·트위드 질감을 유지합니다.",
      "상의 기타": "상의 기타 이미지는 실제 상품 구조를 보완하는 근거로 사용합니다.",
      "하의 정면": "하의 정면 이미지를 기준으로 허리선, 실제 기장, 앞면 실루엣과 주름 위치를 유지합니다.",
      "하의 후면": "하의 후면 이미지를 기준으로 뒷허리, 지퍼, 포켓과 뒤쪽 실루엣을 유지합니다.",
      "하의 디테일": "하의 디테일 이미지를 기준으로 허리 장식, 버튼, 리본, 트임과 절개 위치를 유지합니다.",
      "하의 원단": "하의 원단 이미지를 기준으로 튤, 샤, 플리츠, 니트와 실제 소재감을 유지합니다.",
      "하의 기타": "하의 기타 이미지는 실제 상품 구조를 보완하는 근거로 사용합니다.",
      "포즈 참고": "포즈 참고 이미지는 모델 자세만 참고하고 의상 구조에는 반영하지 않습니다.",
      "배경 참고": "배경 참고 이미지는 스튜디오 배경만 참고하고 상품 컬러에는 영향을 주지 않습니다.",
      "거래처 분위기 참고": "거래처 분위기 이미지는 무드만 참고하고 상품 디테일의 근거로 사용하지 않습니다.",
    };
    return instructions[role] || `${role} 이미지를 실제 상품 근거로 사용합니다.`;
  }

  function roleGuidanceLines() {
    return ["top", "bottom", "reference"].flatMap(type => images[type].map(image => `- ${roleInstruction(image.role)}`)).join("\n") || "- 실제 제품 이미지를 기준으로 생성합니다.";
  }

  function buildPrompt(analysis) {
    return `[역할]
당신은 의류 쇼룸용 모델컷 생성 도구입니다.
실제 제품 이미지를 기준으로 상의와 하의를 조합한 모델 전신컷을 생성합니다.

[작업 정보]
- 작업 ID: ${value("jobId")}
- 상의: ${value("topCode")} / ${value("topName") || "상품명 미입력"} / ${analysis.topColor || "컬러 미입력"}
- 하의: ${value("bottomCode")} / ${value("bottomName") || "상품명 미입력"} / ${analysis.bottomColor || "컬러 미입력"}

[입력 이미지]
상의 이미지:
${imageRoleLines("top")}

하의 이미지:
${imageRoleLines("bottom")}

참고 이미지(포즈/분위기 참고용):
${imageRoleLines("reference")}

[이미지 역할별 보존 지시]
${roleGuidanceLines()}

[상품 분석]
- 상의 컬러: ${analysis.topColor || "미입력"}
- 하의 컬러: ${analysis.bottomColor || "미입력"}
- 상의 기장: ${analysis.topLength || "실제 이미지 기준"}
- 하의 기장: ${analysis.bottomLength || "실제 이미지 기준"}
- 상의 실루엣: ${analysis.topSilhouette || "실제 이미지 기준"}
- 하의 실루엣: ${analysis.bottomSilhouette || "실제 이미지 기준"}
- 상의 디테일: ${analysis.topDetails.join(", ") || "실제 이미지 기준"}
- 하의 디테일: ${analysis.bottomDetails.join(", ") || "실제 이미지 기준"}
- 소재: ${analysis.fabricKeywords.join(", ") || "실제 이미지 기준"}
- 반드시 보존: ${analysis.mustPreserve.join(", ")}
- 생성 금지: ${analysis.avoidList.join(", ")}

[가장 중요한 원칙]
- 실제 상의 사진의 컬러, 길이, 디테일을 유지
- 실제 하의 사진의 컬러, 길이, 디테일을 유지
- 실제 없는 컬러 생성 금지
- 실제 없는 장식 추가 금지
- 참고 이미지는 포즈/무드만 참고
- 상품 일치도 우선
- 정면 전신 모델컷 생성

[출력]
- 쇼룸용 정면 전신 모델컷
- 배경은 심플한 아이보리/화이트 스튜디오
- 모델은 자연스럽고 과장 없는 체형
- 상품 디테일이 잘 보이도록 생성`;
  }

  function validateRequestInputs() {
    const missing = [];
    if (!value("jobId")) missing.push("작업 ID");
    if (!value("topCode")) missing.push("상의 코드");
    if (!value("bottomCode")) missing.push("하의 코드");
    if (!images.top.length) missing.push("상의 이미지");
    if (!images.bottom.length) missing.push("하의 이미지");
    if (missing.length) throw new Error(`생성 요청을 만들 수 없습니다.\n${missing.join(", ")}를 확인해주세요.`);
  }

  function buildGenerationPackage() {
    validateRequestInputs();
    const analysis = analysisGenerated ? collectAnalysis() : generateAnalysis(true);
    const prompt = buildPrompt(analysis);
    const createdAt = new Date().toISOString();
    const manifest = {
      schemaVersion: 1, jobId: value("jobId"), createdAt,
      usage: "원본 이미지 파일과 이 manifest를 함께 이미지 생성 도구에 전달하세요.",
      topImages: imageDescriptors("top"), bottomImages: imageDescriptors("bottom"), referenceImages: imageDescriptors("reference"),
      roleInstructions: ["top", "bottom", "reference"].flatMap(type => images[type].map(image => ({ imageId: image.id, role: image.role, instruction: roleInstruction(image.role) }))),
    };
    const request = {
      jobId: value("jobId"), topCode: value("topCode"), bottomCode: value("bottomCode"),
      topImages: imageDescriptors("top"), bottomImages: imageDescriptors("bottom"), candidateImages: [], referenceImages: imageDescriptors("reference"),
      analysis, generationInstruction: prompt,
    };
    generationPackage = { prompt, request, manifest, createdAt };
    byId("prompt").value = prompt;
    byId("requestResult").classList.remove("hidden");
    byId("status").value = images.candidate.length ? "후보 검토" : "생성 대기";
    setStatus("모델컷 생성 요청 패키지가 준비되었습니다. 프롬프트와 JSON 파일을 다운로드하세요.");
    return generationPackage;
  }

  function ensureGenerationPackage() { return generationPackage || buildGenerationPackage(); }

  function collectJob() {
    const packageData = ensureGenerationPackage();
    return {
      schemaVersion: 2, jobId: value("jobId"), topCode: value("topCode"), bottomCode: value("bottomCode"),
      topName: value("topName"), bottomName: value("bottomName"), topColor: value("topColor"), bottomColor: value("bottomColor"),
      fabricKeywords: store.splitKeywords(value("fabricKeywords")), topDetails: store.splitKeywords(value("topDetails")), bottomDetails: store.splitKeywords(value("bottomDetails")),
      topLength: value("topLength"), bottomLength: value("bottomLength"), topSilhouette: value("topSilhouette"), bottomSilhouette: value("bottomSilhouette"),
      mustPreserve: store.splitKeywords(value("mustPreserve")), avoidList: store.splitKeywords(value("avoidList")), memo: value("memo"), status: byId("status").value,
      images: structuredClone(images), analysis: collectAnalysis(), prompt: packageData.prompt,
      generationRequest: structuredClone(packageData.request), referenceImagesManifest: structuredClone(packageData.manifest), requestCreatedAt: packageData.createdAt,
    };
  }

  function validateJob(job) {
    const missing = [];
    if (!job.jobId) missing.push("작업 ID"); if (!job.topCode) missing.push("상의 코드"); if (!job.bottomCode) missing.push("하의 코드");
    if (!job.images?.top?.length) missing.push("상의 이미지"); if (!job.images?.bottom?.length) missing.push("하의 이미지");
    if (!job.images?.candidate?.length) missing.push("생성된 모델컷"); if (!job.generationRequest?.generationInstruction) missing.push("모델컷 생성 요청");
    if (missing.length) throw new Error(`저장할 수 없습니다.\n${missing.join(", ")}를 확인해주세요.`);
    if (job.images.top.length > 5 || job.images.bottom.length > 5 || job.images.reference.length > 3 || job.images.candidate.length > 3) throw new Error("이미지 최대 장수를 초과했습니다.");
  }

  async function renderJobList() {
    const jobs = await store.listJobs();
    byId("jobList").innerHTML = jobs.length ? jobs.map(job => `<article class="job-item"><strong>${escapeHtml(job.jobId)}</strong><span>${escapeHtml(job.topCode)} + ${escapeHtml(job.bottomCode)}</span><span>상태: ${escapeHtml(job.status)}</span><div class="job-actions"><a href="index.html#card-${encodeURIComponent(job.jobId)}_candidate_01">검토판에서 보기</a><button type="button" class="delete" data-delete-job="${escapeHtml(job.jobId)}">삭제</button></div></article>`).join("") : '<p class="empty">아직 저장된 작업이 없습니다.<br><br>왼쪽에서 생성 요청과 결과 업로드를 완료한 뒤<br>[작업 저장하기]를 누르세요.</p>';
  }

  function resetForm() {
    byId("jobForm").reset();
    Object.keys(images).forEach(type => { images[type] = []; renderPreviews(type); });
    editedAnalysis.clear(); document.querySelectorAll("[data-analysis]").forEach(control => control.value = "");
    byId("prompt").value = ""; byId("status").value = "입력중"; analysisGenerated = false; generationPackage = null;
    byId("analysisResult").classList.add("hidden"); byId("requestResult").classList.add("hidden"); byId("advancedSettings").open = false; byId("saveSuccess").classList.add("hidden");
    byId("savedReviewLink").href = "index.html"; setStatus("새 모델컷 생성 작업을 시작합니다.");
  }

  Object.entries(fileInputs).forEach(([type, inputId]) => byId(inputId).addEventListener("change", async event => {
    try { await addFiles(type, event.target.files); } catch (error) { setStatus(`이미지 처리 실패: ${error.message}`, true); }
    event.target.value = "";
  }));
  Object.values(previewTargets).forEach(targetId => byId(targetId).addEventListener("click", event => {
    const remove = event.target.closest(".remove"); if (!remove) return;
    const card = remove.closest(".preview"); images[card.dataset.type].splice(Number(card.dataset.index), 1); renderPreviews(card.dataset.type);
    if (card.dataset.type !== "candidate") invalidateRequest();
  }));
  Object.values(previewTargets).forEach(targetId => byId(targetId).addEventListener("change", event => {
    if (!event.target.matches("select")) return;
    const card = event.target.closest(".preview"); images[card.dataset.type][Number(card.dataset.index)].role = event.target.value;
    if (card.dataset.type !== "candidate") invalidateRequest();
  }));
  document.querySelectorAll("[data-upload-type]").forEach(dropzone => {
    dropzone.addEventListener("dragover", event => { event.preventDefault(); dropzone.classList.add("dragover"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", async event => { event.preventDefault(); dropzone.classList.remove("dragover"); try { await addFiles(dropzone.dataset.uploadType, event.dataTransfer.files); } catch (error) { setStatus(`이미지 처리 실패: ${error.message}`, true); } });
  });
  Object.values(sourceAnalysisMap).forEach(sourceId => byId(sourceId).addEventListener("input", () => { if (analysisGenerated) generateAnalysis(false); else invalidateRequest(); }));
  document.querySelectorAll("[data-analysis]").forEach(control => control.addEventListener("input", () => { editedAnalysis.add(control.dataset.analysis); invalidateRequest(); }));

  byId("generateAnalysis").addEventListener("click", () => { generateAnalysis(true); setStatus("상품 분석이 완료되었습니다. 선택 입력에서 실제 상품 정보를 보완할 수 있습니다."); });
  byId("generateRequest").addEventListener("click", () => { try { buildGenerationPackage(); } catch (error) { setStatus(error.message, true); } });
  byId("copyPrompt").addEventListener("click", async () => {
    try { const prompt = ensureGenerationPackage().prompt; await navigator.clipboard.writeText(prompt); setStatus("모델컷 생성 요청 프롬프트를 복사했습니다."); }
    catch (error) { byId("prompt").focus(); byId("prompt").select(); document.execCommand("copy"); setStatus(error.message.includes("만들 수") ? error.message : "모델컷 생성 요청 프롬프트를 복사했습니다.", error.message.includes("만들 수")); }
  });
  byId("downloadPrompt").addEventListener("click", () => { try { store.downloadText(ensureGenerationPackage().prompt, "generation_prompt.txt"); setStatus("generation_prompt.txt 다운로드를 시작했습니다."); } catch (error) { setStatus(error.message, true); } });
  byId("downloadRequest").addEventListener("click", () => { try { store.downloadText(JSON.stringify(ensureGenerationPackage().request, null, 2), "generation_request.json", "application/json;charset=utf-8"); setStatus("generation_request.json 다운로드를 시작했습니다."); } catch (error) { setStatus(error.message, true); } });
  byId("downloadManifest").addEventListener("click", () => { try { store.downloadText(JSON.stringify(ensureGenerationPackage().manifest, null, 2), "reference_images_manifest.json", "application/json;charset=utf-8"); setStatus("reference_images_manifest.json 다운로드를 시작했습니다."); } catch (error) { setStatus(error.message, true); } });
  byId("resetTop").addEventListener("click", resetForm);

  byId("jobForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const job = collectJob(); validateJob(job); await store.putJob(job); await renderJobList();
      const message = "저장 완료: 생성 요청과 모델컷 결과가 브라우저에 저장되었습니다. 검토판에서 확인할 수 있습니다.";
      setStatus(message); byId("saveSuccess").textContent = message; byId("saveSuccess").classList.remove("hidden");
      byId("savedReviewLink").href = `index.html#card-${encodeURIComponent(job.jobId)}_candidate_01`;
    } catch (error) { setStatus(error.message, true); }
  });
  byId("jobList").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-job]");
    if (button && confirm(`${button.dataset.deleteJob} 작업을 브라우저에서 삭제할까요?`)) store.deleteJob(button.dataset.deleteJob).then(renderJobList).then(() => setStatus(`${button.dataset.deleteJob} 작업을 삭제했습니다.`)).catch(error => setStatus(error.message, true));
  });
  byId("exportJobs").addEventListener("click", async () => {
    try { const jobs = await store.listJobs(); store.downloadText(JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), jobs }, null, 2), "modelcut_jobs_export.json", "application/json;charset=utf-8"); setStatus(`전체 작업 ${jobs.length}건의 JSON 다운로드를 시작했습니다.`); } catch (error) { setStatus(error.message, true); }
  });
  byId("importJobs").addEventListener("click", () => byId("importJobsFile").click());
  byId("importJobsFile").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try { const payload = JSON.parse(await file.text()); if (![1, 2].includes(payload?.schemaVersion) || !Array.isArray(payload.jobs)) throw new Error("지원하지 않는 작업 JSON 형식입니다."); await store.importJobs(payload.jobs); await renderJobList(); setStatus(`JSON에서 작업 ${payload.jobs.length}건을 불러왔습니다.`); } catch (error) { setStatus(`JSON 불러오기 실패: ${error.message}`, true); }
    event.target.value = "";
  });

  renderJobList().catch(error => setStatus(`저장소 초기화 실패: ${error.message}`, true));
  store.subscribe(() => renderJobList());
})();
