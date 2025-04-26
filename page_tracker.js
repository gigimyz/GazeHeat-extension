let heatmapInstance;
let gazeData = [];

function waitForLibs(callback) {
  const interval = setInterval(() => {
    if (window.webgazer && window.h337) {
      clearInterval(interval);
      callback();
    }
  }, 300);
}

function startTracking() {
  waitForLibs(() => {
    console.log("✅ GazeHeat: Starting tracking");

    heatmapInstance = h337.create({ container: document.body });
    gazeData = [];

    webgazer
      .setGazeListener((data, timestamp) => {
        if (data) {
          gazeData.push({ x: data.x, y: data.y, value: 1 });
          console.log(`[Gaze] x=${data.x.toFixed(1)} y=${data.y.toFixed(1)} t=${timestamp}`);
        }
      })
      .showVideoPreview(true)         // ✅ Show webcam preview (small box)
      .showFaceOverlay(true)           // ✅ Draw face tracking box
      .showFaceFeedbackBox(true)       // ✅ Show green/red feedback on face lock
      .showPredictionPoints(true)      // ✅ Always show the red prediction dots
      .begin()
      .then(() => {
        console.log("🎯 WebGazer is running!");

        // Force minimal calibration points mode
        setTimeout(() => {
          alert("📌 Move your head around and stare at different parts of the screen for better calibration!");
        }, 2000);
        
        setInterval(() => {
          const pred = webgazer.getCurrentPrediction();
          if (pred && pred.x != null && pred.y != null) {
            console.log(`[Debug Prediction] x=${pred.x.toFixed(1)}, y=${pred.y.toFixed(1)}`);
          } else {
            console.log("[Debug Prediction] Not enough data yet...");
          }
        }, 3000);
        
      });
  });
}

function stopTracking() {
  console.log("🛑 GazeHeat: Stopping tracking");

  webgazer.pause();  // Pause prediction
  heatmapInstance.setData({
    max: 10,
    data: gazeData
  });

  alert("✅ Gaze data collected! Heatmap displayed. Move around the page if you don't see it right away.");
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "GAZEHEAT_START") {
    startTracking();
  } else if (event.data.type === "GAZEHEAT_STOP") {
    stopTracking();
  }
});
