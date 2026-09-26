/**
 * OGS Plus - 커스텀 스타일시트 기능
 * 1) "베타 미리보기": 현재 페이지에 즉시 <style> 태그로 적용해서 실시간으로 확인
 * 2) "수락(Approve)": 실제로 자신의 프로필 About 텍스트에 <style> 블록을 자동 삽입/치환
 *    (마커 주석으로 감싸서 재적용 시 중복되지 않고 갱신됨)
 */
(function (global) {
  "use strict";

  const Utils = global.OGSPlusUtils;
  const Toast = global.OGSPlusToast;

  const MARK_START = "<!-- OGSPLUS_CSS_START -->";
  const MARK_END = "<!-- OGSPLUS_CSS_END -->";
  const PREVIEW_STYLE_ID = "ogsplus-css-preview-style";

  function applyPreview(css) {
    let styleTag = document.getElementById(PREVIEW_STYLE_ID);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = PREVIEW_STYLE_ID;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css || "";
  }

  function removePreview() {
    const styleTag = document.getElementById(PREVIEW_STYLE_ID);
    if (styleTag) styleTag.remove();
  }

  function buildAboutBlock(css) {
    return `${MARK_START}\n<style>\n${css}\n</style>\n${MARK_END}`;
  }

  function mergeIntoAbout(existingAbout, css) {
    const block = buildAboutBlock(css);
    const startIdx = existingAbout.indexOf(MARK_START);
    const endIdx = existingAbout.indexOf(MARK_END);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const before = existingAbout.slice(0, startIdx);
      const after = existingAbout.slice(endIdx + MARK_END.length);
      return `${before}${block}${after}`;
    }
    // 없으면 맨 뒤에 추가 (about이 비어있지 않으면 줄바꿈 두 번으로 구분)
    const sep = existingAbout && existingAbout.trim() ? "\n\n" : "";
    return `${existingAbout || ""}${sep}${block}`;
  }

  async function publishToAbout(css) {
    const userId = Utils.getCurrentUserId();
    if (!userId) {
      throw new Error("Could not determine current user id");
    }
    // 현재 about 내용을 가져온다
    const me = await Utils.apiFetch(`players/${userId}`);
    const existingAbout = me.about || "";
    const newAbout = mergeIntoAbout(existingAbout, css);
    await Utils.apiFetch(`players/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ about: newAbout }),
    });
    return newAbout;
  }

  async function removeFromAbout() {
    const userId = Utils.getCurrentUserId();
    if (!userId) throw new Error("Could not determine current user id");
    const me = await Utils.apiFetch(`players/${userId}`);
    const existingAbout = me.about || "";
    const startIdx = existingAbout.indexOf(MARK_START);
    const endIdx = existingAbout.indexOf(MARK_END);
    if (startIdx === -1 || endIdx === -1) return existingAbout;
    const before = existingAbout.slice(0, startIdx);
    const after = existingAbout.slice(endIdx + MARK_END.length);
    const newAbout = (before + after).trim();
    await Utils.apiFetch(`players/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ about: newAbout }),
    });
    return newAbout;
  }

  global.OGSPlusCustomCss = {
    applyPreview,
    removePreview,
    publishToAbout,
    removeFromAbout,
    MARK_START,
    MARK_END,
  };

  // 설정에서 이미 승인된 CSS가 있다면, 방문 시 프리뷰 스타일로 상시 적용
  // (이건 "현재 브라우저에서 즉시 보이게" 하기 위한 보조 기능이며,
  //  실제 다른 사용자에게 보이는 건 About에 저장된 <style> 블록임)
  Utils.loadSettings().then((settings) => {
    if (
      settings.masterEnabled &&
      settings.features.customCss &&
      settings.customCssApproved &&
      settings.customCssCode
    ) {
      applyPreview(settings.customCssCode);
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
