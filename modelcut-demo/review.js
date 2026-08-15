(function () {
  "use strict";

  const store = window.ModelcutStore;
  const reviewKey = "nice-modelcut-review-v1";
  const scoreFields = ["colorMatch", "lengthMatch", "detailMatch", "fabricMatch", "silhouetteMatch"];
  const statuses = ["입력중", "프롬프트 준비", "생성 대기", "후보 검토", "승인 후보", "조건부 승인", "재생성", "반려", "승인", "보류", "reference 재선정", "제외"];
  let states = safeStoredStates();
  let showSamples = false;
  let sampleData = null;

  const byId = id => document.getElementById(id);
  const escapeHtml = input => String(input ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

  function safeStoredStates() {
    try { return JSON.parse(localStorage.getItem(reviewKey) || "{}"); }
    catch { return {}; }
  }

  function options(values, selected) {
    return values.map(value => `<option${value === selected ? " selected" : ""}>${escapeHtml(value || "-")}</option>`).join("");
  }

  function gallery(label, imageSources) {
    const validImages = (imageSources || []).filter(Boolean);
    return `<section class="group"><h3>${escapeHtml(label)} · ${validImages.length}장</h3><div class="gallery">${validImages.map(source => `<img src="${escapeHtml(source)}" alt="${escapeHtml(label)}" loading="lazy">`).join("") || '<div class="image-empty">이미지 연결 대기</div>'}</div></section>`;
  }

  function readable(value) {
    if (Array.isArray(value)) return value.join(", ") || "미입력";
    return String(value || "미입력");
  }

  function analysisDetails(item) {
    const analysis = item.analysis || {};
    const fields = [
      ["상의 컬러", analysis.topColor || item.topColor], ["하의 컬러", analysis.bottomColor || item.bottomColor],
      ["상의 기장", analysis.topLength], ["하의 기장", analysis.bottomLength],
      ["상의 실루엣", analysis.topSilhouette], ["하의 실루엣", analysis.bottomSilhouette],
      ["상의 디테일", analysis.topDetails], ["하의 디테일", analysis.bottomDetails],
      ["소재", analysis.fabricKeywords], ["반드시 보존", analysis.mustPreserve], ["생성 금지", analysis.avoidList],
    ];
    return `<details class="analysis"><summary>상품 분석${item.referenceCount ? ` · 참고 ${item.referenceCount}장` : ""}</summary><ul class="analysis-list">${fields.map(([label, value]) => `<li><strong>${label}</strong><br>${escapeHtml(readable(value))}</li>`).join("")}</ul></details>`;
  }

  function requestSummary(item) {
    const request = item.generationRequest;
    if (!request) return '<section class="request-summary legacy"><div><span class="request-label">3 · 모델컷 생성 요청</span><h3>기존 테스트 데이터</h3></div><p>생성 요청 패키지가 없는 이전 샘플입니다.</p></section>';
    const preserve = readable(request.analysis?.mustPreserve);
    const avoid = readable(request.analysis?.avoidList);
    return `<section class="request-summary"><div><span class="request-label">3 · 모델컷 생성 요청</span><h3>생성 요청 패키지 준비 완료</h3></div><div class="request-stats"><span>상의 ${request.topImages?.length || 0}장</span><span>하의 ${request.bottomImages?.length || 0}장</span><span>참고 ${request.referenceImages?.length || 0}장</span><span>정면 전신컷</span></div><p><strong>반드시 보존</strong> ${escapeHtml(preserve)}</p><p><strong>생성 금지</strong> ${escapeHtml(avoid)}</p></section>`;
  }

  function candidateGallery(item) {
    const candidates = item.candidateImages?.length ? item.candidateImages : (item.candidateImage ? [{ src: item.candidateImage, role: item.candidateRole || "후보 1" }] : []);
    return `<section class="candidate-section"><div class="section-heading"><span>4 · 생성 결과</span><h3>생성된 모델컷 후보 · ${candidates.length}장</h3></div><div class="candidate-gallery">${candidates.map((candidate, index) => `<figure><img src="${escapeHtml(candidate.src)}" alt="${escapeHtml(candidate.role || `후보 ${index + 1}`)}" loading="lazy"><figcaption>${escapeHtml(candidate.role || `후보 ${index + 1}`)}</figcaption></figure>`).join("") || '<div class="image-empty">생성 결과 업로드 대기</div>'}</div></section>`;
  }

  function renderItem(item) {
    const saved = states[item.candidateId] || {};
    const state = { ...item, ...saved, scores: { ...item.scores, ...(saved.scores || {}) } };
    const checks = scoreFields.map(field => `<label class="check"><span>${({ colorMatch: "컬러", lengthMatch: "기장", detailMatch: "디테일", fabricMatch: "원단", silhouetteMatch: "실루엣" })[field]}</span><select data-score="${field}">${options(["O", "△", "X", ""], state.scores[field])}</select></label>`).join("");
    const userBadge = item.source === "admin" ? '<span class="source">사용자 작업</span>' : "";
    const promptDetails = item.prompt ? `<details class="analysis"><summary>모델컷 생성 프롬프트 보기</summary><div class="prompt-text">${escapeHtml(item.prompt)}</div></details>` : "";
    return `<article id="card-${escapeHtml(item.candidateId)}" class="card${item.source === "admin" ? " user-card" : ""}" data-id="${escapeHtml(item.candidateId)}"><div class="card-head"><div><p class="code">${escapeHtml(item.candidateId)}${userBadge}</p><h2>${escapeHtml(item.topName || item.topCode)} + ${escapeHtml(item.bottomName || item.bottomCode)}</h2><p class="combo">${escapeHtml(item.topCode)}${item.topColor ? ` · ${escapeHtml(item.topColor)}` : ""} / ${escapeHtml(item.bottomCode)}${item.bottomColor ? ` · ${escapeHtml(item.bottomColor)}` : ""}</p></div><select name="status" class="status">${options(statuses, state.status)}</select></div><div class="input-heading"><span>1–2 · 실제 제품 입력</span><strong>생성 전</strong></div><div class="comparison inputs">${gallery("실제 상의", item.topImages)}${gallery("실제 하의", item.bottomImages)}</div>${requestSummary(item)}${candidateGallery(item)}<div class="qa-heading"><span>5 · 검수 상태</span><strong>생성 후 검토</strong></div><div class="checks">${checks}</div><div class="edit"><label>승인/보류 메모<textarea name="memo" rows="3">${escapeHtml(state.memo)}</textarea></label><label>재생성 메모<textarea name="regenerationMemo" rows="3">${escapeHtml(state.regenerationMemo)}</textarea></label><label class="approve"><input type="checkbox" name="approved"${state.approved ? " checked" : ""}> 최종 승인</label></div>${analysisDetails(item)}${promptDetails}</article>`;
  }

  function enforce(card, scores) {
    const passCount = Object.values(scores).filter(value => value === "O").length;
    const hardFail = ["colorMatch", "lengthMatch", "detailMatch", "silhouetteMatch"].some(field => scores[field] === "X");
    const approved = card.querySelector('[name="approved"]');
    approved.disabled = hardFail || passCount < 3;
    if (approved.disabled) approved.checked = false;
    const status = card.querySelector('[name="status"]');
    if (["승인", "승인 후보"].includes(status.value) && (hardFail || passCount < 4)) status.value = hardFail ? "반려" : "후보 검토";
    if (status.value === "조건부 승인" && (hardFail || passCount < 3)) status.value = hardFail ? "반려" : "후보 검토";
  }

  function saveReviewState() {
    document.querySelectorAll(".card").forEach(card => {
      const scores = {};
      card.querySelectorAll("[data-score]").forEach(control => scores[control.dataset.score] = control.value);
      enforce(card, scores);
      states[card.dataset.id] = {
        status: card.querySelector('[name="status"]').value,
        approved: card.querySelector('[name="approved"]').checked,
        memo: card.querySelector('[name="memo"]').value,
        regenerationMemo: card.querySelector('[name="regenerationMemo"]').value,
        scores,
      };
    });
    localStorage.setItem(reviewKey, JSON.stringify(states));
  }

  async function loadBoard() {
    try {
      const userItems = await store.listReviewItems();
      if (showSamples && !sampleData) {
        const response = await fetch("data/review_items.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        sampleData = await response.json();
      }
      const samples = showSamples ? (sampleData?.items || []) : [];
      const items = [...userItems, ...samples];
      byId("notice").textContent = showSamples ? `저장 작업 ${userItems.length}건을 상단에 표시했습니다. · 테스트 샘플 ${samples.length}건 표시 중` : `저장 작업 ${userItems.length}건만 표시 중입니다. 테스트 샘플 10건은 기본 화면에서 숨겨져 있습니다.`;
      byId("toggleSamples").textContent = showSamples ? "샘플 숨기기" : "샘플 데이터 불러오기";
      byId("grid").innerHTML = items.length ? items.map(renderItem).join("") : '<div class="board-empty"><h2>아직 저장된 작업이 없습니다.</h2><p>새 작업 만들기에서 상품코드와 이미지를 넣고 저장하면<br>이곳에 검토 카드가 나타납니다.</p><a class="button" href="admin.html">새 작업 만들기</a></div>';
      document.querySelectorAll(".card").forEach(card => {
        const scores = {};
        card.querySelectorAll("[data-score]").forEach(control => scores[control.dataset.score] = control.value);
        enforce(card, scores);
      });
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "start" });
    } catch (error) {
      byId("grid").innerHTML = `<div class="error">README의 HTTP 서버 명령으로 열어 주세요. (${escapeHtml(error.message)})</div>`;
    }
  }

  byId("grid").addEventListener("change", saveReviewState);
  byId("grid").addEventListener("input", saveReviewState);
  byId("toggleSamples").addEventListener("click", async () => {
    showSamples = !showSamples;
    await loadBoard();
  });
  byId("export").addEventListener("click", () => {
    saveReviewState();
    store.downloadText(JSON.stringify({ schemaVersion: 1, items: states }, null, 2), "modelcut_review_state.json", "application/json;charset=utf-8");
  });
  byId("import").addEventListener("click", () => byId("importFile").click());
  byId("importFile").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.schemaVersion !== 1 || !payload.items || Array.isArray(payload.items) || typeof payload.items !== "object") throw new Error("지원하지 않는 검토 상태 형식입니다.");
      states = { ...payload.items };
      localStorage.setItem(reviewKey, JSON.stringify(states));
      await loadBoard();
    } catch (error) {
      alert(`JSON 불러오기 실패: ${error.message}`);
    }
    event.target.value = "";
  });

  loadBoard();
  store.subscribe(() => loadBoard());
})();
