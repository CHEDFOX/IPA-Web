import 'server-only';
import { getDb } from './db';
import { normalizeCode, randomCode, randomToken, sha256, text } from './util';

/**
 * How long an unlock lasts. The clock restarts on every ping from an open tab, so a visitor
 * who stays on the site keeps access; one who leaves loses it ten minutes later, whether or
 * not the tab was closed.
 */
export const UNLOCK_MINUTES = Number(process.env.IPA_UNLOCK_MINUTES || 10);
const UNLOCK_MS = Math.max(1, UNLOCK_MINUTES) * 60_000;

export const unlockCookieName = (propertyId: number) => `ipa_unlock_${propertyId}`;

export interface CodeRow {
  id: number;
  property_id: number;
  code: string;
  max_uses: number;
  used_count: number;
  state: 'active' | 'spent' | 'revoked';
  note: string;
  created_at: string;
  first_used_at: string | null;
  last_used_at: string | null;
}

// ---------- codes

function insertCode(propertyId: number, maxUses: number, note = ''): CodeRow {
  const db = getDb();
  const taken = db.prepare("SELECT 1 FROM codes WHERE code = ? AND state = 'active'");
  let code = randomCode();
  for (let i = 0; i < 50 && taken.get(code); i++) code = randomCode();
  const info = db
    .prepare('INSERT INTO codes (property_id, code, max_uses, note) VALUES (?, ?, ?, ?)')
    .run(propertyId, code, Math.max(1, maxUses), note);
  return db.prepare('SELECT * FROM codes WHERE id = ?').get(Number(info.lastInsertRowid)) as CodeRow;
}

/**
 * How many codes stand ready for each property. The pool is refilled as codes are spent,
 * so the panel always shows this many that nobody has used.
 */
export const CODE_POOL = Math.min(50, Math.max(1, Number(process.env.IPA_CODE_POOL || 10)));

const activeRows = (propertyId: number) =>
  getDb()
    .prepare("SELECT * FROM codes WHERE property_id = ? AND state = 'active' ORDER BY id")
    .all(propertyId) as CodeRow[];

/** Mints codes until the pool is full again. Returns the full pool, oldest first. */
export function ensureCodePool(propertyId: number, maxUses = 1): CodeRow[] {
  const db = getDb();
  return db.transaction(() => {
    let rows = activeRows(propertyId);
    const uses = rows[0]?.max_uses ?? maxUses;
    for (let i = rows.length; i < CODE_POOL; i++) insertCode(propertyId, uses);
    if (rows.length < CODE_POOL) rows = activeRows(propertyId);
    return rows;
  })();
}

/** The codes the panel shows for a listing: ten of them, all unused. */
export function activeCodes(propertyId: number, maxUses = 1): CodeRow[] {
  return ensureCodePool(propertyId, maxUses);
}

/** The single code to hand to one caller: the oldest one not already promised to someone. */
export function nextCode(propertyId: number, exclude: string[] = []): CodeRow | null {
  const pool = ensureCodePool(propertyId);
  return pool.find((row) => !exclude.includes(row.code)) ?? pool[0] ?? null;
}

export function listCodes(propertyId: number, limit = 40): CodeRow[] {
  return getDb()
    .prepare('SELECT * FROM codes WHERE property_id = ? ORDER BY id DESC LIMIT ?')
    .all(propertyId, limit) as CodeRow[];
}

/** Retires one code — it stops working at once — and refills the pool behind it. */
export function replaceCode(codeId: number): CodeRow[] {
  const db = getDb();
  return db.transaction(() => {
    const row = db.prepare('SELECT * FROM codes WHERE id = ?').get(codeId) as CodeRow | undefined;
    if (!row) return [];
    db.prepare("UPDATE codes SET state = 'revoked' WHERE id = ?").run(row.id);
    return ensureCodePool(row.property_id, row.max_uses);
  })();
}

/** Retires every waiting code for a property and mints a whole new set. */
export function replaceAllCodes(propertyId: number, maxUses?: number): CodeRow[] {
  const db = getDb();
  return db.transaction(() => {
    const current = activeRows(propertyId);
    db.prepare("UPDATE codes SET state = 'revoked' WHERE property_id = ? AND state = 'active'").run(propertyId);
    return ensureCodePool(propertyId, maxUses ?? current[0]?.max_uses ?? 1);
  })();
}

/** Changes how many visitors each waiting code may admit. */
export function setPoolUses(propertyId: number, maxUses: number) {
  getDb()
    .prepare("UPDATE codes SET max_uses = ? WHERE property_id = ? AND state = 'active'")
    .run(Math.max(1, maxUses), propertyId);
}

export type RedeemResult =
  | { ok: true; code: CodeRow; token: string; expiresAt: number }
  | { ok: false; reason: 'unknown' | 'spent' };

/**
 * Checks a code against one listing and, if it is good, spends a use and opens a session.
 * The last use retires that code and mints a replacement, so the pool of waiting codes
 * always holds the same number that nobody has used.
 */
