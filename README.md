# GazeHeat

GazeHeat is a Chrome Extension that visualizes user gaze on webpages in real-time using WebGazer.js and generates a heatmap overlay. It integrates a local Node.js server to securely connect with the Gemini API and summarizes the top-attended sections into a clear, AI-generated summary.

## Features

- Real-time gaze tracking using WebGazer.js
- Heatmap visualization using heatmap.js
- Attention-based analytics for text blocks
- AI-generated summary of most focused sections via Gemini API
- Secure local server proxy to hide your API key using `.env`

## Tech Stack

- **Frontend:** JavaScript, Chrome Extension APIs
- **Gaze Tracking:** WebGazer.js
- **Heatmap:** heatmap.js
- **Backend:** Node.js, Express, dotenv
- **AI Integration:** Gemini 2.0 Flash (Google)

## Project Structure
```
gazeheat-extension/
├── .env                        # Environment variables (e.g. GEMINI_API_KEY, PORT)
├── .gitignore                  # Ignore node_modules, .env, etc.
├── README.md                   # Project overview and setup instructions
├── package.json                # Node.js project metadata and scripts
├── configure.js                # CLI script to help setup .env
├── src/
│   ├── server.js               # Express server that handles Gemini API proxying
│   └── test_local_gemini.js   # Test script to validate Gemini connection
├── extension/
│   ├── manifest.json           # Chrome extension manifest (v3)
│   ├── popup.html              # Extension popup UI
│   ├── popup.js                # Logic for popup buttons
│   ├── content.js              # Injects and manages in-page scripts
│   ├── page_tracker.js         # Handles gaze tracking and analytics
│   ├── webgazer.js             # Gaze estimation library
│   ├── heatmap.min.js          # Heatmap.js for visualizing gaze data
│   └── styles.css              # Styling for popup and in-page UI (optional)
```
## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gazeheat-extension.git
cd gazeheat-extension
```
### 2. Install Dependencies
```

npm install
```
### 3. Configure Your Gemini API Key
Create a .env file in the root directory:

```
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5001
```
Or run the configuration script:
```
npm run configure
```
### 4. Start the Local Server
```
npm start
```
The server will run on http://localhost:5001.

### 5. Load the Chrome Extension
1. Open chrome://extensions/ in your browser.
2. Enable Developer Mode (top right toggle).
3. Click Load unpacked.
4. Select the extension/ folder.







