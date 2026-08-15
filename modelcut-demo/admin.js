(function () {
  "use strict";

  const store = window.ModelcutStore;
  const limits = { top: 5, bottom: 5, reference: 3, candidate: 3 };
  const fileInputs = { top: "topFiles", bottom: "bottomFiles", candidate: "candidateFiles" };
  const previewTargets = { top: "topPreviews", bottom: "bottomPreviews", candidate: "candidatePreviews" };
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
  let analysisGenerated = false;

  const byId = id => document.getElementById(id);
  const value = id => byId(id).value.trim();
  const escapeHtml = input => String(input ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

  function setStatus(message, error = false) {
    const target = byId("statusLine");
    target.textContent = message;
    target.classList.toggle("error", error);
    if (error) byId("saveSuccess").classList.add("hidden");
  }

  function fillAdvancedDefaults() {
    const defaults = {
      fabricKeywords: "실제 제품 사진 기준 원단 질감",
      topDetails: "실제 상의 이미지의 프릴, 리본, 버튼, 컵라인, 절개 등 핵심 디테일 보존",
      bottomDetails: "실제 하의 이미지의 허리선, 포켓, 버튼, 플리츠, 튤 레이어 등 핵심 디테일 보존",
      topLength: "실제 상의 이미지 기준 기장",
      bottomLength: "실제 하의 이미지 기준 기장",
      topSilhouette: "실제 상의 이미지 기준 실루엣",
      bottomSilhouette: "실제 하의 이미지 기준 실루엣",
      mustPreserve: [value("topColor") && `상의 ${value("topColor")} 컬러`, value("bottomColor") && `하의 ${value("bottomColor")} 컬러`, "실제 기장", "실제 실루엣", "이미지에 보이는 핵심 디테일"].filter(Boolean).join(", "),
      avoidList: "입력에 없는 컬러, 실제에 없는 디테일, 기장 변경, 실루엣 변경",
    };
    Object.entries(defaults).forEach(([field, defaultValue]) => {
      if (!value(field)) byId(field).value = defaultValue;
    });
  }

  function analysisControl(field) {
    return document.querySelector(`[data-analysis="${field}"]`);
  }

  function setAnalysisValue(field, nextValue, force = false) {
    if (!force && editedAnalysis.has(field)) return;
    analysisControl(field).value = Array.isArray(nextValue) ? nextValue.join(", ") : nextValue;
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
상의: ${value("topCode")} / ${value("topName") || "상품명 미입력"} / ${analysis.topColor || "컬러 미입력"}
하의: ${value("bottomCode")} / ${value("bottomName") || "상품명 미입력"} / ${analysis.bottomColor || "컬러 미입력"}

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
    byId("promptResult").classList.remove("hidden");
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
    const labels = { jobId: "작업 ID", topCode: "상의 코드", bottomCode: "하의 코드" };
    const missing = Object.keys(labels).filter(field => !job[field]).map(field => labels[field]);
    if (!job.images.top.length) missing.push("상의 이미지");
    if (!job.images.bottom.length) missing.push("하의 이미지");
    if (!job.images.candidate.length) missing.push("생성 모델컷 후보 이미지");
    if (missing.length) throw new Error(`저장할 수 없습니다.\n${missing.join(", ")}를 확인해주세요.`);
    if (job.images.top.length > 5 || job.images.bottom.length > 5 || job.images.reference.length > 3 || job.images.candidate.length > 3) throw new Error("이미지 최대 장수를 초과했습니다.");
  }

  async function renderJobList() {
    const jobs = await store.listJobs();
    byId("jobList").innerHTML = jobs.length ? jobs.map(job => `<article class="job-item"><strong>${escapeHtml(job.jobId)}</strong><span>${escapeHtml(job.topCode)} + ${escapeHtml(job.bottomCode)}</span><span>상태: ${escapeHtml(job.status)}</span><div class="job-actions"><a href="index.html#card-${encodeURIComponent(job.jobId)}_candidate_01">검토판에서 보기</a><button type="button" class="delete" data-delete-job="${escapeHtml(job.jobId)}">삭제</button></div></article>`).join("") : '<p class="empty">아직 저장된 작업이 없습니다.<br><br>왼쪽에서 상품코드와 이미지를 넣고<br>[작업 저장하기]를 누르면 여기에 표시됩니다.</p>';
  }

  function resetForm() {
    byId("jobForm").reset();
    Object.keys(images).forEach(type => { images[type] = []; });
    Object.keys(previewTargets).forEach(type => {
      renderPreviews(type);
    });
    editedAnalysis.clear();
    document.querySelectorAll("[data-analysis]").forEach(control => control.value = "");
    byId("prompt").value = "";
    byId("status").value = "입력중";
    analysisGenerated = false;
    byId("analysisResult").classList.add("hidden");
    byId("promptResult").classList.add("hidden");
    byId("advancedSettings").open = false;
    byId("saveSuccess").classList.add("hidden");
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

  document.querySelectorAll("[data-upload-type]").forEach(dropzone => {
    dropzone.addEventListener("dragover", event => { event.preventDefault(); dropzone.classList.add("dragover"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", async event => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
      try { await addFiles(dropzone.dataset.uploadType, event.dataTransfer.files); }
      catch (error) { setStatus(`이미지 처리 실패: ${error.message}`, true); }
    });
  });

  Object.values(sourceAnalysisMap).forEach(sourceId => byId(sourceId).addEventListener("input", () => { if (analysisGenerated) generateAnalysis(false); }));
  document.querySelectorAll("[data-analysis]").forEach(control => control.addEventListener("input", () => editedAnalysis.add(control.dataset.analysis)));
  byId("generateAnalysis").addEventListener("click", () => { generateAnalysis(true); setStatus("상품 분석 자동 생성이 완료되었습니다. 필요하면 결과를 직접 수정하세요."); });
  byId("generatePrompt").addEventListener("click", generatePrompt);
  byId("focusImages").addEventListener("click", () => {
    byId("imageStep").scrollIntoView({ behavior: "smooth", block: "start" });
    byId("topFiles").focus();
    setStatus("상의, 하의, 생성 모델컷 후보 이미지를 차례로 넣어주세요.");
  });
  byId("copyPrompt").addEventListener("click", async () => {
    const prompt = byId("prompt").value.trim() || generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("프롬프트를 클립보드에 복사했습니다.");
    } catch {
      byId("prompt").focus();
      byId("prompt").select();
      document.execCommand("copy");
      setStatus("프롬프트를 클립보드에 복사했습니다.");
    }
  });
  byId("downloadPrompt").addEventListener("click", () => {
    const prompt = byId("prompt").value.trim() || generatePrompt();
    const filename = `${value("jobId") || "modelcut_job"}_prompt.txt`;
    store.downloadText(prompt, filename);
    setStatus(`${filename} 다운로드를 시작했습니다.`);
  });
  byId("resetTop").addEventListener("click", resetForm);

  byId("jobForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      if (!byId("prompt").value.trim()) generatePrompt();
      const job = collectJob();
      validateJob(job);
      await store.putJob(job);
      await renderJobList();
      const message = "저장 완료: 작업이 브라우저에 저장되었습니다. 검토판에서 확인할 수 있습니다.";
      setStatus(message);
      byId("savedMessage").textContent = message;
      byId("savedReviewLink").href = `index.html#card-${encodeURIComponent(job.jobId)}_candidate_01`;
      byId("saveSuccess").classList.remove("hidden");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  byId("jobList").addEventListener("click", event => {
    const deleteButton = event.target.closest("[data-delete-job]");
    if (deleteButton && confirm(`${deleteButton.dataset.deleteJob} 작업을 브라우저에서 삭제할까요?`)) {
      store.deleteJob(deleteButton.dataset.deleteJob).then(() => {
        if (value("jobId") === deleteButton.dataset.deleteJob) resetForm();
        return renderJobList();
      }).then(() => setStatus(`${deleteButton.dataset.deleteJob} 작업을 삭제했습니다.`)).catch(error => setStatus(error.message, true));
    }
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

  renderJobList().catch(error => setStatus(`저장소 초기화 실패: ${error.message}`, true));
  store.subscribe(() => renderJobList());
})();
