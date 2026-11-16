import type { NextRequest } from 'next/server';
import { UNLOCK_MINUTES, checkUnlock, redeemCode, unlockCookieName } from '@/lib/server/access';
import { mediaOf, getPropertyBySlug, getPropertyByToken } from '@/lib/server/repo';
import { serializeDetail } from '@/lib/server/serialize';
import { rateLimit } from '@/lib/server/ratelimit';

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function findProperty(body: { slug?: unknown; token?: unknown }) {
  if (typeof body.token === 'string' && body.token) return getPropertyByToken(body.token);
  if (typeof body.slug === 'string' && body.slug) return getPropertyBySlug(body.slug);
  return null;
}

/** POST { slug, code } — spend a code and open a ten-minute unlock. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(request, 'unlock', { windowMs: 10 * 60_000, max: 12 });
  if (!limit.ok) return json({ error: 'Too many tries. Please wait a few minutes and try again.' }, 429);

  const body = (await request.json().catch(() => ({}))) as { slug?: string; token?: string; code?: string };
  const property = findProperty(body);
  if (!property) return json({ error: 'Property not found.' }, 404);
  if (!property.gated) return json({ error: 'This property is already open.' }, 400);

  const result = redeemCode(property.id, String(body.code ?? ''), request.headers.get('user-agent') ?? '');
  if (!result.ok) {
    return json(
      {
        error:
          result.reason === 'spent'
            ? 'That code has already been used. Ask us for a new one.'
            : 'That code is not right for this property.',
      },
      400,
    );
  }

  const response = json({
    ok: true,
    expiresAt: result.expiresAt,
    minutes: UNLOCK_MINUTES,
    detail: serializeDetail(property, mediaOf(property.id), result.expiresAt),
  });
  response.headers.append(
    'Set-Cookie',
    cookie(unlockCookieName(property.id), result.token, Math.ceil((result.expiresAt - Date.now()) / 1000), request),
  );
  return response;
}

/** GET ?slug= — what this visitor may currently see. Called when the page loads. */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const token = request.nextUrl.searchParams.get('token');
  const property = findProperty({ slug, token });
  if (!property) return json({ error: 'Property not found.' }, 404);

  const media = mediaOf(property.id);
  if (!property.gated) return json({ unlocked: true, gated: false, detail: serializeDetail(property, media) });

  const expiresAt = checkUnlock(property.id, request.cookies.get(unlockCookieName(property.id))?.value);
  if (!expiresAt) return json({ unlocked: false, gated: true });
  return json({ unlocked: true, gated: true, expiresAt, minutes: UNLOCK_MINUTES, detail: serializeDetail(property, media, expiresAt) });
}

export function cookie(name: string, value: string, maxAgeSeconds: number, request: NextRequest): string {
  // Behind nginx or Caddy the request reaches us over plain http, so the proxy's header is
  // what says whether the visitor is on https.
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const https = forwarded ? forwarded === 'https' : request.nextUrl.protocol === 'https:';
  return `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${https ? '; Secure' : ''}`;
}
