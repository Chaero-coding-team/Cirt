/**
 * OGS Plus - 통합 알림 (공지사항 / 포럼 답글 / DM) + 조용 모드
 * OGS 페이지의 알림 인디케이터(.NotificationIndicator)와 채팅 시스템을 주기적으로
 * 관찰하여 새 항목이 생기면 background service worker에 chrome.notifications 표시를
 * 요청한다. 조용 모드가 켜져 있으면 DM 알림만 무시한다.
 */
(function (global) {
  "use strict";

  const Utils = global.OGSPlusUtils;
  const POLL_MS = 20000;

  function sendNotification(kind, title, message) {
    const settings = Utils.getCachedSettings();
    if (!settings.masterEnabled || !settings.features.notifications) return;
    if (settings.quietMode.enabled) {
      if (kind === "dm" && settings.quietMode.muteDm) return;
      if (kind === "forum" && settings.quietMode.muteForum) return;
      if (kind === "announcement" && settings.quietMode.muteAnnouncement) return;
    }
    try {
      chrome.runtime.sendMessage({
        type: "OGSPLUS_NOTIFY",
        kind,
        title,
        message,
      });
    } catch (e) {
      /* extension context might be invalidated on reload; ignore */
    }
  }

  let lastAnnouncementCount = null;
  let lastDmUnread = null;

  function pollAnnouncements() {
    // 공지사항: .Announcements 컴포넌트/알림 리스트에 새 항목이 뜨는지 뱃지로 감지
    const badge = document.querySelector(".NotificationIndicator .badge, .NotificationIndicator .count");
    if (badge) {
      const n = parseInt(badge.textContent || "0", 10) || 0;
      if (lastAnnouncementCount !== null && n > lastAnnouncementCount) {
        sendNotification(
          "announcement",
          Utils.t("notif.newAnnouncement"),
          `${n} unread`,
        );
      }
      lastAnnouncementCount = n;
    }
  }

  function pollDm() {
    // ChatIndicator / private chat unread badge
    const dmBadge = document.querySelector(".ChatIndicator .badge, .ChatIndicator .count, .PrivateChat .unread-count");
    if (dmBadge) {
      const n = parseInt(dmBadge.textContent || "0", 10) || 0;
      if (lastDmUnread !== null && n > lastDmUnread) {
        sendNotification("dm", Utils.t("notif.newDm"), `${n} unread`);
      }
      lastDmUnread = n;
    }
  }

  function poll() {
    try {
      pollAnnouncements();
      pollDm();
    } catch (e) {
      console.error("[OGS Plus] notification poll failed", e);
    }
  }

  setInterval(poll, POLL_MS);
  setTimeout(poll, 3000);
})(typeof window !== "undefined" ? window : globalThis);
