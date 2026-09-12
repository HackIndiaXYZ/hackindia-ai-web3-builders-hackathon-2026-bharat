/**
 * Offline AI inference service.
 *
 * Two-tier strategy:
 *  1. LOCAL (always available): A rule-based intent classifier + curated
 *     knowledge base for disaster scenarios. Zero download, instant responses.
 *  2. REMOTE (when connected): Routes complex queries to the Gemini API via
 *     a Supabase Edge Function (so the API key never ships in the client app).
 *
 * The getAiResponse function automatically picks the right tier.
 *
 * Offline Translation:
 *  Uses a curated phrase dictionary for the 22 official Indian languages.
 *  For arbitrary text, the remote tier (LibreTranslate self-hosted via Supabase)
 *  is used when connected.
 */

export type AiTier = 'local' | 'remote';

export type AiResponse = {
  text: string;
  tier: AiTier;
  language?: string;
};

// ---------------------------------------------------------------------------
// Local knowledge base
// ---------------------------------------------------------------------------

type KnowledgeEntry = {
  keywords: string[];
  response: string;
};

const knowledgeBase: KnowledgeEntry[] = [
  {
    keywords: ['first aid', 'injury', 'bleeding', 'wound', 'hurt', 'bleed'],
    response: `🩹 First Aid — Severe Bleeding:
• Apply firm, direct pressure with a clean cloth or bandage.
• Do NOT remove the cloth if it soaks through — add more on top.
• Elevate the injured limb above heart level if possible.
• Call 112 (National Emergency) for life-threatening injuries.

Burns:
• Cool under clean running water for 20 minutes — do NOT use ice.
• Cover loosely with a clean non-fluffy material.
• Do NOT burst blisters.`,
  },
  {
    keywords: ['earthquake', 'tremor', 'quake', 'shake', 'bhukamp'],
    response: `🏚 Earthquake — DROP, COVER, HOLD ON:
• Drop to your hands and knees.
• Take cover under a sturdy table or against an interior wall.
• Hold on until shaking stops.
• After: Check for gas leaks, move to open ground, use stairs only.
• Emergency: 1078 (NDMA Helpline)`,
  },
  {
    keywords: ['flood', 'water', 'flooding', 'baarish', 'rain', 'submerge'],
    response: `🌊 Flood Safety:
• Move to higher ground BEFORE water rises — do not wait.
• Never walk or drive through moving flood water.
• Disconnect electrical appliances if safe to do so.
• Store 3 days of drinking water, food, and medicines.
• Emergency: 1078 | State Disaster helpline | 112`,
  },
  {
    keywords: ['cyclone', 'hurricane', 'typhoon', 'storm', 'toofan'],
    response: `🌀 Cyclone Preparedness:
• Evacuate coastal and low-lying areas on official orders.
• Secure loose outdoor objects.
• Stock emergency supplies (water, food, torch, medicines, documents).
• Stay away from windows during the storm.
• Emergency: 1078 (NDMA) | 1070 (State EOC)`,
  },
  {
    keywords: ['fire', 'smoke', 'burn', 'aag', 'flames'],
    response: `🔥 Fire Emergency:
• Alert everyone and call 101 (Fire services) immediately.
• Evacuate — do NOT use lifts.
• Stay low under smoke — crawl if needed.
• Close doors to slow fire spread.
• If clothes catch fire: STOP, DROP, ROLL.`,
  },
  {
    keywords: ['translate', 'translation', 'language', 'bhasha', 'anuvad'],
    response: `🌐 Translation:
I can translate disaster alerts into 13 Indian languages.
Open the Translator tab for the full language pack.
Common phrases are available offline — complex text requires internet.`,
  },
  {
    keywords: ['shelter', 'relief camp', 'refugee', 'evacuate', 'evacuation', 'sharanarthi'],
    response: `🏕 Finding Shelter:
• Check the Map tab — it shows real-time shelter and relief camp locations.
• Contact local NDMA district office: ndma.gov.in
• Call 1078 to find the nearest government shelter.
• Bring: ID proof, medicines, emergency documents, phone charger.`,
  },
  {
    keywords: ['food', 'water', 'supply', 'ration', 'khana', 'paani'],
    response: `🥤 Emergency Supplies:
• Minimum 3 litres of water per person per day.
• Stock at least 3 days of non-perishable food.
• Purify flood-contaminated water by boiling for 1 minute or using ORS.
• Do NOT consume flood-exposed food items.`,
  },
  {
    keywords: ['help', 'rescue', 'sos', 'mayday', 'bachao', 'emergency'],
    response: `🆘 Emergency Numbers (India):
• National Emergency: 112
• Police: 100 | Fire: 101 | Ambulance: 108
• NDMA Helpline: 1078
• Disaster Management: 1070
• Women Helpline: 1091
• Child Helpline: 1098`,
  },
  {
    keywords: ['weather', 'forecast', 'temperature', 'wind', 'mausam'],
    response: `🌤 Live Weather:
The app fetches real-time weather conditions from Open-Meteo.
Check the Alerts tab — active weather warnings for your GPS location
are automatically shown when you are connected to the internet.`,
  },
];

