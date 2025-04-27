console.log("[GazeHeat] content.js loaded on", window.location.href);

function injectScript(file) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(file);
  script.onload = () => {
    console.log(`✅ Injected ${file}`);
  };
  script.onerror = (e) => {
    console.error(`❌ Failed to inject ${file}`, e);
  };
  document.documentElement.appendChild(script);
}

injectScript('webgazer.js');
injectScript('heatmap.min.js');
injectScript('page_tracker.js');

// -----------------------------
// Handle Messages from Popup
// -----------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "start") {
    window.postMessage({ type: "GAZEHEAT_START" }, "*");
  } else if (request.command === "stop") {
    window.postMessage({ type: "GAZEHEAT_STOP" }, "*");
  } else if (request.command === "toggle-gaze-dot") {
    if (window.webgazer) {
      const currentlyShown = window.webgazer.params.showPredictionPoints;
      window.webgazer.showPredictionPoints(!currentlyShown);
      console.log(`[GazeHeat] Gaze dot ${!currentlyShown ? "shown" : "hidden"}`);
    } else {
      console.warn("[GazeHeat] webgazer not loaded yet.");
    }
  }
});
