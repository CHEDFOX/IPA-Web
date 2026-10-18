// After `next build`: copy what the self-contained server in .next/standalone needs to run
// on its own (static files and env files). Harmless on Vercel, which does not use it.
import fs from 'node:fs';

const out = '.next/standalone';
if (fs.existsSync(out)) {
  fs.cpSync('public', `${out}/public`, { recursive: true });
  fs.cpSync('.next/static', `${out}/.next/static`, { recursive: true });
  for (const file of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    if (fs.existsSync(file)) fs.copyFileSync(file, `${out}/${file}`);
  }
}
