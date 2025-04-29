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

injectScript('public/webgazer.js');
injectScript('public/heatmap.min.js');
injectScript('src/page_tracker.js');

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

  } else if (request.command === "gemini-prompt") {
    // New Gemini API call
    sendPromptToGemini(request.prompt).then((responseText) => {
      sendResponse({ text: responseText });
    }).catch((err) => {
      console.error("[GazeHeat] Gemini error:", err);
      sendResponse({ text: null });
    });
    // ✅ Important: keep message channel open
    return true;
  }
});

// -----------------------------
// Call Local Gemini Server
// -----------------------------
async function sendPromptToGemini(prompt) {
  const serverUrl = "http://localhost:5001/gemini"; // Local server URL

  const response = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.text; // from server.js
}
