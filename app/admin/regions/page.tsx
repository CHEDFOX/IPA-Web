import { countPropertiesInRegion, listRegions } from '@/lib/server/repo';
import { removeRegion } from '../actions';
import { RegionForm } from './RegionForm';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

export default async function RegionsPage() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const regions = listRegions();
  return (
    <>
      <h1>Regions</h1>
      <p className="admin-muted">
        Regions are the places visitors filter by, and the only part of a location shown before a property is unlocked.
      </p>

      <section className="admin-section">
        <h2>Add a region</h2>
        <RegionForm />
      </section>

      <section className="admin-section">
        <h2>{regions.length} region{regions.length === 1 ? '' : 's'}</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Hindi</th>
              <th>Note</th>
              <th>Order</th>
              <th>Listings</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => {
              const used = countPropertiesInRegion(region.id);
              return (
                <tr key={region.id}>
                  <td colSpan={6} className="admin-row-form">
                    <RegionForm region={region} used={used} />
                    {used === 0 && (
                      <form action={removeRegion}>
                        <input type="hidden" name="id" value={region.id} />
                        <button className="admin-btn danger small" type="submit">
                          Delete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {!regions.length && (
              <tr>
                <td className="admin-muted">No regions yet. Add the first one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