function matchKnowledge(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  for (const entry of knowledgeBase) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Remote AI (Supabase Edge Function → Gemini)
// ---------------------------------------------------------------------------

async function callRemoteAi(prompt: string): Promise<string> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    throw new Error('Backend not configured');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ prompt, context: 'disaster_management_india' }),
  });

  if (!response.ok) throw new Error(`Remote AI returned ${response.status}`);
  const data: { reply: string } = await response.json();
  return data.reply;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get an AI response for the given user prompt.
 * - Always tries the local knowledge base first (instant, offline).
 * - Falls back to the remote Gemini-powered endpoint when connected.
 * - Falls back to a generic safe response if both fail.
 */
export async function getAiResponse(prompt: string, isOffline: boolean): Promise<AiResponse> {
  // 1. Try local knowledge base.
  const local = matchKnowledge(prompt);
  if (local) {
    return { text: local, tier: 'local' };
  }

  // 2. Try remote AI if online.
  if (!isOffline) {
    try {
      const text = await callRemoteAi(prompt);
      return { text, tier: 'remote' };
    } catch {
      // Fall through to generic response.
    }
  }

  // 3. Generic offline fallback.
  return {
    text: `Stay calm and assess your immediate surroundings for danger.\n\n` +
      `Without an internet connection, I can help with:\n` +
      `• First aid & injuries\n• Earthquake & flood safety\n• Cyclone & fire\n` +
      `• Finding shelter & emergency numbers\n• Food and water safety\n\n` +
      `Try rephrasing with a specific disaster type, or check your connection for detailed AI responses.`,
    tier: 'local',
  };
}

// ---------------------------------------------------------------------------
// Offline Translation
// ---------------------------------------------------------------------------

