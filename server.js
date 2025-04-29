import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

app.post("/gemini-summary", async (req, res) => {
  const texts = req.body.texts;
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "No texts provided" });
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: `
You are an assistant helping summarize webpage sections a user focused on.
Summarize these sections into a short, clear paragraph:

${texts.map((t, i) => `(${i + 1}) ${t}`).join("\n\n")}

Summary:
            `.trim()
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const summary = data.candidates[0]?.content?.parts[0]?.text || "No summary returned.";
    res.json({ summary });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
