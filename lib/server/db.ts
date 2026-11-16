import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

const NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))";

// Append new migrations to the end; never edit one that has shipped.
const MIGRATIONS: string[] = [
  `
  -- Regions are the managed list of places a property can be in.
  CREATE TABLE regions (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_hi TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE properties (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    share_token TEXT NOT NULL UNIQUE,
    region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    title_hi TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'land' CHECK (type IN ('land', 'residential', 'commercial')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'under_offer', 'sold')),
    visibility TEXT NOT NULL DEFAULT 'draft' CHECK (visibility IN ('public', 'unlisted', 'draft')),
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    price REAL,
    price_note TEXT NOT NULL DEFAULT '',
    price_note_hi TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    address_hi TEXT NOT NULL DEFAULT '',
    latitude REAL,
    longitude REAL,
    area REAL,
    area_unit TEXT NOT NULL DEFAULT 'm2',
    bedrooms INTEGER,
    bathrooms INTEGER,
    summary TEXT NOT NULL DEFAULT '',
    summary_hi TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    description_hi TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '[]',
    nearby TEXT NOT NULL DEFAULT '[]',
    -- 0 turns the OTP gate off for this listing: photos and location are open to everyone.
    gated INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT ${NOW},
    updated_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX properties_by_region ON properties (region_id);

  CREATE TABLE media (
    id INTEGER PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('cover', 'gallery', 'plan', 'brochure', 'hero', 'portrait')),
    kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'document')),
    key TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL,
    bytes INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    duration REAL,
    file TEXT,
    variants TEXT NOT NULL DEFAULT '{}',
    alt TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX media_by_property ON media (property_id, role, sort_order);

  -- One row per code. A code is burned once used_count reaches max_uses, and the
  -- panel immediately shows a fresh one in its place.
  CREATE TABLE codes (
    id INTEGER PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'spent', 'revoked')),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ${NOW},
    first_used_at TEXT,
    last_used_at TEXT
  );
  CREATE INDEX codes_by_property ON codes (property_id, state);
  CREATE UNIQUE INDEX codes_active_value ON codes (code) WHERE state = 'active';

  -- A visitor who entered a valid code. expires_at slides forward while they are on the site.
  CREATE TABLE unlocks (
    id INTEGER PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    code_id INTEGER REFERENCES codes(id) ON DELETE SET NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW},
    last_seen_at TEXT NOT NULL DEFAULT ${NOW},
    user_agent TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX unlocks_by_property ON unlocks (property_id);
  CREATE INDEX unlocks_by_expiry ON unlocks (expires_at);

  -- "I don't have a code": the visitor leaves a number for the team to call back.
  CREATE TABLE access_requests (
    id INTEGER PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    property_title TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    page_url TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'sent', 'closed')),
    sent_code TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ${NOW},
    handled_at TEXT
  );
  CREATE INDEX access_requests_by_state ON access_requests (state, created_at);

  CREATE TABLE enquiries (
    id INTEGER PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    property_title TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    page_url TEXT NOT NULL DEFAULT '',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE admin_sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  `,
];

let instance: Db | null = null;

export function dataDir(): string {
  return path.resolve(process.env.IPA_DATA_DIR || 'data');
}

export function mediaDir(): string {
  return path.join(dataDir(), 'media');
}

export function getDb(): Db {
  if (instance) return instance;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(mediaDir(), { recursive: true });
  const db = new Database(path.join(dir, 'ipa.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  migrate(db);
  instance = db;
  return db;
}

function migrate(db: Db) {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (let i = current; i < MIGRATIONS.length; i++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[i]);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
}

/** Test seam: point the module at a throwaway database. */
export function __setDb(db: Db | null) {
  instance = db;
}
