/**
 * Fills an empty database with the sample listings, so a fresh install has something to
 * click through. Photos come from public/demo (CC0 — see public/demo/CREDITS.txt) and are
 * pushed through the normal upload pipeline, so they land in data/media like any upload.
 *
 *   npm run seed
 *
 * Safe to re-run: it does nothing once the database has listings.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDb } from '../lib/server/db';
import { storeUpload, type MediaRole } from '../lib/server/media';
import { activeCodes } from '../lib/server/access';
import { createProperty, createRegion, listAllProperties, setCover } from '../lib/server/repo';
import { writeSettings } from '../lib/server/settings';

const DEMO_DIR = path.join(process.cwd(), 'public', 'demo');

async function upload(propertyId: number | null, role: MediaRole, file: string, alt: string) {
  const bytes = await fs.readFile(file);
  const name = path.basename(file);
  const type = name.endsWith('.mp4') ? 'video/mp4' : 'image/webp';
  // Buffer -> File, the same shape the admin upload form hands over.
  const blob = new File([new Uint8Array(bytes)], name, { type });
  return storeUpload({ propertyId, role, file: blob, alt });
}

async function main() {
  const db = getDb();
  if (listAllProperties().length) {
    console.log('Database already has listings; nothing to seed.');
    return;
  }

  writeSettings({
    siteName: 'IPA',
    tagline: 'Land & property, Telangana',
    heroTitle: 'Land you can walk before you buy.',
    heroText:
      'Farmland, plots, homes and commercial space — photographed, measured and mapped. Ask us for an access code to see the photos and the exact location.',
    aboutTitle: 'About IPA',
    aboutText: 'Sample content created by npm run seed. Replace it in the admin panel at /admin.',
    contactTitle: 'Looking for something specific?',
    contactText: 'Tell us the area, the size and the budget, and we will send what is available this week.',
    phone: '+91 90000 00000',
    whatsapp: '+91 90000 00000',
    email: 'hello@example.com',
    address: 'MG Road, Warangal, Telangana',
    currency: 'INR',
    unlockHelpText: 'Ask our team on WhatsApp for a code; it opens the photos and the exact location for ten minutes.',
  });

  const palampet = createRegion({ name: 'Palampet', nameHi: 'पालमपेट', sortOrder: 1 });
  const hyderabad = createRegion({ name: 'Hyderabad', nameHi: 'हैदराबाद', sortOrder: 2 });
  const deogarh = createRegion({ name: 'Deogarh', nameHi: 'देवगढ़', sortOrder: 3 });

  const land = createProperty({
    title: 'Green Acres — 2.4 ha beside the canal',
    titleHi: 'ग्रीन एकर्स — नहर किनारे 2.4 हेक्टेयर',
    regionId: palampet.id,
    type: 'land',
    status: 'available',
    visibility: 'public',
    featured: true,
    price: 14_500_000,
    priceNote: 'Negotiable, part payment accepted',
    area: 2.4,
    areaUnit: 'ha',
    summary: 'Level farmland in two plots with canal water on the north boundary and a 9 m approach road at the front.',
    address: 'Survey no. 142/2, Palampet, Mulugu district, Telangana',
    latitude: 18.2606,
    longitude: 79.9324,
    description:
      'Two adjoining plots of level, red-soil farmland, fenced on three sides and in cultivation today.\n\nThe canal runs along the whole northern boundary, so irrigation is year round.',
    details: [
      { label: 'Survey number', value: '142/2', key: true },
      { label: 'Soil', value: 'Red loam, level', key: true },
      { label: 'Water', value: 'Canal + borewell (5 HP)', key: true },
    ],
    nearby: [
      { place: 'Ramappa temple road', distance: '600 m' },
      { place: 'Palampet village', distance: '2.1 km' },
    ],
    gated: true,
  });

  const villa = createProperty({
    title: '4-bedroom villa with pool, Gachibowli',
    regionId: hyderabad.id,
    type: 'residential',
    status: 'available',
    visibility: 'public',
    featured: true,
    price: 42_000_000,
    area: 420,
    areaUnit: 'm2',
    bedrooms: 4,
    bathrooms: 4,
    summary: 'Corner villa in a gated lane, with a double-height living room, a fitted kitchen and a pool behind the house.',
    address: 'Lane 4, Golden Habitat, Gachibowli, Hyderabad',
    latitude: 17.4401,
    longitude: 78.3489,
    description: 'A corner plot of 320 sq yd with 420 m² built over two floors, finished in 2023.',
    details: [{ label: 'Plot size', value: '320 sq yd', key: true }],
    nearby: [{ place: 'DLF Cyber City', distance: '3.4 km' }],
    gated: true,
  });

  const plot = createProperty({
    title: 'Lakeside farmland, Deogarh',
    regionId: deogarh.id,
    type: 'land',
    status: 'available',
    visibility: 'public',
    price: 11_800_000,
    area: 3.1,
    areaUnit: 'ha',
    summary: 'Open farmland on the Sangrampura road, 300 m from the lake and two kilometres north of Deogarh town.',
    address: 'Sangrampura, Deogarh tehsil, Rajsamand district, Rajasthan 313331',
    latitude: 25.5429104,
    longitude: 73.917688,
    description: 'Three and a bit hectares of level cultivated land between the town and the lake.',
    nearby: [{ place: 'Lake', distance: '300 m' }],
    gated: true,
  });

  const photos: [number, string[], string][] = [
    [land.id, ['green-acres-palampet/1-1920.webp', 'green-acres-palampet/3-1920.webp', 'green-acres-palampet/4-1920.webp'], 'Green Acres'],
    [villa.id, ['villa-gachibowli/1-1024.webp', 'villa-gachibowli/2-960.webp', 'villa-gachibowli/4-1024.webp'], 'Villa'],
    [plot.id, ['lakeside-deogarh/1-1920.webp', 'lakeside-deogarh/2-1920.webp'], 'Lakeside farmland'],
  ];

  for (const [propertyId, files, alt] of photos) {
    let first = true;
    for (const file of files) {
      const full = path.join(DEMO_DIR, file);
      try {
        const stored = await upload(propertyId, first ? 'cover' : 'gallery', full, alt);
        if (first) setCover(propertyId, stored.id);
        first = false;
      } catch (err) {
        console.warn(`skipped ${file}:`, (err as Error).message);
      }
    }
  }

  // A short video on the first listing, if the demo one is around.
  try {
    await upload(land.id, 'gallery', path.join(DEMO_DIR, 'green-acres-palampet/tour.mp4'), 'Short walk-through of the land');
  } catch {
    // ffmpeg missing or no demo video: not a problem.
  }

  // The site picture behind the home page headline.
  try {
    await upload(null, 'hero', path.join(DEMO_DIR, 'hero/hero-1920.webp'), '');
  } catch {
    /* optional */
  }

  for (const property of listAllProperties()) {
    const pool = activeCodes(property.id);
    console.log(`  ${property.slug.padEnd(42)} ${pool.length} codes, first: ${pool[0]?.code ?? '—'}`);
  }
  console.log(`\nSeeded ${listAllProperties().length} listings. Database: ${db.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
