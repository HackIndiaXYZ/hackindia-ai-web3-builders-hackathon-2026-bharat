# Bharat Aapda Prabandhan: Web App Guide

This guide explains the lightweight Web Application version of Bharat Aapda Prabandhan. It is designed to provide access to critical disaster management tools via a web browser without requiring users to download a mobile app.

## 1. What this project is

The BAP Web App is a fast, offline-capable disaster response prototype. Its interface brings together:

- A dashboard with local emergency alerts
- An interactive map displaying shelters and danger zones
- A multilingual Safety AI Assistant
- An instant translation tool for disaster phrases
- Real-time public community chat and mock-encrypted private messaging

## 2. Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend | Vanilla HTML, CSS, JavaScript | Lightweight client-side UI, no heavy frameworks |
| Backend | Node.js + Express | Serves static files and handles API requests |
| Styling | Custom Glassmorphism UI (`layout.css`) | Modern, premium aesthetics with fast rendering |
| State | Browser `localStorage` | Persists session, contacts, and chat history locally |
| Maps | Leaflet.js | Interactive rendering of safe/danger zones |
| AI & Translation | Groq API (Qwen3 8-27B) | Fast, multilingual natural language processing |
| Blockchain | `ethers.js` (Mocked) | Simulates anchoring critical alerts to the MST Blockchain |

## 3. How the app starts

The application is fully contained within the `web app/` folder.

To start the local development server:

```bash
cd "web app"
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## 4. Architecture & Data Flow

The architecture is designed to be highly resilient and easy to deploy. 

- **Frontend:** The UI is served as static HTML/JS files from the Express backend. Client-side state (like emergency contacts) is managed entirely in `localStorage`.
- **Backend (`server.js`):** Acts as a proxy to external APIs (like Groq) and manages the public chat state in-memory.
- **AI Integration:** The backend securely holds the `GROQ_API_KEY` and injects a strict `SYSTEM_PROMPT` to enforce emergency response rules and multilingual output before forwarding user requests to the Groq LLaMA/Qwen models.

## 5. Key Features & Screens

### Dashboard & Alerts
The main hub displays the weather, active emergency alerts, and a sidebar navigation menu. Alerts are currently mocked but the API endpoint (`/api/alerts`) is structured to anchor these alerts to the MST Blockchain.

### Safety AI Assistant
A specialized chat interface powered by Groq. It enforces strict disaster-response rules and responds in the exact language the user types in (supporting 12+ Indian languages natively). If Groq is unavailable or offline, it falls back to a deterministic rule-based response system.

### Disaster Translator
Translates text from any language into a target Indian language using Groq for high accuracy and contextual understanding. Includes an offline dictionary fallback for critical phrases.

### Chat System
- **Public Chat:** A community board synced across all users via the local Node.js server.
- **Private Chat:** Initiated from the contacts list, this simulates end-to-end encrypted messaging using `localStorage` persistence.

## 6. Web3 & MST Blockchain Integration

Trust is critical during a disaster. To prevent the spread of fake news (like false safe-zones), the Web App is designed to integrate with the **MST Blockchain**.

- **Alert Anchoring:** When an alert is created, the `/api/alerts` endpoint simulates hashing the payload and returning a mock transaction hash (`0x...`). In production, this will anchor the alert data directly to the MST network.
- **Verification:** Alerts verified by the blockchain display a "Community Verified" badge on the frontend, ensuring the data hasn't been tampered with.

## 7. Deployment

The Web App is pre-configured for instant deployment on **Render.com** (or any standard Node.js hosting platform).

- **Configuration:** A `render.yaml` file tells Render to build using `npm install` and start using `node server.js`.
- **Environment Variables:** The `GROQ_API_KEY` must be set securely in the Render dashboard. A `.env.example` file is provided for local development.

To deploy:
1. Push the `web app/` folder to GitHub.
2. Connect the repository to Render as a "Web Service".
3. Set the `GROQ_API_KEY` environment variable.
4. Deploy!
