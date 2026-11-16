import 'server-only';
import crypto from 'node:crypto';

/** URL-safe random token. */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function timingSafeEqual(a: string, b: string): boolean {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

// No 0/O/1/I/L: these are read off a screen and typed by someone on the phone.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/**
 * What the visitor typed, in the form codes are stored in: spaces, dashes and case are
 * forgiven. Generated codes contain no O, 0, I, 1 or L, so those are never worth guessing at.
 */
export function normalizeCode(input: string): string {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

export function slugify(input: string, fallback = 'item'): string {
  const base = String(input ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || fallback;
}

/** Appends -2, -3 … until `taken` says the slug is free. */
export function uniqueSlug(base: string, taken: (slug: string) => boolean): string {
  if (!taken(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken(candidate)) return candidate;
  }
  return `${base}-${randomToken(4)}`;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toInt(value: unknown): number | null {
  const n = toNumber(value);
  return n === null ? null : Math.round(n);
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = toInt(value);
  if (n === null) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function text(value: unknown, maxLength = 2000): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}
