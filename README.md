# IPA Web

The public website for the IPA real estate & land portfolio: a photo-first showcase that is quick
to share with clients. Listings, photos, videos and contact details all come from
[IPA-Backend](https://github.com/CHEDFOX/IPA-Backend), which runs on your VPS. You manage
everything from its admin panel; this site has nothing to edit.

## What's on the site

- **Home**: large photo, your headline, featured listings, browse by type, About, contact band.
- **Portfolio** (`/properties`): every public listing, filterable by type, status and location.
- **Property pages** (`/properties/<name>`): photo and video gallery with a full-screen viewer,
  key facts, land details, description, map, site plan, nearby places, price, and WhatsApp / call /
  email buttons plus an enquiry form. On phones a WhatsApp + Call bar stays at the bottom.
- **Private links** (`/p/<code>`): listings marked "Private link" or "Draft" in the admin are only
  reachable through their private link, and are hidden from search engines.
- **Link previews**: each property has its own title, description and 1200×630 photo, so links
  look right when pasted into WhatsApp, iMessage, Facebook, LinkedIn and so on.
- **QR codes** for every property (`/properties/<name>/qr`), for signboards and flyers.
- `sitemap.xml` and `robots.txt` for search engines.

Built with Next.js 16 (App Router, Cache Components). Pages are cached and refreshed within
seconds when the backend reports a change, or every few minutes otherwise.

## Run it locally

Start the backend first (see its README), then:

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000, NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev                    # http://localhost:3000
```

Checks: `npm run lint` and `npm run typecheck`.

## Settings

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The backend's public address, e.g. `https://api.yourdomain.com`. |
| `API_INTERNAL_URL` | Optional faster address for server-side requests when both run on the same VPS, e.g. `http://127.0.0.1:4000`. |
| `NEXT_PUBLIC_SITE_URL` | This site's public address (link previews, QR codes, sitemap). |
| `REVALIDATE_SECRET` | Same value as the backend's `REVALIDATE_SECRET`, so edits show straight away. |

## Deploy

### Option A — Vercel (free, easiest)

1. Import the `IPA-Web` repository at vercel.com/new.
2. Add the four settings above under Environment Variables.
3. Deploy, then add your domain (e.g. `yourdomain.com`) in the project's Domains tab.
4. In the backend's `.env`, set `SITE_URL=https://yourdomain.com` and
   `WEB_REVALIDATE_URL=https://yourdomain.com/api/revalidate`.

### Option B — on the same VPS as the backend

```bash
git clone https://github.com/CHEDFOX/IPA-Web.git /opt/ipa-web
cd /opt/ipa-web
cp .env.example .env.production && nano .env.production
npm ci && npm run build
PORT=3000 npm start          # keep it running with systemd or pm2
```

`npm run build` creates a self-contained server in `.next/standalone` and copies the static
files and `.env.production` next to it; `npm start` runs it. Proxy `yourdomain.com` to
`127.0.0.1:3000` with nginx or Caddy, the same way as the backend, with response buffering
off so pages can stream (`proxy_buffering off;` in nginx).

If the backend is not reachable while you build, the build still succeeds: pages start empty
and fill in within a minute once the backend answers.
