import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/server/ratelimit';
import { getDb } from '@/lib/server/db';
import { getProperty } from '@/lib/server/repo';
import { text, toInt } from '@/lib/server/util';

/** The enquiry form on every property page and in the contact band. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(request, 'enquiry', { windowMs: 10 * 60_000, max: 8 });
  if (!limit.ok) {
    return Response.json({ error: 'Too many messages. Please try again in a few minutes.' }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.website) return Response.json({ ok: true }, { status: 201 });

  const name = text(body.name, 100);
  const contact = text(body.contact, 150);
  const message = text(body.message, 3000);
  if (!name) return Response.json({ error: 'Please enter your name.', field: 'name' }, { status: 400 });
  if (contact.length < 5) {
    return Response.json({ error: 'Please enter a phone number or email address.', field: 'contact' }, { status: 400 });
  }

  const id = toInt(body.propertyId);
  const property = id ? getProperty(id) : null;
  getDb()
    .prepare(
      `INSERT INTO enquiries (property_id, property_title, name, contact, message, page_url)
       VALUES (@propertyId, @propertyTitle, @name, @contact, @message, @pageUrl)`,
    )
    .run({
      propertyId: property?.id ?? null,
      propertyTitle: property?.title ?? '',
      name,
      contact,
      message,
      pageUrl: text(body.pageUrl, 500),
    });
  return Response.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
