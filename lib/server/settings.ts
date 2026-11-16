import 'server-only';
import { getDb } from './db';
import { text } from './util';

/**
 * Site-wide text and contact details, edited in the admin panel. The WhatsApp number here is
 * the one every property's WhatsApp button uses — listings do not carry their own number.
 */
export const SETTING_DEFAULTS = {
  siteName: 'IPA',
  siteNameHi: '',
  tagline: 'Real estate & land',
  taglineHi: '',
  heroTitle: 'Land and property, ready to view.',
  heroTitleHi: '',
  heroText: '',
  heroTextHi: '',
  aboutTitle: '',
  aboutTitleHi: '',
  aboutText: '',
  aboutTextHi: '',
  contactTitle: 'Looking for something specific?',
  contactTitleHi: '',
  contactText: '',
  contactTextHi: '',
  /** Used for the Call buttons and tel: links. */
  phone: '',
  /** The single WhatsApp number behind every WhatsApp button on the site. */
  whatsapp: '',
  email: '',
  address: '',
  addressHi: '',
  currency: 'INR',
  instagram: '',
  facebook: '',
  footerNote: '',
  footerNoteHi: '',
  /** Shown on the locked card so visitors know who to ask for a code. */
  unlockHelpText: '',
  unlockHelpTextHi: '',
  /**
   * Wording on the home page's "browse by type" tiles and the portfolio page. Empty means
   * the site's built-in wording, in whichever language the visitor is reading.
   */
  browseTitle: '',
  browseTitleHi: '',
  blurbLand: '',
  blurbLandHi: '',
  blurbResidential: '',
  blurbResidentialHi: '',
  blurbCommercial: '',
  blurbCommercialHi: '',
  portfolioTitle: '',
  portfolioTitleHi: '',
  portfolioIntro: '',
  portfolioIntroHi: '',
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

const LONG_FIELDS = new Set<SettingKey>([
  'portfolioIntro',
  'portfolioIntroHi',
  'heroText',
  'heroTextHi',
  'aboutText',
  'aboutTextHi',
  'contactText',
  'contactTextHi',
  'unlockHelpText',
  'unlockHelpTextHi',
]);

export function readSettings(): Settings {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Settings;
  for (const key of SETTING_KEYS) out[key] = stored.get(key) ?? SETTING_DEFAULTS[key];
  return out;
}

export function writeSettings(values: Partial<Record<SettingKey, unknown>>) {
  const db = getDb();
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  db.transaction(() => {
    for (const key of SETTING_KEYS) {
      if (!(key in values)) continue;
      upsert.run(key, text(values[key], LONG_FIELDS.has(key) ? 4000 : 300));
    }
  })();
}
