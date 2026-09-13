/**
 * Live disaster alert feed service.
 *
 * Sources:
 *  1. Open-Meteo Weather API — real-time weather with severe weather codes.
 *  2. NDMA / IMD RSS feeds via a Supabase Edge Function proxy (to avoid CORS).
 *
 * The fetchWeatherAlerts function maps WMO weather codes > 70 (snow, rain,
 * thunderstorm, fog, drizzle) to AlertItems that integrate directly into the
 * existing alerts array.
 *
 * Usage in a component:
 *   const { data: liveAlerts } = useQuery({ queryKey: ['live-alerts', lat, lon], queryFn: () => fetchWeatherAlerts(lat, lon) });
 */
import { AlertItem, Severity } from '@/constants/data';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  current_units: {
    temperature_2m: string;
    wind_speed_10m: string;
    precipitation: string;
  };
};

function weatherCodeToDescription(code: number): { title: string; body: string; severity: Severity } {
  if (code >= 95) return { title: 'Thunderstorm Warning', body: 'Severe thunderstorm with heavy rain or hail. Seek indoor shelter immediately and avoid high ground.', severity: 'Critical' };
  if (code >= 80) return { title: 'Heavy Rain / Shower Alert', body: 'Heavy rain showers expected. Risk of local flooding. Avoid low-lying areas and riverbanks.', severity: 'High' };
  if (code >= 71) return { title: 'Snowfall Warning', body: 'Significant snowfall expected. Roads may become impassable. Stock emergency supplies.', severity: 'High' };
  if (code >= 61) return { title: 'Rainfall Advisory', body: 'Moderate to heavy rainfall anticipated. Stay tuned to NDMA for updates and keep emergency kit ready.', severity: 'Moderate' };
  if (code >= 51) return { title: 'Drizzle and Low Visibility', body: 'Persistent drizzle reducing visibility. Drive carefully and watch for waterlogging in urban areas.', severity: 'Low' };
  if (code === 45 || code === 48) return { title: 'Dense Fog Advisory', body: 'Dense fog reducing visibility to under 200 metres. Avoid highway travel and keep fog lights on.', severity: 'Moderate' };
  return { title: 'Weather Advisory', body: `Weather code ${code} observed. Monitor local authorities for updates.`, severity: 'Low' };
}

/** Fetch real weather-based alerts from Open-Meteo for a given GPS location. */
export async function fetchWeatherAlerts(latitude: number, longitude: number): Promise<AlertItem[]> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: 'temperature_2m,weather_code,wind_speed_10m,precipitation',
    forecast_days: '1',
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`);
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);

  const data: OpenMeteoResponse = await response.json();
  const code = data.current.weather_code;

  // Only surface alerts for adverse conditions (code ≥ 45).
  if (code < 45) return [];

  const { title, body, severity } = weatherCodeToDescription(code);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const alert: AlertItem = {
    id: `weather-live-${code}-${now.toDateString().replace(/ /g, '-')}`,
    title,
    severity,
    time: `${timeStr} IST`,
    location: `${latitude.toFixed(2)}°N ${longitude.toFixed(2)}°E`,
    body: `${body} (Temp: ${data.current.temperature_2m}${data.current_units.temperature_2m} · Wind: ${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m} · Precip: ${data.current.precipitation} ${data.current_units.precipitation})`,
    source: 'Open-Meteo / IMD',
  };

  return [alert];
}

// ---------------------------------------------------------------------------
// NDMA RSS Feed
// ---------------------------------------------------------------------------

/**
 * Fetches the NDMA public alerts RSS feed and returns parsed AlertItems.
 *
 * NOTE: The NDMA RSS feed is fetched via a Supabase Edge Function acting as a
 * CORS proxy. Deploy the edge function in `supabase/functions/ndma-proxy/`
 * before this will work. Until then it returns an empty array gracefully.
 */
export async function fetchNdmaAlerts(): Promise<AlertItem[]> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) return [];

    const response = await fetch(`${supabaseUrl}/functions/v1/ndma-proxy`, {
      headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}` },
    });

    if (!response.ok) return [];
    const alerts: AlertItem[] = await response.json();
    return alerts;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Overpass API — Shelters and Hospitals
// ---------------------------------------------------------------------------

export type EmergencyPlace = {
  id: string;
  type: 'Shelter' | 'Hospital' | 'Relief camp' | 'Police';
  title: string;
  coordinate: { latitude: number; longitude: number };
};

/**
 * Fetches real shelter/hospital data from OpenStreetMap's Overpass API
 * within a given radius (metres) of the provided GPS coordinates.
 */
export async function fetchNearbyEmergencyPlaces(
  latitude: number,
  longitude: number,
  radiusMetres = 5000,
): Promise<EmergencyPlace[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radiusMetres},${latitude},${longitude});
      node["amenity"="clinic"](around:${radiusMetres},${latitude},${longitude});
      node["social_facility"="shelter"](around:${radiusMetres},${latitude},${longitude});
      node["amenity"="police"](around:${radiusMetres},${latitude},${longitude});
    );
    out body;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!response.ok) throw new Error('Overpass API error');

  const data: { elements: Array<{ id: number; lat: number; lon: number; tags: Record<string, string> }> } = await response.json();

  return data.elements.map((el) => {
    const amenity = el.tags.amenity ?? el.tags.social_facility ?? 'shelter';
    let type: EmergencyPlace['type'] = 'Shelter';
    if (amenity === 'hospital' || amenity === 'clinic') type = 'Hospital';
    if (amenity === 'police') type = 'Police';

    return {
      id: `osm-${el.id}`,
      type,
      title: el.tags.name ?? el.tags['name:en'] ?? `${type} (OSM ${el.id})`,
      coordinate: { latitude: el.lat, longitude: el.lon },
    };
  });
}
