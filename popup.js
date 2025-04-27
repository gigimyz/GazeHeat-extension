function sendCommandToTab(command) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && tab.url.startsWith("http")) {
      chrome.tabs.sendMessage(tab.id, { command }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Could not connect to content script:", chrome.runtime.lastError.message);
          // ✅ Just log, no alert
        }
      });
    } else {
      alert("GazeHeat only works on normal web pages (http/https).");
    }
  });
}

document.getElementById("start").addEventListener("click", () => sendCommandToTab("start"));
document.getElementById("stop").addEventListener("click", () => sendCommandToTab("stop"));
document.getElementById("toggle-dot").addEventListener("click", () => {
  sendCommandToTab("toggle-gaze-dot");
});

