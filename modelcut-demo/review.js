(function () {
  "use strict";

  const store = window.ModelcutStore;
  const reviewKey = "nice-modelcut-review-v1";
  const scoreFields = ["colorMatch", "lengthMatch", "detailMatch", "fabricMatch", "silhouetteMatch"];
  const statuses = ["입력중", "프롬프트 준비", "생성 대기", "후보 검토", "승인 후보", "조건부 승인", "재생성", "반려", "승인", "보류", "reference 재선정", "제외"];
  let states = safeStoredStates();

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
    return `<section class="group"><h3>${escapeHtml(label)} · ${validImages.length}장</h3><div class="gallery">${validImages.map(source => `<img src="${escapeHtml(source)}" alt="${escapeHtml(label)}" loading="lazy">`).join("") || '<div class="empty">이미지 연결 대기</div>'}</div></section>`;
  }

  function renderItem(item) {
    const saved = states[item.candidateId] || {};
    const state = { ...item, ...saved, scores: { ...item.scores, ...(saved.scores || {}) } };
    const checks = scoreFields.map(field => `<label class="check"><span>${({ colorMatch: "컬러", lengthMatch: "기장", detailMatch: "디테일", fabricMatch: "원단", silhouetteMatch: "실루엣" })[field]}</span><select data-score="${field}">${options(["O", "△", "X", ""], state.scores[field])}</select></label>`).join("");
    const userBadge = item.source === "admin" ? '<span class="source">사용자 작업</span>' : "";
    const promptDetails = item.prompt ? `<details class="analysis"><summary>모델컷 생성 프롬프트</summary><pre>${escapeHtml(item.prompt)}</pre></details>` : "";
    return `<article id="card-${escapeHtml(item.candidateId)}" class="card${item.source === "admin" ? " user-card" : ""}" data-id="${escapeHtml(item.candidateId)}"><div class="card-head"><div><p class="code">${escapeHtml(item.candidateId)}${userBadge}</p><h2>${escapeHtml(item.topName)} + ${escapeHtml(item.bottomName)}</h2><p class="combo">${escapeHtml(item.topCode)} · ${escapeHtml(item.topColor)} / ${escapeHtml(item.bottomCode)} · ${escapeHtml(item.bottomColor)}</p></div><select name="status" class="status">${options(statuses, state.status)}</select></div><div class="comparison">${gallery("실제 상의", item.topImages)}${gallery("실제 하의", item.bottomImages)}${gallery(item.candidateRole || "생성 모델컷", item.candidateImage ? [item.candidateImage] : [])}</div><div class="checks">${checks}</div><div class="edit"><label>검토 메모<textarea name="memo" rows="3">${escapeHtml(state.memo)}</textarea></label><label>재생성 메모<textarea name="regenerationMemo" rows="3">${escapeHtml(state.regenerationMemo)}</textarea></label><label class="approve"><input type="checkbox" name="approved"${state.approved ? " checked" : ""}> 최종 승인</label></div><details class="analysis"><summary>상품 분석${item.referenceCount ? ` · 참고 ${item.referenceCount}장` : ""}</summary><pre>${escapeHtml(JSON.stringify(item.analysis, null, 2))}</pre></details>${promptDetails}</article>`;
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
      const response = await fetch("data/review_items.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const sample = await response.json();
      const userItems = await store.listReviewItems();
      const items = [...sample.items, ...userItems];
      byId("title").textContent = sample.title;
      byId("notice").textContent = `${sample.notice} · 샘플 ${sample.items.length}건 · 사용자 후보 ${userItems.length}건 · 전체 ${items.length}건`;
      byId("grid").innerHTML = items.map(renderItem).join("");
      document.querySelectorAll(".card").forEach(card => {
        const scores = {};
        card.querySelectorAll("[data-score]").forEach(control => scores[control.dataset.score] = control.value);
        enforce(card, scores);
      });
    } catch (error) {
      byId("grid").innerHTML = `<div class="error">README의 HTTP 서버 명령으로 열어 주세요. (${escapeHtml(error.message)})</div>`;
    }
  }

  byId("grid").addEventListener("change", saveReviewState);
  byId("grid").addEventListener("input", saveReviewState);
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
