// Manual .env loader — avoids conflicts with global dotenvx
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val; // don't override existing env vars
    });
}

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

// Groq SDK (lazy-loaded so server starts even if key is missing)
let groqClient = null;
try {
    const Groq = require('groq-sdk');
    const key = process.env.GROQ_API_KEY;
    if (key && key !== 'your_groq_api_key_here') {
        groqClient = new Groq({ apiKey: key });
        console.log('[AI] ✅ Groq client initialized — LLaMA 3.3 ready!');
    } else {
        console.warn('[AI] ⚠️  GROQ_API_KEY not set — falling back to rule-based AI.');
    }
} catch (e) {
    console.warn('[AI] groq-sdk not found:', e.message);
}


// ==========================================
// Local User Store (users.json)
// ==========================================
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function loadUsers() {
    try {
        if (!fs.existsSync(path.join(__dirname, 'data'))) {
            fs.mkdirSync(path.join(__dirname, 'data'));
        }
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch { return []; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the entire web app directory
app.use(express.static(__dirname));

// Also mount each subdirectory so relative asset paths (style.css, script.js)
// resolve correctly when the browser requests them from the root '/'.
// e.g. http://localhost:3000/style.css -> welcome page/style.css
app.use(express.static(path.join(__dirname, 'welcome page')));
app.use('/signin',     express.static(path.join(__dirname, 'signin')));
app.use('/signup',     express.static(path.join(__dirname, 'signup')));
app.use('/dashboard',  express.static(path.join(__dirname, 'dashboard')));

// Suppress favicon 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ==========================================
// REST API ROUTES (Local Backend)
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Local backend is running successfully.' });
});

// Example: Fetch Alerts (Could pull from a local DB or blockchain)
app.get('/api/alerts', (req, res) => {
    // Dummy data simulating a blockchain/DB fetch
    const alerts = [
        { id: 1, title: 'Flood Warning', severity: 'High', location: 'Bhubaneswar' },
        { id: 2, title: 'Road Blocked', severity: 'Medium', location: 'Cuttack' }
    ];
    res.json(alerts);
});

// Example: Create Alert (Could sign and broadcast transaction to MST Blockchain)
app.post('/api/alerts', async (req, res) => {
    try {
        const { title, description, severity, location } = req.body;
        console.log(`[API] New Alert Created: ${title} (${severity})`);
        res.status(201).json({ 
            success: true, 
            message: 'Alert anchored successfully.',
            txHash: '0x' + Math.random().toString(16).substr(2, 40)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create alert.' });
    }
});

// ==========================================
// AI & TRANSLATION ENDPOINTS (Phase 2)
// ==========================================

// TRANSLATE — Uses MyMemory free API (no key required, 5000 words/day)
app.post('/api/translate', async (req, res) => {
    const { text, source, target } = req.body;
    if (!text || !target) return res.status(400).json({ error: 'Missing text or target language.' });

    const langPair = `${source || 'en'}|${target}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`;

    try {
        const protocol = url.startsWith('https') ? https : http;
        const apiRes = await new Promise((resolve, reject) => {
            protocol.get(url, (r) => {
                let data = '';
                r.on('data', chunk => data += chunk);
                r.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        if (apiRes.responseStatus === 200) {
            res.json({ translation: apiRes.responseData.translatedText });
        } else {
            res.status(500).json({ error: 'Translation API error.' });
        }
    } catch (err) {
        console.error('[Translate]', err.message);
        res.status(500).json({ error: 'Failed to reach translation service.' });
    }
});

// AI CHAT — Uses Groq (llama-3.3-70b) with rule-based fallback
const SYSTEM_PROMPT = `You are BAP Safety AI, an emergency response assistant for Bharat Aapda Prabandhan (India's disaster management app). 
Your role is to provide clear, actionable, life-saving guidance in natural disasters and emergencies.
Be concise, calm, and authoritative. Respond in the language the user writes in.
If the situation is life-threatening, always advise to contact emergency services (112 in India).`;

app.post('/api/ai/chat', async (req, res) => {
    const { message, history } = req.body;

    // --- Real Groq Path ---
    if (groqClient) {
        try {
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...(Array.isArray(history) ? history : []),
                { role: 'user', content: message }
            ];

            const completion = await groqClient.chat.completions.create({
                model: 'qwen/qwen3.8-27b',
                messages,
                max_tokens: 512,
                temperature: 0.6
            });

            const reply = completion.choices[0]?.message?.content || 'I could not generate a response.';
            return res.json({ reply, source: 'groq-qwen3' });
        } catch (err) {
            console.error('[Groq Error]', err.message);
            // Fall through to rule-based fallback on error
        }
    }

    // --- Rule-based Fallback ---
    let reply = 'I am your BAP Safety AI. Please describe your emergency and I will guide you.';
    const lower = message.toLowerCase();
    if (lower.includes('flood') || lower.includes('water')) {
        reply = 'In case of a flood: move to higher ground immediately. Do not walk or drive through flood waters. Disconnect all electrical appliances. Call 112 for rescue.';
    } else if (lower.includes('earthquake')) {
        reply = 'DROP, COVER, and HOLD ON! Stay away from windows. If outdoors, move away from buildings and power lines. After shaking stops, evacuate carefully.';
    } else if (lower.includes('fire') || lower.includes('burning')) {
        reply = 'Evacuate immediately! Crawl low under smoke. Do NOT use elevators. Close doors behind you to slow fire spread. Call 101.';
    } else if (lower.includes('cyclone') || lower.includes('storm')) {
        reply = 'Seek shelter in a reinforced building immediately. Stay away from windows. Do not go outside until authorities declare it is safe.';
    } else if (lower.includes('help') || lower.includes('emergency')) {
        reply = 'For a life-threatening emergency in India, call 112 (all services). Describe your location clearly. Stay calm and follow the operator\'s instructions.';
    }
    res.json({ reply, source: 'offline-rules' });
});

// ==========================================
// CHAT ENDPOINTS (Phase 3)
// ==========================================

let publicMessages = [];

app.get('/api/public-chat', (req, res) => {
    res.json(publicMessages);
});

app.post('/api/public-chat', (req, res) => {
    const msg = req.body;
    // Keep only last 50 messages
    publicMessages.push(msg);
    if (publicMessages.length > 50) {
        publicMessages.shift();
    }
    res.json({ success: true });
});

// ==========================================
// AUTH ENDPOINTS
// ==========================================

// Sign Up — register a new user with name + phone
app.post('/api/auth/signup', (req, res) => {
    const { name, phone } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.', field: 'name' });
    }
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits.', field: 'phone' });
    }

    const users = loadUsers();
    const existing = users.find(u => u.phone === phone);
    if (existing) {
        return res.status(409).json({ success: false, error: 'This phone number is already registered. Please sign in.', field: 'phone' });
    }

    const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        phone,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    console.log(`[AUTH] New user registered: ${newUser.name} (+91 ${newUser.phone})`);
    res.status(201).json({ success: true, user: newUser });
});

// Sign In — look up user by phone
app.post('/api/auth/signin', (req, res) => {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits.' });
    }

    const users = loadUsers();
    const user = users.find(u => u.phone === phone);

    if (!user) {
        return res.status(404).json({ success: false, error: 'No account found for this number. Please sign up first.' });
    }

    console.log(`[AUTH] User signed in: ${user.name} (+91 ${user.phone})`);
    res.json({ success: true, user });
});

// Serve welcome page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcome page', 'index.html'));
});

// Serve signin and signup pages
app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'signin', 'index.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup', 'index.html'));
});
app.get('/dashboard/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'home', 'index.html'));
});
app.get('/dashboard/alerts', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'alerts', 'index.html'));
});
app.get('/dashboard/map', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'map', 'index.html'));
});
app.get('/dashboard/translator', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'translator', 'index.html'));
});
app.get('/dashboard/ai', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'ai', 'index.html'));
});
app.get('/dashboard/public-chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'public-chat', 'index.html'));
});
app.get('/dashboard/private-chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'private-chat', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 BAP Local Backend Server running!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`=========================================`);
});
