let heatmapInstance;
let gazeData = [];
let attentionScores = new Map(); // ✅ Track attention per text block

function waitForLibs(callback) {
  const interval = setInterval(() => {
    if (window.webgazer && window.h337) {
      clearInterval(interval);
      callback();
    }
  }, 300);
}

// 🧩 New helper functions for attention scoring
function getVisibleTextBlocks() {
  return Array.from(document.querySelectorAll('p, h1, h2, h3, li, article, section'));
}

function getBoundingBoxWithScroll(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    bottom: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX
  };
}

function correctGaze(data) {
  return {
    x: data.x + window.scrollX,
    y: data.y + window.scrollY,
    timestamp: Date.now()
  };
}
function recordGazePoint(gazePoint) {
  const textBlocks = getVisibleTextBlocks();
  let bestMatch = null;
  let smallestArea = Infinity;

  for (const block of textBlocks) {
    const box = getBoundingBoxWithScroll(block);
    if (gazePoint.x >= box.left && gazePoint.x <= box.right &&
        gazePoint.y >= box.top && gazePoint.y <= box.bottom) {
      
      const area = (box.right - box.left) * (box.bottom - box.top);
      if (area < smallestArea) {
        bestMatch = block;
        smallestArea = area;
      }
    }
  }

  if (bestMatch) {
    if (!attentionScores.has(bestMatch)) {
      attentionScores.set(bestMatch, 0);
    }
    attentionScores.set(bestMatch, attentionScores.get(bestMatch) + 1);
  }
}


function printAttentionRanking() {
  const ranked = Array.from(attentionScores.entries())
    .sort((a, b) => b[1] - a[1]);
  
  console.log("🔎 Attention Ranking (most viewed first):");
  ranked.forEach(([block, score], index) => {
    const type = block.tagName;
    const snippet = block.innerText.slice(0, 100);
    console.log(`#${index + 1}: [${type}] ${snippet} Score: ${score}`);
  });
}


function startTracking() {
  waitForLibs(() => {
    console.log("✅ GazeHeat: Starting tracking");

    heatmapInstance = h337.create({ container: document.body });
    gazeData = [];
    attentionScores = new Map(); // reset for each new tracking session

    webgazer
      .setGazeListener((data, timestamp) => {
        if (data) {
          const corrected = correctGaze(data);
          gazeData.push({ x: corrected.x, y: corrected.y, value: 1 });

          recordGazePoint(corrected); // ✅ track attention scoring live

          // console.log(`[Gaze] x=${data.x.toFixed(1)} y=${data.y.toFixed(1)} t=${timestamp}`);
        }
      })
      .showVideoPreview(true)         // ✅ Show webcam preview
      .showFaceOverlay(true)           // ✅ Draw face tracking box
      .showFaceFeedbackBox(true)       // ✅ Face feedback indicator
      .showPredictionPoints(true)      // ✅ Red prediction points
      .begin()
      .then(() => {
        console.log("🎯 WebGazer is running!");

        // Calibration encouragement
        setTimeout(() => {
          alert("📌 Move your head around and stare at different parts of the screen for better calibration!");
        }, 2000);
        
        // Slow debug logging of prediction
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

  webgazer.pause();  // Pause prediction engine

  heatmapInstance.setData({
    max: 10,
    data: gazeData
  });

  alert("✅ Gaze data collected! Heatmap displayed. Move around the page if you don't see it right away.");

  printAttentionRanking(); // ✅ After stop, print most-read sections!
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "GAZEHEAT_START") {
    startTracking();
  } else if (event.data.type === "GAZEHEAT_STOP") {
    stopTracking();
  }
});
