(function (global) {
  "use strict";

  const DB_NAME = "nice-modelcut-demo";
  const DB_VERSION = 1;
  const STORE_NAME = "jobs";
  const CHANNEL_NAME = "nice-modelcut-jobs";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "jobId" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
    });
  }

  function announceChange() {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "jobs-changed" });
    channel.close();
  }

  async function listJobs() {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const jobs = await requestResult(transaction.objectStore(STORE_NAME).getAll());
    database.close();
    return jobs.sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
  }

  async function getJob(jobId) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const job = await requestResult(transaction.objectStore(STORE_NAME).get(jobId));
    database.close();
    return job;
  }

  async function putJob(job) {
    const existing = await getJob(job.jobId);
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const now = new Date().toISOString();
    store.put({ ...job, createdAt: existing?.createdAt || job.createdAt || now, updatedAt: now });
    await transactionComplete(transaction);
    database.close();
    announceChange();
  }

  async function importJobs(jobs) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const now = new Date().toISOString();
    jobs.forEach(job => store.put({ ...job, updatedAt: now, createdAt: job.createdAt || now }));
    await transactionComplete(transaction);
    database.close();
    announceChange();
  }

  async function deleteJob(jobId) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(jobId);
    await transactionComplete(transaction);
    database.close();
    announceChange();
  }

  function fileToImage(file, role) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: global.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        role,
        dataUrl: reader.result,
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function splitKeywords(value) {
    return String(value || "").split(/[\n,]/).map(item => item.trim()).filter(Boolean);
  }

  function downloadText(content, filename, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function imageSource(image) {
    return image?.dataUrl || image?.src || "";
  }

  function reviewItemsForJob(job) {
    const candidates = job.images?.candidate?.length ? job.images.candidate : [null];
    return candidates.map((candidate, index) => ({
      candidateId: `${job.jobId}_candidate_${String(index + 1).padStart(2, "0")}`,
      targetCode: job.jobId,
      topCode: job.topCode,
      topName: job.topName,
      topColor: job.topColor,
      bottomCode: job.bottomCode,
      bottomName: job.bottomName,
      bottomColor: job.bottomColor,
      topImages: (job.images?.top || []).map(imageSource),
      bottomImages: (job.images?.bottom || []).map(imageSource),
      referenceImages: (job.images?.reference || []).map(imageSource),
      candidateImage: imageSource(candidate),
      candidateRole: candidate?.role || `생성 후보 ${index + 1}`,
      analysis: job.analysis || {},
      prompt: job.prompt || "",
      scores: { colorMatch: "", lengthMatch: "", detailMatch: "", fabricMatch: "", silhouetteMatch: "" },
      evaluation: { passCount: 0, hardFail: false, hardFailReasons: [], recommendation: "후보 검토" },
      status: job.status || "입력중",
      approved: false,
      memo: job.memo || "",
      regenerationMemo: "",
      source: "admin",
      referenceCount: (job.images?.reference || []).length,
    }));
  }

  async function listReviewItems() {
    return (await listJobs()).flatMap(reviewItemsForJob);
  }

  function subscribe(callback) {
    if (typeof BroadcastChannel === "undefined") return () => {};
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", callback);
    return () => channel.close();
  }

  global.ModelcutStore = {
    listJobs,
    getJob,
    putJob,
    importJobs,
    deleteJob,
    listReviewItems,
    fileToImage,
    splitKeywords,
    downloadText,
    subscribe,
  };
})(window);
