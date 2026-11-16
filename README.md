# IPA Web

The IPA real estate & land site: a photo-first portfolio where the photos and the exact
location open only with an access code your team hands out. The public site, the admin panel,
the database and the uploaded media are all one Node app, so it runs on one server behind one
domain.

## What's on the site

- **Home**: large photo, your headline, featured listings, browse by type, About, contact band.
- **Portfolio** (`/properties`): every published listing, filterable by type, status and region.
- **Property pages** (`/properties/<name>`): cover photo, price, area, the facts table and the
  description are open to everyone. The gallery, video, map, address and nearby places are
  locked until a visitor enters that property's access code.
- **Private links** (`/p/<code>`): listings marked "Private link only" or "Draft" are reachable
  only through their own link, which opens them in full — no code needed.
- **Link previews**: each property has its own title, description and 1200×630 photo, so links
  look right in WhatsApp, iMessage and elsewhere. Only the cover is ever used.
- **QR codes** for every property (`/properties/<name>/qr`), for signboards and flyers.
- **English and Hindi**: English at the usual addresses, Hindi under `/hi`, with a switch in the
  header. Listing text uses the Hindi boxes in the admin and falls back to English when empty.
  Prices in rupees show as lakh and crore.
- `sitemap.xml` and `robots.txt`; the admin panel is never indexed.

## How the access codes work

- Every gated property has **one code waiting** in the admin panel. Give it to a visitor.
- A code dies when its uses run out (**one use by default**, and you can set more per code).
  The moment it does, a fresh code appears in the panel, so you never hand out the same one twice.
- Entering a code opens that property for **ten minutes**. The clock restarts while the visitor
  is on the site, so reading for an hour is fine. Closing the tab and coming back within ten
  minutes still works; leaving for longer does not.
- A visitor without a code can leave their phone number instead. It lands under **Code requests**
  with a WhatsApp link that pre-fills the message and the code to send.
- The gate is enforced on the server, not in the page: a locked property's HTML carries no
  coordinates, no address and no photo URLs beyond the cover, and every media file is served
  through a route that checks the unlock before it sends a byte.

Turn the gate off for a single listing with the switch on its admin page, and the property shows
everything to everyone.

## The admin panel

`https://yourdomain.com/admin`, with the password from `ADMIN_PASSWORD`.

| Page | What you do there |
| --- | --- |
| Overview | What is live, who is waiting for a code, and every property's current code |
| Properties | Add and edit listings; photos, video, site plan, brochure; access codes |
| Regions | The list of places listings are filed under, and the only part of a location shown before unlocking |
| Code requests | People who asked for a code, with a WhatsApp link to send them one |
| Enquiries | Messages from the enquiry form |
| Settings | The WhatsApp number every property uses, phone, email, currency, and all the site text |

Setting a property's location: paste a Google Maps share link (short `maps.app.goo.gl` links are
followed for you), plain coordinates (`25.5429, 73.9177`) or survey degrees (`28°36'46"N 77°13'46"E`).

Photos are resized to WebP in three sizes plus a 1200×630 preview, and their EXIF — including the
GPS tag a phone writes into every photo — is dropped on the way in.

## Put it on your server

You need a server with Docker, and your domain's A record pointing at it.

```bash
git clone https://github.com/CHEDFOX/IPA-Web.git /opt/ipa-web
cd /opt/ipa-web
cp .env.example .env
nano .env          # DOMAIN, SITE_URL, ADMIN_PASSWORD
docker compose up -d --build
```

Caddy gets the HTTPS certificate by itself once the DNS record resolves. Then open
`https://yourdomain.com/admin` and start adding regions and properties.

Day to day:

```bash
docker compose logs -f web
```

```bash
git pull && docker compose up -d --build
```

```bash
docker compose exec web npm run backup
```

Everything that matters — the database and every uploaded photo — is in the `ipa-data` volume.
Copy it somewhere safe on a schedule; `npm run backup` makes a consistent copy of the database
while the site keeps serving.

**Without Docker**: `deploy/ipa-web.service` (systemd) and `deploy/nginx.conf` (nginx + certbot).
Node 22 and `ffmpeg` need to be installed; `npm ci && npm run build && npm run start`.

**Sizing**: SQLite and the photos sit on the server's disk, so give it room for the media —
a few hundred photos is a few GB. Any small VPS handles the traffic.

## Run it on your laptop

```bash
npm install
cp .env.example .env.local     # ADMIN_PASSWORD at least
npm run dev                    # http://localhost:3000
npm run seed                   # optional: sample listings, prints their access codes
```

Checks: `npm run lint`, `npm run typecheck`. `npm run build && npm run start` runs a production
build locally.

`IPA_DEMO=1 npm run dev` ignores the database and runs the built-in sample listings in
`lib/demo.ts` instead — handy for showing the site without touching real data. The photos it uses
are public domain; see `public/demo/CREDITS.txt`.

## Settings (`.env`)

| Variable | What it does |
| --- | --- |
| `ADMIN_PASSWORD` | Admin panel password, 10 characters or more. Required. |
| `SITE_URL` | The site's public address, for link previews, QR codes and the sitemap. |
| `DOMAIN` | Your domain, used by Caddy to get the certificate. |
| `IPA_DATA_DIR` | Where the database and photos live. Docker sets this itself. |
| `IPA_UNLOCK_MINUTES` | How long an unlock lasts after a visitor leaves. Default 10. |
| `IPA_DEMO` | `1` runs the built-in sample listings instead of the database. |

Built with Next.js 16 (App Router, Cache Components), SQLite and sharp. Public pages are cached
and refresh the moment you save a change in the admin panel.
