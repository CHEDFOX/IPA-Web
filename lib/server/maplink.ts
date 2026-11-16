import 'server-only';

export interface Point {
  latitude: number;
  longitude: number;
}

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/** 28°36'46"N 77°13'46"E and friends. */
function fromDegrees(input: string): Point | null {
  const pattern = /(\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)?\s*['′]?\s*(\d+(?:\.\d+)?)?\s*["″]?\s*([NSEW])/gi;
  const found: { value: number; hemi: string }[] = [];
  for (const m of input.matchAll(pattern)) {
    const value = Number(m[1]) + Number(m[2] ?? 0) / 60 + Number(m[3] ?? 0) / 3600;
    found.push({ value, hemi: m[4].toUpperCase() });
  }
  if (found.length < 2) return null;
  const lat = found.find((f) => f.hemi === 'N' || f.hemi === 'S');
  const lng = found.find((f) => f.hemi === 'E' || f.hemi === 'W');
  if (!lat || !lng) return null;
  const latitude = lat.hemi === 'S' ? -lat.value : lat.value;
  const longitude = lng.hemi === 'W' ? -lng.value : lng.value;
  return valid(latitude, longitude) ? { latitude, longitude } : null;
}

/** Pulls coordinates out of a full Google Maps URL or a plain "lat, lng" pair. */
export function parsePoint(input: string): Point | null {
  const value = String(input ?? '').trim();
  if (!value) return null;

  const degrees = fromDegrees(value);
  if (degrees) return degrees;

  // !3dLAT!4dLNG is the pin itself, so it wins over @LAT,LNG (the camera).
  const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /[?&](?:q|query|destination|ll|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /\/(-?\d+\.\d+),(-?\d+\.\d+)/, /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/];
  for (const pattern of patterns) {
    const m = value.match(pattern);
    if (m) {
      const latitude = Number(m[1]);
      const longitude = Number(m[2]);
      if (valid(latitude, longitude)) return { latitude, longitude };
    }
  }
  return null;
}

/**
 * Short links (maps.app.goo.gl, goo.gl/maps) hide the coordinates behind a redirect, so
 * they are followed once. Returns null when the network is unavailable.
 */
export async function resolvePoint(input: string): Promise<Point | null> {
  const direct = parsePoint(input);
  if (direct) return direct;

  const value = String(input ?? '').trim();
  if (!/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(value)) return null;
  try {
    const res = await fetch(value, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; IPA-Web)' },
    });
    const fromUrl = parsePoint(res.url);
    if (fromUrl) return fromUrl;
    const body = await res.text();
    return parsePoint(body.slice(0, 20_000));
  } catch {
    return null;
  }
}
