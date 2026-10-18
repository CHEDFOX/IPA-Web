import type { Metadata } from 'next';
import { IBM_Plex_Mono, Schibsted_Grotesk } from 'next/font/google';
import { getListings, getSite, SITE_URL } from '@/lib/api';
import './globals.css';

const sans = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const [{ settings, hero }, listings] = await Promise.all([getSite(), getListings()]);
  const title = settings.tagline ? `${settings.siteName} · ${settings.tagline}` : settings.siteName;
  const description = settings.heroText || `${settings.siteName}: a portfolio of land and property.`;
  const image = hero?.og ?? listings.find((p) => p.featured && p.cover)?.cover?.og ?? listings.find((p) => p.cover)?.cover?.og;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${settings.siteName}` },
    description,
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
