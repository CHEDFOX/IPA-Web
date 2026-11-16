import Link from 'next/link';
import { CODE_POOL, activeCodes, countNewAccessRequests, listAccessRequests } from '@/lib/server/access';
import { getDb } from '@/lib/server/db';
import { listAllProperties, listRegions } from '@/lib/server/repo';
import { readSettings } from '@/lib/server/settings';
import { refreshSite } from './actions';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

export default async function AdminHome() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const properties = listAllProperties();
  const regions = listRegions();
  const settings = readSettings();
  const waiting = countNewAccessRequests();
  const unread = (getDb().prepare('SELECT COUNT(*) AS n FROM enquiries WHERE is_read = 0').get() as { n: number }).n;
  const live = properties.filter((p) => p.visibility === 'public');
  const gated = properties.filter((p) => p.gated);
  const recent = listAccessRequests().slice(0, 5);

  return (
    <>
      <h1>Overview</h1>

      <div className="admin-tiles">
        <Tile label="Live listings" value={live.length} hint={`${properties.length} in total`} href="/admin/properties" />
        <Tile label="Regions" value={regions.length} href="/admin/regions" />
        <Tile label="Code requests" value={waiting} hint="waiting for a call back" href="/admin/requests" highlight={waiting > 0} />
        <Tile label="Unread enquiries" value={unread} href="/admin/enquiries" highlight={unread > 0} />
      </div>

      <form action={refreshSite} className="admin-inline-form admin-refresh">
        <button className="admin-btn small" type="submit">
          Refresh the public pages
        </button>
        <span className="admin-muted">
          Saves in this panel do this already; use it after restoring a backup into the data folder.
        </span>
      </form>

      {!settings.whatsapp && (
        <p className="admin-note">
          No WhatsApp number is set yet, so the WhatsApp buttons are hidden across the site.{' '}
          <Link href="/admin/settings">Add one in Settings</Link>.
        </p>
      )}

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Access codes</h2>
          <Link className="admin-link" href="/admin/properties">
            All properties
          </Link>
        </div>
        <p className="admin-muted">
          Each gated property keeps {CODE_POOL} codes ready. Give one out; the moment it is used it stops working and
          another takes its place, so the pool never runs down.
        </p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Next code to give</th>
              <th>Ready</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {gated.map((property) => {
              const pool = activeCodes(property.id);
              return (
                <tr key={property.id}>
                  <td>
                    <Link href={`/admin/properties/${property.id}`}>{property.title}</Link>
                  </td>
                  <td>
                    <code className="admin-code">{pool[0]?.code ?? '—'}</code>
                  </td>
                  <td className="admin-muted">{pool.length}</td>
                  <td className="admin-right">
                    <Link className="admin-link" href={`/admin/properties/${property.id}#codes`}>
                      Codes
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!gated.length && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  No gated properties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {recent.length > 0 && (
        <section className="admin-section">
          <div className="admin-section-head">
            <h2>Latest code requests</h2>
            <Link className="admin-link" href="/admin/requests">
              All requests
            </Link>
          </div>
          <table className="admin-table">
            <tbody>
              {recent.map((request) => (
                <tr key={request.id}>
                  <td>{new Date(request.created_at).toLocaleString('en-IN')}</td>
                  <td>{request.name || '—'}</td>
                  <td>
                    <a href={`tel:${request.phone}`}>{request.phone}</a>
                  </td>
                  <td className="admin-muted">{request.property_title || '—'}</td>
                  <td>
                    <span className={`admin-state ${request.state}`}>{request.state}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

function Tile({
  label,
  value,
  hint,
  href,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link className={highlight ? 'admin-tile highlight' : 'admin-tile'} href={href}>
      <span className="admin-tile-value">{value}</span>
      <span className="admin-tile-label">{label}</span>
      {hint && <span className="admin-muted">{hint}</span>}
    </Link>
  );
}
