/**
 * Supabase Edge Function: translate
 *
 * Translates arbitrary text into Indian languages using Google Cloud Translation API.
 * The API key lives as a Supabase Secret — never ships in the mobile app.
 *
 * Set the secret before deploying:
 *   supabase secrets set GOOGLE_TRANSLATE_API_KEY=AIza... --project-ref iemwghwlnsigoemrenon
 *
 * Deploy with:
 *   supabase functions deploy translate --project-ref iemwghwlnsigoemrenon
 *
 * Request body:
 *   { "text": "Stay safe", "targetLanguage": "Hindi" }
 *
 * Response:
 *   { "result": "सुरक्षित रहें" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map from display language names to BCP-47 codes for Google Translate.
const LANGUAGE_CODES: Record<string, string> = {
  Hindi: 'hi',
  Bengali: 'bn',
  Tamil: 'ta',
  Telugu: 'te',
  Marathi: 'mr',
  Gujarati: 'gu',
  Kannada: 'kn',
  Malayalam: 'ml',
  Punjabi: 'pa',
  Odia: 'or',
  Urdu: 'ur',
  Assamese: 'as',
  English: 'en',
  Sanskrit: 'sa',
  Sindhi: 'sd',
  Kashmiri: 'ks',
  Konkani: 'kok',
  Maithili: 'mai',
  Dogri: 'doi',
  Manipuri: 'mni',
  Santhali: 'sat',
  Bodo: 'brx',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_TRANSLATE_API_KEY secret not configured' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 },
      );
    }

    const body = await req.json() as { text?: string; targetLanguage?: string };
    const text = body.text?.trim();
    const targetLanguage = body.targetLanguage?.trim() ?? 'Hindi';

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    const targetCode = LANGUAGE_CODES[targetLanguage] ?? 'hi';

    // Use Google Cloud Translation API v2 (simple REST endpoint).
    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const translateRes = await fetch(translateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetCode,
        source: 'en',
        format: 'text',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!translateRes.ok) {
      const errText = await translateRes.text();
      return new Response(
        JSON.stringify({ error: `Translation API error: ${translateRes.status}`, detail: errText }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 502 },
      );
    }

    const data = await translateRes.json() as {
      data?: { translations?: Array<{ translatedText?: string }> };
    };

    const result = data.data?.translations?.[0]?.translatedText ?? text;

    // Decode HTML entities that Google Translate sometimes returns.
    const decoded = result
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return new Response(
      JSON.stringify({ result: decoded }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
