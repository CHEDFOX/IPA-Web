import { getDb } from '@/lib/server/db';
import { markEnquiryRead, removeEnquiry } from '../actions';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

interface EnquiryRow {
  id: number;
  property_title: string;
  name: string;
  contact: string;
  message: string;
  page_url: string;
  is_read: number;
  created_at: string;
}

export default async function EnquiriesPage() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const rows = getDb().prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 200').all() as EnquiryRow[];

  return (
    <>
      <h1>Enquiries</h1>
      <p className="admin-muted">Messages sent from the enquiry form on a property page or the contact band.</p>

      <div className="admin-cards">
        {rows.map((row) => (
          <article key={row.id} className={row.is_read ? 'admin-card' : 'admin-card unread'}>
            <header>
              <strong>{row.name}</strong>
              <span className="admin-muted">{new Date(row.created_at).toLocaleString('en-IN')}</span>
            </header>
            <p>
              <a href={row.contact.includes('@') ? `mailto:${row.contact}` : `tel:${row.contact}`}>{row.contact}</a>
              {row.property_title && <span className="admin-muted"> · {row.property_title}</span>}
            </p>
            {row.message && <p className="admin-message">{row.message}</p>}
            <footer>
              {!row.is_read && (
                <form action={markEnquiryRead}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="admin-btn small" type="submit">
                    Mark read
                  </button>
                </form>
              )}
              <form action={removeEnquiry}>
                <input type="hidden" name="id" value={row.id} />
                <button className="admin-btn danger small" type="submit">
                  Delete
                </button>
              </form>
            </footer>
          </article>
        ))}
        {!rows.length && <p className="admin-muted">No enquiries yet.</p>}
      </div>
    </>
  );
}
