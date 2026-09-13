/**
 * Supabase Edge Function: ai-assistant
 *
 * Server-side Gemini API proxy. The Gemini API key lives here as a
 * Supabase Secret — it never ships inside the mobile app.
 *
 * Set the secret before deploying:
 *   supabase secrets set GEMINI_API_KEY=AIza... --project-ref iemwghwlnsigoemrenon
 *
 * Deploy with:
 *   supabase functions deploy ai-assistant --project-ref iemwghwlnsigoemrenon
 *
 * Request body:
 *   { "prompt": "...", "context": "disaster_management_india" }
 *
 * Response:
 *   { "reply": "..." }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `You are BAP Safety Assistant, an emergency management AI for India.
Your role:
- Provide clear, concise, actionable disaster safety guidance.
- Focus on Indian context: geography, emergency numbers (112, 108, 101, 1078), NDMA guidelines.
- Cover: floods, earthquakes, cyclones, fires, landslides, industrial disasters.
- Keep responses under 300 words.
- Use bullet points for step-by-step instructions.
- Always end with the most relevant Indian emergency number if applicable.
- Do NOT discuss unrelated topics. If asked something irrelevant, redirect to disaster safety.
- Respond in the same language the user used if possible.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY secret not configured' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 },
      );
    }

    const body = await req.json() as { prompt?: string; context?: string };
    const userPrompt = body.prompt?.trim();

    if (!userPrompt) {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    const geminiPayload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
        topP: 0.8,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status}`, detail: errText }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 502 },
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
