import type { Metadata } from 'next';
import { Hind, IBM_Plex_Mono, Schibsted_Grotesk } from 'next/font/google';
import { getListings, getSite, SITE_URL } from '@/lib/api';
import { DICTIONARIES, LOCALES } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { localizeSettings } from '@/lib/localize';
import '../globals.css';

const sans = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });
// Devanagari for the Hindi pages; browsers only download it when Hindi text is on the page.
const deva = Hind({ subsets: ['devanagari'], weight: ['400', '500', '600', '700'], variable: '--font-deva', display: 'swap' });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = DICTIONARIES[locale];
  const [site, listings] = await Promise.all([getSite(), getListings()]);
  const settings = localizeSettings(site.settings, locale);
  const title = settings.tagline ? `${settings.siteName} · ${settings.tagline}` : settings.siteName;
  const description = settings.heroText || title;
  const image =
    site.hero?.og ?? listings.find((p) => p.featured && p.cover)?.cover?.og ?? listings.find((p) => p.cover)?.cover?.og;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${settings.siteName}` },
    description,
    openGraph: {
      type: 'website',
      locale: t.ogLocale,
      siteName: settings.siteName,
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable} ${deva.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          {DICTIONARIES[locale].skip}
        </a>
        {children}
      </body>
    </html>
  );
}
