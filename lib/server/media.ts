import 'server-only';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { mediaDir } from './db';
import { insertMedia } from './repo';
import { randomToken } from './util';

const run = promisify(execFile);

/** Width, and the key it is stored under. The page picks a size from these. */
const IMAGE_SIZES = [
  { name: 'sm', width: 640 },
  { name: 'md', width: 1280 },
  { name: 'lg', width: 2048 },
];
const OG_SIZE = { width: 1200, height: 630 };

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/tiff'];
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
export const DOCUMENT_TYPES = ['application/pdf'];

export type MediaRole = 'cover' | 'gallery' | 'plan' | 'brochure' | 'hero' | 'portrait';

export function kindOf(mime: string): 'image' | 'video' | 'document' | null {
  if (IMAGE_TYPES.includes(mime)) return 'image';
  if (VIDEO_TYPES.includes(mime)) return 'video';
  if (DOCUMENT_TYPES.includes(mime)) return 'document';
  return null;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function fileFor(key: string, variant: string): string {
  return path.join(mediaDir(), key, variant);
}

async function hasFfmpeg(): Promise<boolean> {
  try {
    await run('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

interface Stored {
  id: number;
  key: string;
}

/**
 * Takes an upload, writes its web copies under data/media/<key>/ and records it.
 * Nothing here is served directly by the file system: every read goes through the media
 * route, which decides whether the caller may see it.
 */
export async function storeUpload(opts: {
  propertyId: number | null;
  role: MediaRole;
  file: File;
  alt?: string;
}): Promise<Stored> {
  const { propertyId, role, file } = opts;
  const mime = file.type || 'application/octet-stream';
  const kind = kindOf(mime);
  if (!kind) throw new Error(`Unsupported file type: ${mime}`);

  const key = randomToken(12);
  const dir = path.join(mediaDir(), key);
  await ensureDir(dir);
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    if (kind === 'image') return await storeImage({ propertyId, role, key, dir, bytes, file, mime, alt: opts.alt });
    if (kind === 'video') return await storeVideo({ propertyId, role, key, dir, bytes, file, mime, alt: opts.alt });
    return await storeDocument({ propertyId, role, key, dir, bytes, file, mime, alt: opts.alt });
  } catch (err) {
    await fs.rm(dir, { recursive: true, force: true });
    throw err;
  }
}

interface StoreArgs {
  propertyId: number | null;
  role: MediaRole;
  key: string;
  dir: string;
  bytes: Buffer;
  file: File;
  mime: string;
  alt?: string;
}

async function storeImage({ propertyId, role, key, dir, bytes, file, alt }: StoreArgs): Promise<Stored> {
  // rotate() bakes in the EXIF orientation; the metadata (including GPS) is dropped on write.
  const source = sharp(bytes, { failOn: 'none' }).rotate();
  const meta = await source.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error('That image could not be read.');

  const variants: Record<string, { file: string; width: number; height: number }> = {};
  for (const size of IMAGE_SIZES) {
    if (size.width > width && Object.keys(variants).length) continue;
    const target = Math.min(size.width, width);
    const out = await sharp(bytes, { failOn: 'none' })
      .rotate()
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    await fs.writeFile(path.join(dir, size.name), out.data);
    variants[size.name] = { file: size.name, width: out.info.width, height: out.info.height };
  }

  // Link previews need a fixed 1200×630 JPEG; WhatsApp and iMessage are fussy about WebP.
  const og = await sharp(bytes, { failOn: 'none' })
    .rotate()
    .resize({ ...OG_SIZE, fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82 })
    .toBuffer();
  await fs.writeFile(path.join(dir, 'og'), og);
  variants.og = { file: 'og', ...OG_SIZE };

  const id = insertMedia({
    propertyId,
    role,
    kind: 'image',
    key,
    originalName: file.name || '',
    mime: 'image/webp',
    bytes: bytes.length,
    width,
    height,
    duration: null,
    file: null,
    variants,
    alt,
  });
  return { id, key };
}

async function storeVideo({ propertyId, role, key, dir, bytes, file, mime, alt }: StoreArgs): Promise<Stored> {
  const source = path.join(dir, 'file');
  await fs.writeFile(source, bytes);

  let width: number | null = null;
  let height: number | null = null;
  let duration: number | null = null;
  const variants: Record<string, { file: string; width: number; height: number }> = {};

  if (await hasFfmpeg()) {
    try {
      const { stdout } = await run('ffprobe', [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height:format=duration',
        '-of',
        'json',
        source,
      ]);
      const probe = JSON.parse(stdout) as { streams?: { width?: number; height?: number }[]; format?: { duration?: string } };
      width = probe.streams?.[0]?.width ?? null;
      height = probe.streams?.[0]?.height ?? null;
      duration = probe.format?.duration ? Number(probe.format.duration) : null;
    } catch {
      // A video we cannot probe still plays; it just has no dimensions on the page.
    }
    try {
      const frame = path.join(dir, 'poster.jpg');
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1', '-i', source, '-frames:v', '1', frame]);
      const poster = await fs.readFile(frame);
      for (const size of IMAGE_SIZES.slice(0, 2)) {
        const out = await sharp(poster)
          .resize({ width: size.width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer({ resolveWithObject: true });
        await fs.writeFile(path.join(dir, size.name), out.data);
        variants[size.name] = { file: size.name, width: out.info.width, height: out.info.height };
      }
      const og = await sharp(poster).resize({ ...OG_SIZE, fit: 'cover', position: 'attention' }).jpeg({ quality: 82 }).toBuffer();
      await fs.writeFile(path.join(dir, 'og'), og);
      variants.og = { file: 'og', ...OG_SIZE };
      await fs.rm(frame, { force: true });
    } catch {
      // No poster frame: the gallery falls back to a plain play tile.
    }
  }

  const id = insertMedia({
    propertyId,
    role,
    kind: 'video',
    key,
    originalName: file.name || '',
    mime,
    bytes: bytes.length,
    width,
    height,
    duration,
    file: 'file',
    variants,
    alt,
  });
  return { id, key };
}

async function storeDocument({ propertyId, role, key, dir, bytes, file, mime, alt }: StoreArgs): Promise<Stored> {
  await fs.writeFile(path.join(dir, 'file'), bytes);
  const id = insertMedia({
    propertyId,
    role,
    kind: 'document',
    key,
    originalName: file.name || '',
    mime,
    bytes: bytes.length,
    width: null,
    height: null,
    duration: null,
    file: 'file',
    variants: {},
    alt,
  });
  return { id, key };
}

export async function removeMediaFiles(key: string) {
  await fs.rm(path.join(mediaDir(), key), { recursive: true, force: true });
}
