import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { getSite } from '@/lib/api';

export default async function NotFound() {
  const { settings } = await getSite();
  return (
    <Shell settings={settings}>
      <section className="wrap page-intro">
        <span className="label">Not found</span>
        <h1>This page is not available</h1>
        <p>The property may have been sold, renamed or taken offline.</p>
        <div className="hero-actions">
          <Link className="btn btn-accent" href="/properties">
            See all properties
          </Link>
          <Link className="btn btn-outline" href="/#contact">
            Contact us
          </Link>
        </div>
      </section>
      <div className="section" />
    </Shell>
  );
}
