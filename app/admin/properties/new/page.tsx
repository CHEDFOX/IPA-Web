import Link from 'next/link';
import { listRegions } from '@/lib/server/repo';
import { PropertyForm } from '../PropertyForm';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

export default async function NewPropertyPage() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const regions = listRegions();
  return (
    <>
      <div className="admin-section-head">
        <h1>Add a property</h1>
        <Link className="admin-link" href="/admin/properties">
          ← All properties
        </Link>
      </div>
      {!regions.length && (
        <p className="admin-note">
          There are no regions yet. <Link href="/admin/regions">Add one first</Link> so the property can be filtered by place.
        </p>
      )}
      <p className="admin-muted">Save the property first, then add photos, video and its access code.</p>
      <PropertyForm regions={regions} />
    </>
  );
}
