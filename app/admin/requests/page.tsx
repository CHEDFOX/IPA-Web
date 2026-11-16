import { listAccessRequests, nextCode } from '@/lib/server/access';
import { getProperty } from '@/lib/server/repo';
import { readSettings } from '@/lib/server/settings';
import { updateRequest } from '../actions';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

const waLink = (phone: string, message: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '';
};

export default async function RequestsPage() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const requests = listAccessRequests();
  const settings = readSettings();
  // Codes already promised to someone, so two callers never get the same one.
  const promised = requests.filter((r) => r.sent_code).map((r) => r.sent_code);

  return (
    <>
      <h1>Code requests</h1>
      <p className="admin-muted">
        People who asked for an access code without having one. Call or message them the code shown beside their
        request, then mark it sent.
      </p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>Property</th>
            <th>Code to give</th>
            <th>State</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const property = request.property_id ? getProperty(request.property_id) : null;
            // A request that has already been answered keeps showing the code it was sent.
            const code = request.sent_code
              ? { code: request.sent_code }
              : property?.gated
                ? nextCode(property.id, promised)
                : null;
            if (code && !request.sent_code) promised.push(code.code);
            const message = property
              ? `Hello${request.name ? ` ${request.name}` : ''}, here is your access code for ${property.title}: ${code?.code ?? ''}`
              : '';
            return (
              <tr key={request.id}>
                <td className="admin-muted">{new Date(request.created_at).toLocaleString('en-IN')}</td>
                <td>
                  <strong>{request.name || 'No name'}</strong>
                  <div>
                    <a href={`tel:${request.phone}`}>{request.phone}</a>
                  </div>
                  {settings.whatsapp && message && (
                    <a className="admin-link" href={waLink(request.phone, message)} target="_blank" rel="noopener">
                      WhatsApp the code ↗
                    </a>
                  )}
                </td>
                <td>{request.property_title || <span className="admin-muted">—</span>}</td>
                <td>{code ? <code className="admin-code">{code.code}</code> : <span className="admin-muted">—</span>}</td>
                <td>
                  <span className={`admin-state ${request.state}`}>{request.state}</span>
                  {request.sent_code && <div className="admin-muted">sent {request.sent_code}</div>}
                </td>
                <td className="admin-right">
                  {request.state === 'new' && (
                    <form action={updateRequest} className="admin-inline-form">
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="state" value="sent" />
                      <input type="hidden" name="sentCode" value={code?.code ?? ''} />
                      <button className="admin-btn small" type="submit">
                        Mark sent
                      </button>
                    </form>
                  )}
                  {request.state !== 'closed' && (
                    <form action={updateRequest} className="admin-inline-form">
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="state" value="closed" />
                      <button className="admin-btn small" type="submit">
                        Close
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
          {!requests.length && (
            <tr>
              <td colSpan={6} className="admin-muted">
                No requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
