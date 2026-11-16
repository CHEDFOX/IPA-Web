/**
 * Writes a consistent copy of the database beside the media folder, so the whole data
 * directory can be copied away while the site keeps running.
 *
 *   npm run backup                     # -> data/backups/ipa-2026-11-16T09-00-00.db
 *   npm run backup /mnt/backup         # somewhere else
 *
 * The photos themselves are the files in data/media — copy that folder too (rsync is fine;
 * uploaded files are never modified after they are written).
 */
import fs from 'node:fs';
import path from 'node:path';
import { dataDir, getDb } from '../lib/server/db';

async function main() {
  const target = process.argv[2] || path.join(dataDir(), 'backups');
  fs.mkdirSync(target, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(target, `ipa-${stamp}.db`);

  // SQLite's own backup: safe to run while the site is serving requests.
  await getDb().backup(file);

  const media = path.join(dataDir(), 'media');
  const count = fs.existsSync(media) ? fs.readdirSync(media).length : 0;
  console.log(`Database copied to ${file}`);
  console.log(`Remember the photos too: ${media} (${count} item${count === 1 ? '' : 's'})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
