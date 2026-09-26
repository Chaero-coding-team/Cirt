/**
 * OGS Plus - 채팅/DM 이미지 링크 미리보기
 *
 * 대국 채팅(.chat-line), 채널 채팅(.ChatLine), DM 창(PrivateChat의 .chat-line)에
 * 게시된 이미지 URL을 감지해 안전한 <img> 미리보기를 추가한다.
 * (사용자가 의심스러운 링크를 직접 클릭하지 않아도 되도록)
 */
(function (global) {
  "use strict";

  const Utils = global.OGSPlusUtils;

  const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)(\?[^\s]*)?$/i;
  // 흔한 이미지 호스팅 서비스도 확장자 없이 지원 (imgur 등)
  const IMAGE_HOST_RE = /^(https?:\/\/)(i\.)?(imgur\.com|ibb\.co|prnt\.sc|gyazo\.com)\//i;

  const CHAT_LINE_SELECTOR = ".chat-line, .ChatLine";
  const processedLines = new WeakSet();

  function extractImageUrls(text) {
    if (!text) return [];
    const urls = [];
    const urlRe = /https?:\/\/[^\s<>"']+/gi;
    let m;
    while ((m = urlRe.exec(text)) !== null) {
      const url = m[0];
      if (IMAGE_EXT_RE.test(url) || IMAGE_HOST_RE.test(url)) {
        urls.push(url);
      }
    }
    return urls;
  }

  function openLightbox(src) {
    const overlay = Utils.createEl(
      "div",
      {
        class: "ogsplus-img-lightbox",
        onClick: () => overlay.remove(),
      },
      [Utils.createEl("img", { src })],
    );
    document.body.appendChild(overlay);
  }

  function buildPreview(url) {
    const wrap = Utils.createEl("div", { class: "ogsplus-img-preview-wrap" });
    const img = Utils.createEl("img", {
      class: "ogsplus-img-preview",
      src: url,
      loading: "lazy",
      referrerpolicy: "no-referrer",
      onClick: (e) => {
        e.stopPropagation();
        openLightbox(url);
      },
    });
    img.addEventListener("error", () => {
      wrap.remove();
    });
    const badge = Utils.createEl("div", {
      class: "ogsplus-img-preview-badge",
      text: "🖼 OGS Plus preview",
    });
    wrap.appendChild(img);
    wrap.appendChild(badge);
    return wrap;
  }

  function processLine(line) {
    if (processedLines.has(line)) return;
    const settings = Utils.getCachedSettings();
    if (!settings.masterEnabled || !settings.features.imagePreview) return;

    const bodyEl = line.querySelector(".body") || line;
    const text = bodyEl.textContent || "";
    const urls = extractImageUrls(text);
    if (urls.length === 0) {
      processedLines.add(line);
      return;
    }
    processedLines.add(line);
    // 최대 3개까지만 미리보기 (스팸 폭탄 방지)
    urls.slice(0, 3).forEach((url) => {
      line.appendChild(buildPreview(url));
    });
  }

  function scan() {
    document.querySelectorAll(CHAT_LINE_SELECTOR).forEach(processLine);
  }

  const debouncedScan = Utils.debounce(scan, 150);

  const observer = new MutationObserver(() => debouncedScan());
  observer.observe(document.body, { childList: true, subtree: true });

  scan();
})(typeof window !== "undefined" ? window : globalThis);
