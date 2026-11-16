import Link from 'next/link';
import { activeCode } from '@/lib/server/access';
import { coversFor, listAllProperties } from '@/lib/server/repo';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

const STATUS_LABEL: Record<string, string> = { available: 'Available', under_offer: 'Under offer', sold: 'Sold' };

export default async function PropertiesPage() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const properties = listAllProperties();
  const covers = coversFor(properties.map((p) => p.id));

  return (
    <>
      <div className="admin-section-head">
        <h1>Properties</h1>
        <Link className="admin-btn primary" href="/admin/properties/new">
          Add a property
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th />
            <th>Title</th>
            <th>Region</th>
            <th>Type</th>
            <th>Status</th>
            <th>Shown</th>
            <th>Photos</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => {
            const media = covers.get(property.id) ?? [];
            const cover = media.find((m) => m.role === 'cover') ?? media[0];
            const code = property.gated ? activeCode(property.id) : null;
            return (
              <tr key={property.id}>
                <td className="admin-thumb-cell">
                  {cover ? (
                     
                    <img className="admin-thumb" src={`/media/${cover.key}/sm`} alt="" width={64} height={43} />
                  ) : (
                    <span className="admin-thumb empty" />
                  )}
                </td>
                <td>
                  <Link href={`/admin/properties/${property.id}`}>{property.title}</Link>
                  <div className="admin-muted">/{property.slug}</div>
                </td>
                <td>{property.region_name ?? <span className="admin-muted">—</span>}</td>
                <td className="admin-muted">{property.type}</td>
                <td>{STATUS_LABEL[property.status] ?? property.status}</td>
                <td>
                  <span className={`admin-state ${property.visibility}`}>{property.visibility}</span>
                </td>
                <td className="admin-muted">{media.length}</td>
                <td>
                  {code ? <code className="admin-code">{code.code}</code> : <span className="admin-muted">open</span>}
                </td>
              </tr>
            );
          })}
          {!properties.length && (
            <tr>
              <td colSpan={8} className="admin-muted">
                Nothing here yet. Add your first property.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
