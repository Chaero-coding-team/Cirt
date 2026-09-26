/**

* OGS Plus - background service worker

* Receives notification requests from content scripts and displays desktop notifications via chrome.notifications.
*/
const ICON = chrome.runtime.getURL("icons/icon128.png");

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "OGSPLUS_NOTIFY") return;
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: ICON,
      title: msg.title || "OGS Plus",
      message: msg.message || "",
      priority: 1,
    });
  } catch (e) {
    console.error("[OGS Plus] notification failed", e);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[OGS Plus] installed");
});
