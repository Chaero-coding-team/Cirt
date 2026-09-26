/**
 * OGS Plus - 해설자용 음성 → 채팅 자동 입력 기능
 *
 * 사용법: 시연 바둑판(/demo/ 또는 /review/ 경로)에서 수를 둔 뒤
 * Ctrl + Alt 를 누르고 있는 동안 마이크로 말하면, 설정에서 고른 언어로
 * 음성 인식된 텍스트가 채팅 입력창에 채워진다. 실제 전송(기록)은
 * 사용자가 직접 Enter를 눌러야만 이루어진다 (자동 전송하지 않음).
 */
(function (global) {
  "use strict";

  const Utils = global.OGSPlusUtils;
  const Toast = global.OGSPlusToast;

  const CHAT_INPUT_SELECTOR = 'textarea.chat-input, textarea#chat-input';

  let recognition = null;
  let isListening = false;
  let ctrlDown = false;
  let altDown = false;
  let baseValueBeforeListening = "";
  let indicatorEl = null;

  function isDemoOrReviewPage() {
    return /\/(demo|review)\//.test(window.location.pathname);
  }

  function getActiveChatInput() {
    // 포커스된 textarea가 채팅 인풋이면 그것을 우선 사용, 아니면 화면에서 첫번째 chat-input을 사용
    const active = document.activeElement;
    if (active && active.matches && active.matches(CHAT_INPUT_SELECTOR)) {
      return active;
    }
    return document.querySelector(CHAT_INPUT_SELECTOR);
  }

  function ensureIndicator() {
    if (!indicatorEl) {
      indicatorEl = Utils.createEl("div", { class: "ogsplus-voice-indicator" }, [
        Utils.createEl("span", { class: "dot" }),
        Utils.createEl("span", { class: "ogsplus-voice-label", text: Utils.t("voice.listening") }),
      ]);
      document.body.appendChild(indicatorEl);
    }
    return indicatorEl;
  }

  function showIndicator() {
    ensureIndicator().classList.add("active");
  }
  function hideIndicator() {
    if (indicatorEl) indicatorEl.classList.remove("active");
  }

  function setNativeValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    ).set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function getSpeechRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function startListening() {
    const settings = Utils.getCachedSettings();
    if (!settings.masterEnabled || !settings.features.voiceCommentary) return;
    if (!isDemoOrReviewPage()) return;
    if (isListening) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      Toast.showToast("Web Speech API not supported in this browser", "error");
      return;
    }

    const chatInput = getActiveChatInput();
    if (!chatInput) return;

    baseValueBeforeListening = chatInput.value || "";

    recognition = new Ctor();
    recognition.lang = settings.voice.lang || "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = !!settings.voice.interimDisplay;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      const combinedBase = baseValueBeforeListening
        ? `${baseValueBeforeListening} `
        : "";
      const displayText = combinedBase + finalText + interimText;
      const activeInput = getActiveChatInput() || chatInput;
      setNativeValue(activeInput, displayText);
      if (finalText) {
        baseValueBeforeListening = combinedBase + finalText;
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        Toast.showToast(Utils.t("voice.micDenied"), "error", 4000);
      }
      stopListening();
    };

    recognition.onend = () => {
      if (isListening) {
        // 브라우저가 자동으로 세션을 끊는 경우 재시작 시도 (키를 계속 누르고 있는 동안)
        try {
          recognition.start();
        } catch (e) {
          /* ignore */
        }
      }
    };

    try {
      recognition.start();
      isListening = true;
      showIndicator();
    } catch (e) {
      console.error("[OGS Plus] speech recognition start failed", e);
    }
  }

  function stopListening() {
    if (!isListening) return;
    isListening = false;
    hideIndicator();
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch (e) {
        /* ignore */
      }
      recognition = null;
    }
  }

  function handleKeyDown(ev) {
    if (ev.key === "Control") ctrlDown = true;
    if (ev.key === "Alt") altDown = true;
    if (ctrlDown && altDown) {
      startListening();
    }
  }

  function handleKeyUp(ev) {
    if (ev.key === "Control") ctrlDown = false;
    if (ev.key === "Alt") altDown = false;
    if (!ctrlDown || !altDown) {
      stopListening();
    }
  }

  function handleBlurWindow() {
    ctrlDown = false;
    altDown = false;
    stopListening();
  }

  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", handleBlurWindow);
})(typeof window !== "undefined" ? window : globalThis);
