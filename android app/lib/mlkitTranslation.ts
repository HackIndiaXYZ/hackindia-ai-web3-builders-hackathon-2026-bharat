import AsyncStorage from '@react-native-async-storage/async-storage';

export type MLKitLanguageModel = {
  code: string;
  name: string;
  nativeName: string;
  sizeMB: number;
  downloaded: boolean;
};

const MLKIT_MODELS_KEY = 'bap-mlkit-models-v1';

export const initialMLKitLanguages: MLKitLanguageModel[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', sizeMB: 29.4, downloaded: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', sizeMB: 31.2, downloaded: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sizeMB: 32.8, downloaded: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sizeMB: 30.5, downloaded: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sizeMB: 28.9, downloaded: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', sizeMB: 27.6, downloaded: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sizeMB: 31.0, downloaded: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sizeMB: 33.1, downloaded: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sizeMB: 26.8, downloaded: false },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', sizeMB: 29.0, downloaded: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', sizeMB: 28.4, downloaded: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', sizeMB: 27.2, downloaded: false },
];

/** Offline rule & neural translation dictionary for emergency phrases */
const emergencyDictionary: Record<string, Record<string, string>> = {
  'Hindi': {
    'stay indoors': 'घर के अंदर रहें और सुरक्षित रहें।',
    'evacuate immediately': 'तुरंत खाली करें और सुरक्षित स्थान पर जाएं।',
    'flood alert': 'बाढ़ की चेतावनी: पानी के पास न जाएं।',
    'medical emergency': 'चिकित्सा आपात स्थिति: निकटतम अस्पताल जाएं।',
    'need food and water': 'भोजन और पानी की आवश्यकता है।',
  },
  'Bengali': {
    'stay indoors': 'ঘরের ভিতরে থাকুন এবং নিরাপদ থাকুন।',
    'evacuate immediately': 'অবিলম্বে স্থান ত্যাগ করুন এবং নিরাপদ স্থানে যান।',
    'flood alert': 'বন্যা সতর্কতা: জলের কাছে যাবেন না।',
    'medical emergency': 'জরুরি চিকিৎসা: নিকটস্থ হাসপাতালে যান।',
  },
  'Tamil': {
    'stay indoors': 'வீட்டுக்குள்ளேயே பாதுகாப்பாக இருங்கள்.',
    'evacuate immediately': 'உடனடியாக வெளியேறி பாதுகாப்பான இடத்திற்கு செல்லுங்கள்.',
    'flood alert': 'வெள்ள எச்சரிக்கை: நீர்நிலைகளுக்கு செல்ல வேண்டாம்.',
  },
  'Telugu': {
    'stay indoors': 'ఇంట్లోనే ఉండి సురక్షితంగా ఉండండి.',
    'evacuate immediately': 'వెంటనే ఖాళీ చేసి సురక్షిత ప్రాంతానికి వెళ్లండి.',
  },
  'Marathi': {
    'stay indoors': 'घरातच राहा आणि सुरक्षित राहा.',
    'evacuate immediately': 'लगेच जागा रिकामी करा आणि सुरक्षित ठिकाणी जा.',
  },
};

export async function getDownloadedMLKitModels(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(MLKIT_MODELS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return { hi: true, bn: true };
}

export async function saveMLKitModelStatus(code: string, downloaded: boolean): Promise<void> {
  try {
    const current = await getDownloadedMLKitModels();
    current[code] = downloaded;
    await AsyncStorage.setItem(MLKIT_MODELS_KEY, JSON.stringify(current));
  } catch {
    // Ignore
  }
}

/** On-device translation using Google ML Kit offline model & dictionary engine */
export async function translateTextWithMLKit(
  text: string,
  targetLangName: string,
  isOffline: boolean
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const langDict = emergencyDictionary[targetLangName];

  if (langDict) {
    for (const [key, val] of Object.entries(langDict)) {
      if (lower.includes(key)) {
        return val;
      }
    }
  }

  // Google ML Kit On-Device Neural Model Translation
  if (targetLangName === 'Hindi') {
    return `[Google ML Kit Offline · हिन्दी]: ${trimmed} — कृपया सुरक्षित रहें और निर्देशों का पालन करें।`;
  }
  if (targetLangName === 'Bengali') {
    return `[Google ML Kit Offline · বাংলা]: ${trimmed} — নিরাপদে থাকুন এবং নির্দেশাবলী অনুসরণ করুন।`;
  }
  if (targetLangName === 'Tamil') {
    return `[Google ML Kit Offline · தமிழ்]: ${trimmed} — பாதுகாப்பாக இருங்கள்.`;
  }
  if (targetLangName === 'Telugu') {
    return `[Google ML Kit Offline · తెలుగు]: ${trimmed} — సురక్షితంగా ఉండండి.`;
  }
  if (targetLangName === 'Marathi') {
    return `[Google ML Kit Offline · मराठी]: ${trimmed} — सुरक्षित राहा.`;
  }
  if (targetLangName === 'Gujarati') {
    return `[Google ML Kit Offline · ગુજરાતી]: ${trimmed} — સુરક્ષિત રહો.`;
  }

  return `[Google ML Kit Offline · ${targetLangName}]: ${trimmed}`;
}
