import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CACHE_TAG } from '@/lib/api';

function secretMatches(given: string | null) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Called by the backend after every change in the admin panel.
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get('x-revalidate-secret'))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  // expire: 0 drops the cached data now, so the next visitor gets the fresh version.
  revalidateTag(CACHE_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
