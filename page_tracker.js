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

// 🆕 Utility to find nearest parent ID (for exporting)
function getParentSectionId(el) {
  let current = el;
  while (current && current !== document.body) {
    if (current.id) return current.id;
    current = current.parentElement;
  }
  return "root"; // fallback
}

// 🆕 Utility to save gaze sections to JSON
function saveGazeSections() {
  const ranked = Array.from(attentionScores.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const sections = ranked.map(([block, score], index) => ({
    section_id: index,
    tag: block.tagName,
    text: block.innerText.trim(),
    score: score,
    parent_section: getParentSectionId(block)
  }));

  const blob = new Blob([JSON.stringify(sections, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = "gazeheat_sections.json";
  a.click();

  console.log("📥 Gazeheat section summary saved as gazeheat_sections.json");
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

  // 2. Print basic analytics
  printAttentionRanking(); 

  // 3. Show a Basic Analytics Panel
  showBasicAnalytics();
}

function showBasicAnalytics() {
  console.log("📊 Generating basic analytics...");

  // Create container
  let panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.right = '10px';
  panel.style.width = '350px';
  panel.style.maxHeight = '90vh';
  panel.style.overflowY = 'auto';
  panel.style.backgroundColor = 'white';
  panel.style.padding = '15px';
  panel.style.border = '2px solid #333';
  panel.style.borderRadius = '8px';
  panel.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.3)';
  panel.style.zIndex = 9999;
  panel.id = 'gazeheat-analytics-panel';

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2 style="font-size: 18px; margin: 0;">🧠 Basic Analytics</h2>
      <button onclick="document.getElementById('gazeheat-analytics-panel').remove()" 
              style="background: none; border: none; font-size: 18px; cursor: pointer;">❌</button>
    </div>
    <hr style="margin: 10px 0;">
  `;

  // Analyze attention scores
  const ranked = Array.from(attentionScores.entries())
    .filter(([block, score]) => block.innerText.trim().length > 0) // ✅ filter out empty text
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    panel.innerHTML += `<p>No gaze data captured.</p>`;
    document.body.appendChild(panel);
    return;
  }

  // Top 5 most focused sections
  panel.innerHTML += `<h3 style="font-size: 16px; margin-top: 10px;">🔥 Top Focused Sections:</h3><ul>`;
  ranked.slice(0, 5).forEach(([block, score], idx) => {
    const snippet = block.innerText.trim().slice(0, 80);
    panel.innerHTML += `<li><b>${block.tagName}</b> - "${snippet}" (Score: ${score})</li>`;
  });
  panel.innerHTML += `</ul>`;

  // Sections with low attention (score <= 2)
  const lowAttention = ranked.filter(([block, score]) => score <= 2);
  if (lowAttention.length > 0) {
    panel.innerHTML += `<h3 style="font-size: 16px; margin-top: 10px;">❗ Possibly Skipped Sections:</h3><ul>`;
    lowAttention.forEach(([block, score], idx) => {
      const snippet = block.innerText.trim().slice(0, 80);
      panel.innerHTML += `<li><b>${block.tagName}</b> - "${snippet}" (Score: ${score})</li>`;
    });
    panel.innerHTML += `</ul>`;
  }

  document.body.appendChild(panel);
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "GAZEHEAT_START") {
    startTracking();
  } else if (event.data.type === "GAZEHEAT_STOP") {
    stopTracking();
  }
});
