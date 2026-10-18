# IPA Web

The public website for the IPA real estate & land portfolio: a photo-first showcase that is quick
to share with clients. It is hosted on **Vercel**. Listings, photos, videos and contact details all
come from [IPA-Backend](https://github.com/CHEDFOX/IPA-Backend), which runs on your VPS. You manage
everything from the backend's admin panel; this site has nothing to edit.

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
- **Locations**: Google Maps with map and satellite views, plus buttons for Google Maps, Google
  Earth and directions to the exact coordinates, which visitors can also copy.
- **English and Hindi**: English at the usual addresses, Hindi under `/hi` (e.g.
  `/hi/properties/<name>`), with a हिन्दी / English switch in the header. Buttons and labels are
  translated in `lib/i18n.ts`; listing text uses the Hindi boxes in the admin panel and falls back
  to English when they are empty. Prices in rupees show as lakh / crore.
- `sitemap.xml` (both languages) and `robots.txt` for search engines.

Built with Next.js 16 (App Router, Cache Components). Pages are cached and refresh within seconds
when the backend reports a change, or every minute otherwise.

## Deploy on Vercel

Set up the backend on your VPS first (see the backend's [DEPLOY.md](https://github.com/CHEDFOX/IPA-Backend/blob/HEAD/DEPLOY.md)), so the first build has
your listings.

1. **Import the project**: vercel.com → Add New → Project → import `CHEDFOX/IPA-Web`.
   Vercel detects Next.js; leave the build settings as they are.
2. **Environment variables** (same screen, or later under Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` (your backend) |
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (or leave it out until your domain is connected; the `*.vercel.app` address is used meanwhile) |
   | `REVALIDATE_SECRET` | the same long random string as in the backend's `.env` |

3. **Deploy**. The build stops with a clear message if `NEXT_PUBLIC_API_URL` is missing.
4. **Domain**: Settings → Domains → add `yourdomain.com` (and `www.yourdomain.com`), then create the
   DNS records Vercel shows you. Keep the `api` record pointing at your VPS.
5. **Function region**: Settings → Functions → choose the region closest to your VPS, so the site
   talks to the backend quickly.
6. **Redeploy** after changing environment variables (Deployments → ⋯ → Redeploy).

> **Plan:** Vercel's free Hobby plan is for personal, non-commercial use only. A site promoting a
> business counts as commercial, so use the **Pro** plan for the live site.

Every push to the production branch (the default branch; see Settings → Git) deploys automatically;
other branches get preview addresses.

## Run it locally

Start the backend first (see its README), then:

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000, NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev                    # http://localhost:3000
```

Checks: `npm run lint` and `npm run typecheck`. `npm run build && npm start` runs a production
build locally.

If the backend is unreachable during a build, the build still succeeds: pages start empty and
fill in within a minute once the backend answers.
