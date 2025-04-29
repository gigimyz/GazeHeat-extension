const fs = require("fs");
const dotenv = require("dotenv");

if (!fs.existsSync(".env")) {
  fs.writeFileSync(
    ".env",
    `GEMINI_API_KEY=your-google-api-key-here\nPORT=5000`
  );
  console.log("✅ Created .env file. Please update it with your Gemini API key.");
} else {
  console.log("✅ .env file already exists.");
}

// Load and validate
dotenv.config();
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your-google-api-key")) {
  console.warn("⚠️  Please update your .env file with a valid GEMINI_API_KEY");
} else {
  console.log("✅ GEMINI_API_KEY is set.");
}
