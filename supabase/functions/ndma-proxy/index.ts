/**
 * Supabase Edge Function: ndma-proxy
 *
 * Acts as a CORS-safe server-side proxy that fetches the NDMA and IMD
 * public RSS/XML alert feeds and normalises them into AlertItem JSON.
 *
 * Deploy with:
 *   supabase functions deploy ndma-proxy --project-ref iemwghwlnsigoemrenon
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public RSS / CAP feeds — no API key required.
const ALERT_FEEDS = [
  {
    url: 'https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails',
    source: 'NDMA SACHET',
  },
  // IMD warnings XML (fallback if NDMA is unavailable)
  // 'https://mausam.imd.gov.in/imd_latest/contents/warning.xml',
];

type AlertSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';

function mapSeverity(raw: string): AlertSeverity {
  const lower = raw.toLowerCase();
  if (lower.includes('extreme') || lower.includes('red') || lower.includes('critical')) return 'Critical';
  if (lower.includes('severe') || lower.includes('orange') || lower.includes('high')) return 'High';
  if (lower.includes('moderate') || lower.includes('yellow')) return 'Moderate';
  return 'Low';
}

function slugId(str: string): string {
  return 'ndma-' + str.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) + '-' + Date.now().toString(36);
}

interface AlertItem {
  id: string;
  title: string;
  severity: AlertSeverity;
  time: string;
  location: string;
  body: string;
  source: string;
}

async function fetchNdmaAlerts(): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  for (const feed of ALERT_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { Accept: 'application/json, application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') ?? '';

      if (contentType.includes('json')) {
        // NDMA SACHET returns a JSON array.
        const data = await res.json() as Array<Record<string, string>>;
        for (const item of data.slice(0, 20)) {
          alerts.push({
            id: slugId(item.id ?? item.identifier ?? item.title ?? String(Math.random())),
            title: item.headline ?? item.title ?? 'NDMA Alert',
            severity: mapSeverity(item.severity ?? item.urgency ?? ''),
            time: item.sent ?? item.effective ?? new Date().toISOString(),
            location: item.areaDesc ?? item.area ?? 'India',
            body: item.description ?? item.instruction ?? 'Please follow NDMA guidelines.',
            source: feed.source,
          });
        }
      } else {
        // XML / RSS — parse manually.
        const text = await res.text();
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
        for (const item of items.slice(0, 10)) {
          const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? 'Alert';
          const desc = item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '';
          const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
          alerts.push({
            id: slugId(title),
            title,
            severity: mapSeverity(title + ' ' + desc),
            time: pubDate || new Date().toISOString(),
            location: 'India',
            body: desc.slice(0, 500),
            source: feed.source,
          });
        }
      }
    } catch (_err) {
      // Skip unavailable feed.
    }
  }

  return alerts;
}

serve(async (req: Request) => {
  // Handle CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const alerts = await fetchNdmaAlerts();
    return new Response(JSON.stringify(alerts), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
