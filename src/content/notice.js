/**
 * OGS Plus - 화면 토스트 알림 헬퍼
 * 저장 완료, 베타 미리보기 적용 등 짧은 피드백을 위한 작은 토스트 UI.
 */
(function (global) {
  "use strict";

  function ensureContainer() {
    let c = document.getElementById("ogsplus-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "ogsplus-toast-container";
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type = "info", duration = 2600) {
    const container = ensureContainer();
    const toast = document.createElement("div");
    toast.className = `ogsplus-toast ogsplus-toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("ogsplus-toast-show"));
    setTimeout(() => {
      toast.classList.remove("ogsplus-toast-show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  global.OGSPlusToast = { showToast };
})(typeof window !== "undefined" ? window : globalThis);
