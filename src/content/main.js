/**
 * OGS Plus - content script 진입점(오케스트레이터)
 * 설정을 로드해 캐시하고, storage 변경을 감지해 캐시를 갱신한다.
 * 각 기능 스크립트는 Utils.getCachedSettings()를 통해 항상 최신 상태를 읽는다.
 */
(function (global) {
  "use strict";
  const Utils = global.OGSPlusUtils;
  const Storage = global.OGSPlusStorage;

  Utils.loadSettings().then(() => {
    console.log("[OGS Plus] settings loaded");
  });

  Storage.onSettingsChanged((newVal) => {
    // utils.js의 cachedSettings를 직접 갱신
    Utils.loadSettings();
    if (newVal && !newVal.masterEnabled) {
      const preview = document.getElementById("ogsplus-css-preview-style");
      if (preview) preview.remove();
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
