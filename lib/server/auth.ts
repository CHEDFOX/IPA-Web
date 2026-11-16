import 'server-only';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { randomToken, sha256, timingSafeEqual } from './util';

export const ADMIN_COOKIE = 'ipa_admin';
const SESSION_DAYS = 14;

/** Set ADMIN_PASSWORD in the environment; without it the panel refuses every sign-in. */
function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || '';
}

export function adminPasswordConfigured(): boolean {
  return adminPassword().length >= 10;
}

export function passwordMatches(input: string): boolean {
  const expected = adminPassword();
  if (expected.length < 10) return false;
  return timingSafeEqual(String(input ?? ''), expected);
}

export async function startAdminSession() {
  const db = getDb();
  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now());
  const token = randomToken(32);
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000;
  db.prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)').run(sha256(token), expiresAt);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256(token));
  jar.delete(ADMIN_COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const row = getDb().prepare('SELECT expires_at FROM admin_sessions WHERE token_hash = ?').get(sha256(token)) as
    | { expires_at: number }
    | undefined;
  return Boolean(row && row.expires_at > Date.now());
}

/** Every admin page and action calls this first. */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) throw new Error('Not signed in.');
}
