import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { countNewAccessRequests } from '@/lib/server/access';
import { adminPasswordConfigured, isSignedIn } from '@/lib/server/auth';
import { signOut } from './actions';
import { SignInForm } from './SignInForm';
import './admin.css';

// A password-protected panel is always rendered per request, so there is no instant shell
// to validate and nothing here should be prefetched.
export const instant = false;

export const metadata: Metadata = {
  title: 'IPA admin',
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/regions', label: 'Regions' },
  { href: '/admin/requests', label: 'Code requests' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/settings', label: 'Settings' },
];

// The public site lives under app/[lang]; the panel is its own root, so it carries its own
// <html> and loads none of the site's fonts or styles.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="admin">
        <Suspense fallback={<main className="admin-main" />}>
          <Gate>{children}</Gate>
        </Suspense>
      </body>
    </html>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  // The panel is always rendered per request: it reads cookies and live database rows.
  await connection();
  if (!adminPasswordConfigured()) {
    return (
      <main className="admin-main">
        <div className="admin-signin">
          <h1>Admin panel</h1>
          <p className="admin-error">
            Set <code>ADMIN_PASSWORD</code> (10 characters or more) in the server&rsquo;s environment, then restart the app.
          </p>
        </div>
      </main>
    );
  }

  if (!(await isSignedIn())) {
    return (
      <main className="admin-main">
        <SignInForm />
      </main>
    );
  }

  const waiting = countNewAccessRequests();
  return (
    <>
      <header className="admin-bar">
        <span className="admin-brand">IPA admin</span>
        <nav className="admin-nav">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
              {link.href === '/admin/requests' && waiting > 0 && <span className="admin-pill">{waiting}</span>}
            </Link>
          ))}
        </nav>
        <div className="admin-bar-right">
          <a href="/" target="_blank" rel="noopener">
            View site ↗
          </a>
          <form action={signOut}>
            <button className="admin-link-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="admin-main">
        <Suspense fallback={<p className="admin-muted">Loading…</p>}>{children}</Suspense>
      </main>
    </>
  );
}