/** Disaster-specific phrase bank for offline translation. */
const offlinePhrases: Record<string, Record<string, string>> = {
  'Stay indoors and keep your emergency kit ready.': {
    Hindi: 'घर के अंदर रहें और अपनी आपातकालीन किट तैयार रखें।',
    Bengali: 'ঘরের ভিতরে থাকুন এবং আপনার জরুরি কিট প্রস্তুত রাখুন।',
    Tamil: 'வீட்டுக்குள்ளேயே இருங்கள் மற்றும் உங்கள் அவசரகால தொகுப்பை தயாராக வைத்திருங்கள்.',
    Telugu: 'ఇంట్లోనే ఉండండి మరియు మీ అత్యవసర కిట్‌ను సిద్ధంగా ఉంచుకోండి.',
    Marathi: 'घरातच राहा आणि तुमची आपत्कालीन किट तयार ठेवा.',
    Gujarati: 'ઘરની અંદર રહો અને તમારી ઇમરજન્સી કિટ તૈયાર રાખો.',
    Kannada: 'ಒಳಾಂಗಣದಲ್ಲಿರಿ ಮತ್ತು ನಿಮ್ಮ ತುರ್ತು ಕಿಟ್ ಸಿದ್ಧವಾಗಿಟ್ಟುಕೊಳ್ಳಿ.',
    Malayalam: 'വീടിനുള്ളിൽ കഴിയുക, നിങ്ങളുടെ എമർജൻസി കിറ്റ് തയ്യാറാക്കി വെക്കുക.',
    Punjabi: 'ਘਰ ਦੇ ਅੰਦਰ ਰਹੋ ਅਤੇ ਆਪਣੀ ਐਮਰਜੈਂਸੀ ਕਿੱਟ ਤਿਆਰ ਰੱਖੋ।',
    Odia: 'ଘର ଭିତରେ ରୁହନ୍ତୁ ଏବଂ ଆପଣଙ୍କର ଜରୁରୀକାଳୀନ କିଟ୍ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।',
    Urdu: 'گھر کے اندر رہیں اور اپنی ایمرجنسی کٹ تیار رکھیں۔',
    Assamese: 'ঘৰৰ ভিতৰত থাকক আৰু আপোনাৰ জৰুৰীকালীন কিট সাজু ৰাখক।',
  },
  'Stay safe and follow official instructions.': {
    Hindi: 'सुरक्षित रहें और सरकारी निर्देशों का पालन करें।',
    Bengali: 'নিরাপদ থাকুন এবং সরকারি নির্দেশনা মেনে চলুন।',
    Tamil: 'பாதுகாப்பாக இருங்கள், அரசு அறிவிப்புகளை பின்பற்றுங்கள்.',
    Telugu: 'సురక్షితంగా ఉండండి మరియు అధికారిక సూచనలను అనుసరించండి.',
    Marathi: 'सुरक्षित राहा आणि अधिकृत सूचनांचे पालन करा.',
    Gujarati: 'સુરક્ષિત રહો અને સત્તાવાર સૂચનાઓ અનુસરો.',
    Kannada: 'ಸುರಕ್ಷಿತವಾಗಿರಿ ಮತ್ತು ಅಧಿಕೃತ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಿ.',
    Malayalam: 'സുരക്ഷിതരായിരിക്കുക, ഔദ്യോഗിക നിർദ്ദേശങ്ങൾ പാലിക്കുക.',
    Punjabi: 'ਸੁਰੱਖਿਅਤ ਰਹੋ ਅਤੇ ਅਧਿਕਾਰਤ ਹਦਾਇਤਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ.',
    Odia: 'ସୁରକ୍ଷିତ ରୁହନ୍ତୁ ଏବଂ ଅଧିକୃତ ନିର୍ଦ୍ଦେଶ ପାଳନ କରନ୍ତୁ।',
    Urdu: 'محفوظ رہیں اور سرکاری ہدایات پر عمل کریں۔',
    Assamese: 'নিৰাপদে থাকক আৰু চৰকাৰী নিৰ্দেশনা মানি চলক।',
  },
  'Move to higher ground immediately.': {
    Hindi: 'तुरंत ऊंची जमीन पर जाएं।',
    Bengali: 'অবিলম্বে উঁচু জায়গায় যান।',
    Tamil: 'உடனடியாக உயர்ந்த இடத்திற்கு செல்லுங்கள்.',
    Telugu: 'వెంటనే ఎత్తైన ప్రదేశానికి వెళ్ళండి.',
    Marathi: 'लगेच उंच जागी जा.',
    Gujarati: 'તરત ઊંચી જગ્યા પર જાઓ.',
    Kannada: 'ತಕ್ಷಣ ಎತ್ತರದ ಪ್ರದೇಶಕ್ಕೆ ತೆರಳಿ.',
    Malayalam: 'ഉടൻ ഉയർന്ന സ്ഥലത്തേക്ക് മാറുക.',
    Punjabi: 'ਤੁਰੰਤ ਉੱਚੀ ਜਗ੍ਹਾ ਵੱਲ ਜਾਓ.',
    Odia: 'ତୁରନ୍ତ ଉଚ୍ଚ ଭୂମିକୁ ଯାଆନ୍ତୁ।',
    Urdu: 'فوری طور پر اونچی جگہ پر جائیں۔',
    Assamese: 'তৎক্ষণাত উচ্চ ভূমিলৈ যাওক।',
  },
};

/**
 * Translate text to a target language.
 * - Uses the offline phrase bank for exact known phrases.
 * - Routes to a self-hosted LibreTranslate instance via Supabase for unknown text.
 */
export async function translateText(text: string, targetLanguage: string, isOffline: boolean): Promise<string> {
  // Exact offline match.
  const offlineResult = offlinePhrases[text]?.[targetLanguage];
  if (offlineResult) return offlineResult;

  if (isOffline) return `[Offline — exact translation not available for this phrase in ${targetLanguage}]`;

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) throw new Error('Not configured');

    const response = await fetch(`${supabaseUrl}/functions/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) throw new Error('Translation service error');
    const data: { result: string } = await response.json();
    return data.result;
  } catch {
    return `[Translation unavailable — connect to the internet for ${targetLanguage} translation]`;
  }
}
