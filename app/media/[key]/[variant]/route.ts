import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { NextRequest } from 'next/server';
import { checkUnlock, unlockCookieName } from '@/lib/server/access';
import { isSignedIn } from '@/lib/server/auth';
import { fileFor } from '@/lib/server/media';
import { getMediaByKey, getProperty } from '@/lib/server/repo';

/** Only the cover and the site pictures are open to everyone; the rest needs an unlock. */
const OPEN_ROLES = new Set(['cover', 'hero', 'portrait']);

const CONTENT_TYPES: Record<string, string> = { sm: 'image/webp', md: 'image/webp', lg: 'image/webp', og: 'image/jpeg' };

export async function GET(request: NextRequest, ctx: RouteContext<'/media/[key]/[variant]'>) {
  const { key, variant } = await ctx.params;
  if (!/^[\w-]{1,64}$/.test(key) || !/^[\w.-]{1,32}$/.test(variant)) {
    return new Response('Not found', { status: 404 });
  }

  const media = getMediaByKey(key);
  if (!media) return new Response('Not found', { status: 404 });

  const open = OPEN_ROLES.has(media.role) || !media.property_id || !getProperty(media.property_id)?.gated;
  if (!open) {
    const token = request.cookies.get(unlockCookieName(media.property_id!))?.value;
    const unlocked = Boolean(checkUnlock(media.property_id!, token));
    if (!unlocked && !(await isSignedIn())) {
      return new Response('This photo is locked.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  const path = fileFor(key, variant);
  let size: number;
  try {
    const stat = await fs.stat(path);
    if (!stat.isFile()) throw new Error('not a file');
    size = stat.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const type = CONTENT_TYPES[variant] ?? (variant === 'file' ? media.mime : 'application/octet-stream');
  const headers = new Headers({
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    // A locked file must never be kept by a shared cache, and the browser should re-ask once
    // the unlock lapses. Open files never change, so they can be cached hard.
    'Cache-Control': open ? 'public, max-age=31536000, immutable' : 'private, no-store',
  });
  if (media.kind === 'document') {
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(media.original_name || 'document.pdf')}"`);
  }

  // Videos are seeked, so honour range requests.
  const range = request.headers.get('range');
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && media.kind === 'video') {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response('Range not satisfiable', { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers });
  }

  headers.set('Content-Length', String(size));
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new Response(stream, { status: 200, headers });
}

export const HEAD = GET;
