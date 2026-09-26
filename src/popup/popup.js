document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("openSettings");
  const hint = document.getElementById("hint");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const onOgs = tab && tab.url && /online-go\.com/.test(tab.url);
    if (!onOgs) {
      btn.disabled = true;
      btn.textContent = "Open online-go.com first";
      hint.textContent = "Open online-go.com to use OGS Plus";
      return;
    }
    btn.addEventListener("click", () => {
      const url = new URL(tab.url);
      chrome.tabs.update(tab.id, { url: `${url.origin}/settings/plus` });
    });
  });
});
