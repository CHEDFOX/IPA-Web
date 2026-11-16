import type { NextRequest } from 'next/server';
import { createAccessRequest } from '@/lib/server/access';
import { rateLimit } from '@/lib/server/ratelimit';
import { getPropertyBySlug, getPropertyByToken } from '@/lib/server/repo';
import { text } from '@/lib/server/util';

/** POST { slug, name, phone } — "I don't have a code", so the team can call back with one. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(request, 'access-request', { windowMs: 10 * 60_000, max: 6 });
  if (!limit.ok) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    token?: string;
    name?: string;
    phone?: string;
    message?: string;
    pageUrl?: string;
    website?: string;
  };
  // Bots fill every field, including the hidden one; accept and drop.
  if (body.website) return Response.json({ ok: true }, { status: 201 });

  const phone = text(body.phone, 40);
  if (phone.replace(/\D/g, '').length < 7) {
    return Response.json({ error: 'Please enter a phone number we can reach you on.', field: 'phone' }, { status: 400 });
  }

  const property = body.token ? getPropertyByToken(body.token) : body.slug ? getPropertyBySlug(body.slug) : null;
  createAccessRequest({
    propertyId: property?.id ?? null,
    propertyTitle: property?.title ?? '',
    name: text(body.name, 100),
    phone,
    message: text(body.message, 1000),
    pageUrl: text(body.pageUrl, 500),
  });
  return Response.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
