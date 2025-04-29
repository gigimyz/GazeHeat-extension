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

// 🧩 Helper: Visible text blocks
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

    heatmapInstance = h337.create({
      container: document.body,
      radius: 40,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.75
    });
    window.gazeHeatmap = heatmapInstance; 

    setTimeout(() => {
      const canvas = document.querySelector('.heatmap-canvas');
      if (canvas) {
        console.log("✅ Resizing heatmap canvas");
    
        // Update width and height based on total document size
        const width = document.documentElement.scrollWidth;
        const height = document.documentElement.scrollHeight;
    
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = width;
        canvas.height = height;
        canvas.style.zIndex = "9999";
        canvas.style.pointerEvents = "none";
    
        // Also force heatmapInstance to be aware of full page
        if (heatmapInstance._renderer) {
          heatmapInstance._renderer._width = width;
          heatmapInstance._renderer._height = height;
        }
    
        console.log("✅ Heatmap canvas adjusted for full page size!");
      }
    }, 500);
    

    console.log("🔵 GazeHeat: Initializing gazedata to empty");
    gazeData.length = 0;   
    attentionScores.clear();

    webgazer
      .setGazeListener((data, timestamp) => {
        if (data) {
          const corrected = correctGaze(data);
          gazeData.push({ x: corrected.x, y: corrected.y, value: 5 });
          recordGazePoint(corrected);
        }
      })
      .showVideoPreview(true)
      .showFaceOverlay(true)
      .showFaceFeedbackBox(true)
      .showPredictionPoints(true)
      .begin()
      .then(() => {
        console.log("🎯 WebGazer is running!");

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

  webgazer.pause();

  if (!heatmapInstance) {
    console.error("❗ No heatmap instance found!");
    alert("❗ Error: Heatmap was not created. Please refresh and try again.");
    return;
  }

  console.log("🔴 GazeData length:", gazeData.length);

  // ✅ Clip gaze points correctly!
  const pageWidth = document.documentElement.scrollWidth;
  const pageHeight = document.documentElement.scrollHeight;
  console.log("📏 Page dimensions:", pageWidth, pageHeight);
  // ✅ Now feed corrected gazeData to heatmap
  
  // Resize the heatmap canvas to match full page
  const canvas = document.querySelector('.heatmap-canvas');
  if (canvas) {
    canvas.style.width = pageWidth + "px";
    canvas.style.height = pageHeight + "px";
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    console.log("✅ Heatmap canvas resized again before setting data");
  }

  heatmapInstance.setData({
    max: 10, // You can change if you want
    data: gazeData.map(p => ({
      x: Math.min(Math.max(p.x, 0), pageWidth - 1),
      y: Math.min(Math.max(p.y, 0), pageHeight - 1),
      value: p.value
    }))
  });

  if (heatmapInstance._renderer) {
    heatmapInstance._renderer._width = pageWidth;
    heatmapInstance._renderer._height = pageHeight;
    heatmapInstance._renderer._renderBoundaries = [0, 0, pageWidth, pageHeight];
}

  heatmapInstance.repaint();
  console.log("✅ Heatmap repainted with corrected gaze data!");

  alert("✅ Gaze data collected! Heatmap and Analytics displayed!");

  printAttentionRanking();
  showBasicAnalytics();
}



function showBasicAnalytics() {
  console.log("📊 Generating basic analytics...");

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
    <div>
      <button id="gazeheat-ai-summary-btn" 
              style="margin-left:10px; background:#007bff; color:white; border:none; padding:5px 8px; border-radius:5px; cursor:pointer;">
        ✨ AI Summary
      </button>
      <button onclick="document.getElementById('gazeheat-analytics-panel').remove()" 
              style="background: none; border: none; font-size: 18px; cursor: pointer;">❌</button>
    </div>
  </div>
  <hr style="margin: 10px 0;">
`;


  const ranked = Array.from(attentionScores.entries())
    .filter(([block, score]) => block.innerText.trim().length > 0)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    panel.innerHTML += `<p>No gaze data captured.</p>`;
    document.body.appendChild(panel);
    return;
  }

  panel.innerHTML += `<h3 style="font-size: 16px; margin-top: 10px;">🔥 Top Focused Sections:</h3><ul>`;
  ranked.slice(0, 5).forEach(([block, score], idx) => {
    const snippet = block.innerText.trim().slice(0, 80);
    panel.innerHTML += `<li><b>${block.tagName}</b> - "${snippet}" (Score: ${score})</li>`;
  });
  panel.innerHTML += `</ul>`;

  document.body.appendChild(panel);

  // 🧩 AI Summary button
  panel.querySelector("#gazeheat-ai-summary-btn").addEventListener("click", async () => {
    try {
      const topTexts = getTopFocusedTexts(5);
      if (topTexts.length === 0) {
        alert("No enough focused sections to summarize.");
        return;
      }
  
      const aiSummaryPanelId = 'gazeheat-ai-summary-panel';
      // Avoid creating multiple times
      if (document.getElementById(aiSummaryPanelId)) {
        console.log("✅ Summary already generated.");
        return;
      }
  
      const summary = await summarizeFocusedSections(topTexts);
      console.log("📝 AI Summary generated:", summary);
  
      const summaryDiv = document.createElement('div');
      summaryDiv.id = aiSummaryPanelId;
      summaryDiv.style.marginTop = "15px";
      summaryDiv.innerHTML = `
        <h3 style="font-size: 16px;">📝 AI Summary:</h3>
        <p style="font-size: 14px;">${summary.replace(/\n/g, '<br>')}</p>
      `;
  
      panel.appendChild(summaryDiv);
  
    } catch (err) {
      console.error("❌ Failed to generate AI summary:", err);
      alert("Failed to generate summary. Please check console.");
    }
  });
}
  
// 🧩 Start/Stop control from extension
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "GAZEHEAT_START") {
    startTracking();
  } else if (event.data.type === "GAZEHEAT_STOP") {
    stopTracking();
  }
});

// 🧩 Expose globals for console debugging
window.gazeData = gazeData;
window.attentionScores = attentionScores;

function getTopFocusedTexts(N = 5) {
  const ranked = Array.from(attentionScores.entries())
    .filter(([block, score]) => block.innerText.trim().length > 0)
    .sort((a, b) => b[1] - a[1]);

  const topTexts = ranked.slice(0, N).map(([block, score]) => block.innerText.trim());
  return topTexts;
}
async function summarizeFocusedSections(topTexts) {
  if (!Array.isArray(topTexts) || topTexts.length === 0) {
    throw new Error("No focused text blocks to summarize.");
  }
  console.log("📝 Top focused texts:", topTexts);  
  try {
    const response = await fetch('http://localhost:5001/gemini-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ texts: topTexts })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.summary || "No summary returned.";
  } catch (err) {
    console.error("❌ Failed to call local Gemini proxy:", err);
    throw err;
  }
}