export function redeemCode(propertyId: number, input: string, userAgent = ''): RedeemResult {
  const db = getDb();
  const wanted = normalizeCode(input);
  if (wanted.length < 4) return { ok: false, reason: 'unknown' };

  return db.transaction((): RedeemResult => {
    const row = db.prepare('SELECT * FROM codes WHERE property_id = ? AND code = ?').get(propertyId, wanted) as
      | CodeRow
      | undefined;
    if (!row) return { ok: false, reason: 'unknown' };
    if (row.state !== 'active' || row.used_count >= row.max_uses) return { ok: false, reason: 'spent' };

    const used = row.used_count + 1;
    const spent = used >= row.max_uses;
    db.prepare(
      `UPDATE codes SET
         used_count = ?,
         state = ?,
         first_used_at = COALESCE(first_used_at, (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))),
         last_used_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       WHERE id = ?`,
    ).run(used, spent ? 'spent' : 'active', row.id);
    if (spent) insertCode(propertyId, row.max_uses);

    const { token, expiresAt } = openUnlock(propertyId, row.id, userAgent);
    return { ok: true, code: { ...row, used_count: used }, token, expiresAt };
  })();
}

// ---------- unlock sessions

function openUnlock(propertyId: number, codeId: number | null, userAgent: string) {
  const db = getDb();
  const token = randomToken(24);
  const expiresAt = Date.now() + UNLOCK_MS;
  db.prepare('DELETE FROM unlocks WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO unlocks (token_hash, property_id, code_id, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)').run(
    sha256(token),
    propertyId,
    codeId,
    expiresAt,
    text(userAgent, 300),
  );
  return { token, expiresAt };
}

/** Reads a token without touching its clock. */
export function checkUnlock(propertyId: number, token: string | undefined): number | null {
  if (!token) return null;
  const row = getDb()
    .prepare('SELECT expires_at FROM unlocks WHERE token_hash = ? AND property_id = ?')
    .get(sha256(token), propertyId) as { expires_at: number } | undefined;
  if (!row || row.expires_at <= Date.now()) return null;
  return row.expires_at;
}

/**
 * Confirms the token and pushes its expiry back. Called while the tab is open, which is what
 * keeps a visitor's access alive for as long as they are actually on the site.
 */
export function touchUnlock(propertyId: number, token: string | undefined): number | null {
  if (!checkUnlock(propertyId, token)) return null;
  const expiresAt = Date.now() + UNLOCK_MS;
  getDb()
    .prepare(
      "UPDATE unlocks SET expires_at = ?, last_seen_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) WHERE token_hash = ? AND property_id = ?",
    )
    .run(expiresAt, sha256(token!), propertyId);
  return expiresAt;
}

export function endUnlock(token: string | undefined) {
  if (token) getDb().prepare('DELETE FROM unlocks WHERE token_hash = ?').run(sha256(token));
}

export function activeUnlockCount(propertyId: number): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS n FROM unlocks WHERE property_id = ? AND expires_at > ?')
    .get(propertyId, Date.now()) as { n: number };
  return row.n;
}

/** Cuts off everyone currently inside a listing. */
export function revokeUnlocks(propertyId: number) {
  getDb().prepare('DELETE FROM unlocks WHERE property_id = ?').run(propertyId);
}

// ---------- "I don't have a code"

export interface AccessRequestRow {
  id: number;
  property_id: number | null;
  property_title: string;
  name: string;
  phone: string;
  message: string;
  page_url: string;
  state: 'new' | 'sent' | 'closed';
  sent_code: string;
  created_at: string;
  handled_at: string | null;
}

export function createAccessRequest(input: {
  propertyId: number | null;
  propertyTitle: string;
  name: string;
  phone: string;
  message?: string;
  pageUrl?: string;
}): number {
  const info = getDb()
    .prepare(
      `INSERT INTO access_requests (property_id, property_title, name, phone, message, page_url)
       VALUES (@propertyId, @propertyTitle, @name, @phone, @message, @pageUrl)`,
    )
    .run({
      propertyId: input.propertyId,
      propertyTitle: text(input.propertyTitle, 200),
      name: text(input.name, 100),
      phone: text(input.phone, 40),
      message: text(input.message, 1000),
      pageUrl: text(input.pageUrl, 500),
    });
  return Number(info.lastInsertRowid);
}

export function listAccessRequests(state?: AccessRequestRow['state']): AccessRequestRow[] {
  const db = getDb();
  return (
    state
      ? db.prepare('SELECT * FROM access_requests WHERE state = ? ORDER BY created_at DESC LIMIT 200').all(state)
      : db.prepare('SELECT * FROM access_requests ORDER BY created_at DESC LIMIT 200').all()
  ) as AccessRequestRow[];
}

export function countNewAccessRequests(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM access_requests WHERE state = 'new'").get() as { n: number };
  return row.n;
}

export function markAccessRequest(id: number, state: AccessRequestRow['state'], sentCode = '') {
  getDb()
    .prepare(
      `UPDATE access_requests SET
         state = ?,
         sent_code = CASE WHEN ? <> '' THEN ? ELSE sent_code END,
         handled_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       WHERE id = ?`,
    )
    .run(state, sentCode, sentCode, id);
}
