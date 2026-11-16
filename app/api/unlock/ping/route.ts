import type { NextRequest } from 'next/server';
import { touchUnlock, unlockCookieName } from '@/lib/server/access';
import { getPropertyBySlug, getPropertyByToken } from '@/lib/server/repo';
import { cookie } from '../route';

/**
 * Sent by an open tab every minute or so. Each ping pushes the unlock's expiry back, which is
 * what keeps the photos visible while the visitor is still reading the page.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { slug?: string; token?: string };
  const property = body.token ? getPropertyByToken(body.token) : body.slug ? getPropertyBySlug(body.slug) : null;
  if (!property) return Response.json({ error: 'Property not found.' }, { status: 404 });
  if (!property.gated) return Response.json({ unlocked: true, gated: false }, { headers: { 'Cache-Control': 'no-store' } });

  const name = unlockCookieName(property.id);
  const expiresAt = touchUnlock(property.id, request.cookies.get(name)?.value);
  if (!expiresAt) return Response.json({ unlocked: false }, { status: 200, headers: { 'Cache-Control': 'no-store' } });

  const response = Response.json({ unlocked: true, expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
  // Refresh the cookie too, so closing the tab still leaves the full window to come back in.
  response.headers.append(
    'Set-Cookie',
    cookie(name, request.cookies.get(name)!.value, Math.ceil((expiresAt - Date.now()) / 1000), request),
  );
  return response;
}
