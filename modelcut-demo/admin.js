(function () {
  "use strict";

  const store = window.ModelcutStore;
  const limits = { top: 5, bottom: 5, reference: 3, candidate: 3 };
  const fileInputs = { top: "topFiles", bottom: "bottomFiles", reference: "referenceFiles", candidate: "candidateFiles" };
  const previewTargets = { top: "topPreviews", bottom: "bottomPreviews", reference: "referencePreviews", candidate: "candidatePreviews" };
  const roleOptions = {
    top: ["상의 정면", "상의 디테일", "상의 후면", "상의 원단", "상의 기타"],
    bottom: ["하의 정면", "하의 디테일", "하의 후면", "하의 원단", "하의 기타"],
    reference: ["참고 이미지 1", "참고 이미지 2", "참고 이미지 3"],
    candidate: ["생성 후보 1", "생성 후보 2", "생성 후보 3"],
  };
  const sourceAnalysisMap = {
    topColor: "topColor",
    bottomColor: "bottomColor",
    topLength: "topLength",
    bottomLength: "bottomLength",
    topSilhouette: "topSilhouette",
    bottomSilhouette: "bottomSilhouette",
    topDetails: "topDetails",
    bottomDetails: "bottomDetails",
    fabricKeywords: "fabricKeywords",
    mustPreserve: "mustPreserve",
    avoidList: "avoidList",
  };
  const arrayAnalysisFields = new Set(["topDetails", "bottomDetails", "fabricKeywords", "mustPreserve", "avoidList"]);
  const images = { top: [], bottom: [], reference: [], candidate: [] };
  const editedAnalysis = new Set();

  const byId = id => document.getElementById(id);
  const value = id => byId(id).value.trim();
  const escapeHtml = input => String(input ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

  function setStatus(message, error = false) {
    const target = byId("statusLine");
    target.textContent = message;
    target.classList.toggle("error", error);
  }

  function analysisControl(field) {
    return document.querySelector(`[data-analysis="${field}"]`);
  }

  function setAnalysisValue(field, nextValue, force = false) {
    if (!force && editedAnalysis.has(field)) return;
    analysisControl(field).value = Array.isArray(nextValue) ? nextValue.join(", ") : nextValue;
  }

  function generateAnalysis(force = false) {
    if (force) editedAnalysis.clear();
    Object.entries(sourceAnalysisMap).forEach(([field, sourceId]) => {
      const sourceValue = value(sourceId);
      setAnalysisValue(field, arrayAnalysisFields.has(field) ? store.splitKeywords(sourceValue) : sourceValue, force);
    });
    return collectAnalysis();
  }

  function collectAnalysis() {
    const analysis = {};
    document.querySelectorAll("[data-analysis]").forEach(control => {
      const field = control.dataset.analysis;
      analysis[field] = arrayAnalysisFields.has(field) ? store.splitKeywords(control.value) : control.value.trim();
    });
    return analysis;
  }

  function previewCard(type, image, index) {
    const options = roleOptions[type].map(role => `<option${role === image.role ? " selected" : ""}>${escapeHtml(role)}</option>`).join("");
    return `<article class="preview" data-type="${type}" data-index="${index}"><img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.role)}"><button type="button" class="remove" aria-label="${escapeHtml(image.role)} 삭제">×</button><select aria-label="이미지 역할">${options}</select></article>`;
  }

  function renderPreviews(type) {
    byId(previewTargets[type]).innerHTML = images[type].map((image, index) => previewCard(type, image, index)).join("");
  }

  async function addFiles(type, selectedFiles) {
    const remaining = limits[type] - images[type].length;
    const files = Array.from(selectedFiles).slice(0, Math.max(remaining, 0));
    if (!files.length) {
      setStatus(`${type} 이미지는 최대 ${limits[type]}장까지 선택할 수 있습니다.`, true);
      return;
    }
    setStatus(`${files.length}개 이미지를 읽는 중입니다.`);
    const converted = await Promise.all(files.map((file, offset) => store.fileToImage(file, roleOptions[type][images[type].length + offset])));
    images[type].push(...converted);
    renderPreviews(type);
    setStatus(`${files.length}개 이미지 미리보기를 추가했습니다.`);
  }

  function imageRoleLines(type) {
    return images[type].map((image, index) => `${index + 1}. ${image.role} (${image.name})`).join("\n") || "없음";
  }

  function generatePrompt() {
    const analysis = generateAnalysis(false);
    const prompt = `[NICE 모델컷 생성 작업]
작업 ID: ${value("jobId") || "미입력"}
상의: ${value("topCode")} / ${value("topName")} / ${analysis.topColor}
하의: ${value("bottomCode")} / ${value("bottomName")} / ${analysis.bottomColor}

[실제 제품 이미지 역할]
상의 이미지:
${imageRoleLines("top")}

하의 이미지:
${imageRoleLines("bottom")}

참고 이미지(포즈/무드 전용):
${imageRoleLines("reference")}

[상품 분석]
- topColor: ${analysis.topColor}
- bottomColor: ${analysis.bottomColor}
- topLength: ${analysis.topLength}
- bottomLength: ${analysis.bottomLength}
- topSilhouette: ${analysis.topSilhouette}
- bottomSilhouette: ${analysis.bottomSilhouette}
- topDetails: ${analysis.topDetails.join(", ")}
- bottomDetails: ${analysis.bottomDetails.join(", ")}
- fabricKeywords: ${analysis.fabricKeywords.join(", ")}
- mustPreserve: ${analysis.mustPreserve.join(", ")}
- avoidList: ${analysis.avoidList.join(", ")}

[필수 생성 원칙]
1. 실제 제품 사진을 최우선 기준으로 생성할 것.
2. 실제 제품에 없는 컬러를 생성하지 말 것. Do not invent new colors.
3. 실제 제품에 없는 디테일을 추가하지 말 것.
4. 상의와 하의의 실제 기장 및 실루엣을 유지할 것.
5. 참고 이미지는 포즈와 무드 참고용일 뿐 상품 컬러·구조·디테일의 기준으로 사용하지 말 것.
6. 예쁜 분위기보다 실제 상품 일치도를 최우선으로 할 것. Prioritize exact product matching over beauty or mood.
7. 프릴, 리본, 버튼, 포켓, 컵라인, 절개, 셔링, 튤 레이어와 원단 질감을 임의로 단순화하거나 교체하지 말 것.

[메모]
${value("memo") || "없음"}`;
    byId("prompt").value = prompt;
    if (byId("status").value === "입력중") byId("status").value = "프롬프트 준비";
    setStatus("상품 분석을 반영한 생성 프롬프트를 만들었습니다.");
    return prompt;
  }

  function collectJob() {
    return {
      schemaVersion: 1,
      jobId: value("jobId"),
      topCode: value("topCode"),
      bottomCode: value("bottomCode"),
      topName: value("topName"),
      bottomName: value("bottomName"),
      topColor: value("topColor"),
      bottomColor: value("bottomColor"),
      fabricKeywords: store.splitKeywords(value("fabricKeywords")),
      topDetails: store.splitKeywords(value("topDetails")),
      bottomDetails: store.splitKeywords(value("bottomDetails")),
      topLength: value("topLength"),
      bottomLength: value("bottomLength"),
      topSilhouette: value("topSilhouette"),
      bottomSilhouette: value("bottomSilhouette"),
      mustPreserve: store.splitKeywords(value("mustPreserve")),
      avoidList: store.splitKeywords(value("avoidList")),
      memo: value("memo"),
      status: byId("status").value,
      images: structuredClone(images),
      analysis: collectAnalysis(),
      prompt: byId("prompt").value.trim(),
    };
  }

  function validateJob(job) {
    const missing = ["jobId", "topCode", "bottomCode", "topName", "bottomName", "topColor", "bottomColor"].filter(field => !job[field]);
    if (missing.length) throw new Error(`필수 입력 누락: ${missing.join(", ")}`);
    if (!job.images.top.length || !job.images.bottom.length) throw new Error("상의와 하의 이미지를 각각 1장 이상 선택하세요.");
    if (job.images.top.length > 5 || job.images.bottom.length > 5 || job.images.reference.length > 3 || job.images.candidate.length > 3) throw new Error("이미지 최대 장수를 초과했습니다.");
  }

  function fillField(id, nextValue) {
    byId(id).value = Array.isArray(nextValue) ? nextValue.join(", ") : (nextValue || "");
  }

  async function loadJob(jobId) {
    const job = await store.getJob(jobId);
    if (!job) return;
    ["jobId", "topCode", "bottomCode", "topName", "bottomName", "topColor", "bottomColor", "topLength", "bottomLength", "topSilhouette", "bottomSilhouette", "memo", "status"].forEach(field => fillField(field, job[field]));
    ["fabricKeywords", "topDetails", "bottomDetails", "mustPreserve", "avoidList"].forEach(field => fillField(field, job[field]));
    Object.keys(images).forEach(type => {
      images[type] = structuredClone(job.images?.[type] || []);
      renderPreviews(type);
    });
    editedAnalysis.clear();
    Object.entries(job.analysis || {}).forEach(([field, fieldValue]) => setAnalysisValue(field, fieldValue, true));
    byId("prompt").value = job.prompt || "";
    setStatus(`${jobId} 작업을 편집 모드로 불러왔습니다.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function renderJobList() {
    const jobs = await store.listJobs();
    byId("jobList").innerHTML = jobs.length ? jobs.map(job => `<article class="job-item"><strong>${escapeHtml(job.jobId)}</strong><span>${escapeHtml(job.topCode)} + ${escapeHtml(job.bottomCode)} · ${escapeHtml(job.status)}</span><button type="button" data-load-job="${escapeHtml(job.jobId)}">입력값 편집</button></article>`).join("") : '<p class="empty">저장된 사용자 작업이 없습니다.</p>';
  }

  function resetForm() {
    byId("jobForm").reset();
    Object.keys(images).forEach(type => {
      images[type] = [];
      renderPreviews(type);
    });
    editedAnalysis.clear();
    document.querySelectorAll("[data-analysis]").forEach(control => control.value = "");
    byId("prompt").value = "";
    byId("status").value = "입력중";
    setStatus("새 작업 입력을 시작합니다.");
  }

  Object.entries(fileInputs).forEach(([type, inputId]) => byId(inputId).addEventListener("change", async event => {
    try { await addFiles(type, event.target.files); } catch (error) { setStatus(`이미지 처리 실패: ${error.message}`, true); }
    event.target.value = "";
  }));

  Object.values(previewTargets).forEach(targetId => byId(targetId).addEventListener("click", event => {
    const remove = event.target.closest(".remove");
    if (!remove) return;
    const card = remove.closest(".preview");
    images[card.dataset.type].splice(Number(card.dataset.index), 1);
    images[card.dataset.type].forEach((image, index) => {
      if (roleOptions[card.dataset.type].includes(image.role)) image.role = roleOptions[card.dataset.type][index];
    });
    renderPreviews(card.dataset.type);
  }));

  Object.values(previewTargets).forEach(targetId => byId(targetId).addEventListener("change", event => {
    if (!event.target.matches("select")) return;
    const card = event.target.closest(".preview");
    images[card.dataset.type][Number(card.dataset.index)].role = event.target.value;
  }));

  Object.values(sourceAnalysisMap).forEach(sourceId => byId(sourceId).addEventListener("input", () => generateAnalysis(false)));
  document.querySelectorAll("[data-analysis]").forEach(control => control.addEventListener("input", () => editedAnalysis.add(control.dataset.analysis)));
  byId("generateAnalysis").addEventListener("click", () => { generateAnalysis(true); setStatus("상품 분석 요약을 입력값으로 다시 생성했습니다."); });
  byId("generatePrompt").addEventListener("click", generatePrompt);
  byId("downloadPrompt").addEventListener("click", () => {
    const prompt = byId("prompt").value.trim() || generatePrompt();
    const filename = `${value("jobId") || "modelcut_job"}_prompt.txt`;
    store.downloadText(prompt, filename);
    setStatus(`${filename} 다운로드를 시작했습니다.`);
  });
  byId("resetForm").addEventListener("click", resetForm);

  byId("jobForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      if (!byId("prompt").value.trim()) generatePrompt();
      const job = collectJob();
      validateJob(job);
      await store.putJob(job);
      await renderJobList();
      setStatus(`${job.jobId} 작업을 IndexedDB에 저장했습니다. 검토판에서 바로 확인할 수 있습니다.`);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  byId("jobList").addEventListener("click", event => {
    const button = event.target.closest("[data-load-job]");
    if (button) loadJob(button.dataset.loadJob).catch(error => setStatus(error.message, true));
  });

  byId("exportJobs").addEventListener("click", async () => {
    try {
      const jobs = await store.listJobs();
      store.downloadText(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), jobs }, null, 2), "modelcut_jobs_export.json", "application/json;charset=utf-8");
      setStatus(`전체 작업 ${jobs.length}건의 JSON 다운로드를 시작했습니다.`);
    } catch (error) { setStatus(error.message, true); }
  });

  byId("importJobs").addEventListener("click", () => byId("importJobsFile").click());
  byId("importJobsFile").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.schemaVersion !== 1 || !Array.isArray(payload.jobs)) throw new Error("지원하지 않는 작업 JSON 형식입니다.");
      payload.jobs.forEach(validateJob);
      await store.importJobs(payload.jobs);
      await renderJobList();
      setStatus(`JSON에서 작업 ${payload.jobs.length}건을 불러왔습니다.`);
    } catch (error) { setStatus(`JSON 불러오기 실패: ${error.message}`, true); }
    event.target.value = "";
  });

  generateAnalysis(true);
  renderJobList().catch(error => setStatus(`저장소 초기화 실패: ${error.message}`, true));
  store.subscribe(() => renderJobList());
})();
