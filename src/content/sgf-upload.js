/**
 * OGS Plus - SGF 라이브러리 페이지에 'OGS Game' 업로드 버튼 추가
 *
 * 경로: /library/:player_id/:collection_id
 * 내 대국 또는 다른 사람의 대국 ID를 선택하면
 *   1) `games/{id}/sgf` 에서 SGF 원문을 가져오고
 *   2) `me/games/sgf/{collection_id}` 로 그대로 업로드한다.
 */
(function (global) {
  "use strict";

  const Utils = global.OGSPlusUtils;
  const Toast = global.OGSPlusToast;

  const BUTTON_ID = "ogsplus-sgf-upload-btn";

  function getRouteParams() {
    const m = window.location.pathname.match(/\/library\/(\d+)\/(\d+)/);
    if (!m) return null;
    return { playerId: Number(m[1]), collectionId: Number(m[2]) };
  }

  async function searchGames(query, mode) {
    // mode: "mine" | "other"
    const currentUserId = Utils.getCurrentUserId();
    if (/^\d+$/.test(query.trim())) {
      // 게임 ID로 직접 조회
      try {
        const game = await Utils.apiFetch(`games/${query.trim()}`);
        return [game];
      } catch (e) {
        return [];
      }
    }
    if (mode === "mine" && currentUserId) {
      const data = await Utils.apiFetch(
        `players/${currentUserId}/game_history/?page_size=15`,
      );
      return (data.results || []).filter((g) => {
        const b = g.players?.black?.username || "";
        const w = g.players?.white?.username || "";
        return !query || b.toLowerCase().includes(query.toLowerCase()) || w.toLowerCase().includes(query.toLowerCase());
      });
    }
    if (mode === "other" && query.trim()) {
      try {
        const found = await Utils.apiFetch(
          `players/?username__istartswith=${encodeURIComponent(query.trim())}`,
        );
        const player = (found.results || [])[0];
        if (!player) return [];
        const data = await Utils.apiFetch(
          `players/${player.id}/game_history/?page_size=15`,
        );
        return data.results || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function gameLabel(g) {
    const b = g.players?.black?.username || g.black?.username || "?";
    const w = g.players?.white?.username || g.white?.username || "?";
    return `#${g.id} — ${b} vs ${w}`;
  }

  function buildModal(collectionId) {
    let mode = "mine";
    let selectedGame = null;

    const resultsList = Utils.createEl("div", { class: "ogsplus-game-list" });

    const searchInput = Utils.createEl("input", {
      type: "text",
      placeholder: Utils.t("sgf.searchPlaceholder"),
    });

    async function runSearch() {
      resultsList.innerHTML = "";
      const games = await searchGames(searchInput.value, mode);
      selectedGame = null;
      games.forEach((g) => {
        const item = Utils.createEl(
          "div",
          {
            class: "ogsplus-game-list-item",
            onClick: () => {
              resultsList.querySelectorAll(".ogsplus-game-list-item").forEach((el) => el.classList.remove("selected"));
              item.classList.add("selected");
              selectedGame = g;
            },
          },
          [Utils.createEl("span", { text: gameLabel(g) })],
        );
        resultsList.appendChild(item);
      });
    }

    const tabMine = Utils.createEl("div", {
      class: "ogsplus-tab active",
      text: Utils.t("sgf.pickMine"),
      onClick: () => {
        mode = "mine";
        tabMine.classList.add("active");
        tabOther.classList.remove("active");
        runSearch();
      },
    });
    const tabOther = Utils.createEl("div", {
      class: "ogsplus-tab",
      text: Utils.t("sgf.pickOther"),
      onClick: () => {
        mode = "other";
        tabOther.classList.add("active");
        tabMine.classList.remove("active");
        runSearch();
      },
    });

    searchInput.addEventListener("input", Utils.debounce(runSearch, 400));

    const uploadBtn = Utils.createEl("button", {
      class: "ogsplus-btn primary",
      text: Utils.t("sgf.upload"),
      onClick: async () => {
        if (!selectedGame) return;
        uploadBtn.disabled = true;
        uploadBtn.textContent = "...";
        try {
          const sgfText = await Utils.apiFetch(`games/${selectedGame.id}/sgf`);
          const sgfString = typeof sgfText === "string" ? sgfText : JSON.stringify(sgfText);
          const blob = new Blob([sgfString], { type: "application/x-go-sgf" });
          const file = new File([blob], `game-${selectedGame.id}.sgf`, {
            type: "application/x-go-sgf",
          });
          const formData = new FormData();
          formData.append("file", file);
          await Utils.apiFetch(`me/games/sgf/${collectionId}`, {
            method: "POST",
            body: formData,
          });
          Toast.showToast(Utils.t("settings.saved"), "success");
          closeModal();
          setTimeout(() => window.location.reload(), 600);
        } catch (e) {
          console.error(e);
          Toast.showToast(String(e.message || e), "error");
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = Utils.t("sgf.upload");
        }
      },
    });

    const cancelBtn = Utils.createEl("button", {
      class: "ogsplus-btn",
      text: "✕",
      onClick: () => closeModal(),
    });

    const backdrop = Utils.createEl(
      "div",
      { class: "ogsplus-modal-backdrop", onClick: (e) => { if (e.target === backdrop) closeModal(); } },
      [
        Utils.createEl("div", { class: "ogsplus-modal" }, [
          Utils.createEl("h3", { text: `🎮 ${Utils.t("sgf.uploadButton")}` }),
          Utils.createEl("div", { class: "ogsplus-tabs" }, [tabMine, tabOther]),
          searchInput,
          resultsList,
          Utils.createEl("div", { class: "ogsplus-modal-actions" }, [cancelBtn, uploadBtn]),
        ]),
      ],
    );

    function closeModal() {
      backdrop.remove();
    }

    document.body.appendChild(backdrop);
    runSearch();
    return backdrop;
  }

  function injectButton(container, collectionId) {
    if (document.getElementById(BUTTON_ID)) return;
    const btn = Utils.createEl("button", {
      id: BUTTON_ID,
      class: "ogsplus-sgf-btn",
      text: `🎮 ${Utils.t("sgf.uploadButton")}`,
      onClick: () => buildModal(collectionId),
    });
    container.prepend(btn);
  }

  function tryInject() {
    const settings = Utils.getCachedSettings();
    if (!settings.masterEnabled || !settings.features.sgfOgsUpload) return;
    const params = getRouteParams();
    if (!params) return;
    const controlsRight = document.querySelector(".LibraryPlayer .controls-right");
    if (controlsRight) {
      injectButton(controlsRight, params.collectionId);
    }
  }

  Utils.watchElements(".LibraryPlayer .controls-right", () => tryInject());

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    setTimeout(tryInject, 300);
  };
  window.addEventListener("popstate", () => setTimeout(tryInject, 300));
  tryInject();
})(typeof window !== "undefined" ? window : globalThis);
