import Link from 'next/link';
import { notFound } from 'next/navigation';
import { activeCode, activeUnlockCount, listCodes } from '@/lib/server/access';
import { getProperty, listRegions, mediaOf } from '@/lib/server/repo';
import { closeUnlocks, makeCover, moveMedia, newCode, removeMedia, removeProperty, saveMediaAlt } from '../../actions';
import { PropertyForm, type PropertyFormValues } from '../PropertyForm';
import { UploadForm } from './UploadForm';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

export default async function EditPropertyPage({ params }: PageProps<'/admin/properties/[id]'>) {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const { id } = await params;
  const property = getProperty(Number(id));
  if (!property) notFound();

  const regions = listRegions();
  const media = mediaOf(property.id);
  const gallery = media.filter((m) => m.role === 'cover' || m.role === 'gallery');
  const plan = media.find((m) => m.role === 'plan');
  const brochure = media.find((m) => m.role === 'brochure');
  // Reading the page is what mints a listing's first code.
  const active = property.gated ? activeCode(property.id) : null;
  const codes = listCodes(property.id);
  const open = activeUnlockCount(property.id);

  return (
    <>
      <div className="admin-section-head">
        <h1>{property.title}</h1>
        <div className="admin-head-links">
          <a href={`/properties/${property.slug}`} target="_blank" rel="noopener">
            View ↗
          </a>
          <a href={`/p/${property.share_token}`} target="_blank" rel="noopener">
            Private link ↗
          </a>
          <Link className="admin-link" href="/admin/properties">
            ← All properties
          </Link>
        </div>
      </div>

      <PropertyForm property={property as unknown as PropertyFormValues} regions={regions} />

      <section className="admin-section" id="codes">
        <h2>Access codes</h2>
        {property.gated ? (
          <>
            <div className="admin-code-row">
              <div>
                <span className="admin-muted">Give this code to a visitor</span>
                <div className="admin-code big">{active?.code ?? '—'}</div>
                <span className="admin-muted">
                  {active ? `${active.used_count} of ${active.max_uses} use${active.max_uses === 1 ? '' : 's'} spent` : ''}
                  {open > 0 && ` · ${open} visitor${open === 1 ? '' : 's'} inside right now`}
                </span>
              </div>
              <form action={newCode} className="admin-inline-form">
                <input type="hidden" name="propertyId" value={property.id} />
                <label className="narrow">
                  <span>Uses per code</span>
                  <input name="maxUses" type="number" min={1} max={50} defaultValue={active?.max_uses ?? 1} />
                </label>
                <button className="admin-btn" type="submit">
                  Replace code
                </button>
              </form>
            </div>
            <p className="admin-muted">
              A code stops working the moment its uses run out, and the next one appears here straight away. Visitors
              already inside keep access for ten minutes after they leave the site.
            </p>
            {open > 0 && (
              <form action={closeUnlocks}>
                <input type="hidden" name="propertyId" value={property.id} />
                <button className="admin-btn danger small" type="submit">
                  Close {open} open session{open === 1 ? '' : 's'} now
                </button>
              </form>
            )}
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>State</th>
                  <th>Uses</th>
                  <th>First used</th>
                  <th>Last used</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id}>
                    <td>
                      <code className="admin-code">{code.code}</code>
                    </td>
                    <td>
                      <span className={`admin-state ${code.state}`}>{code.state}</span>
                    </td>
                    <td className="admin-muted">
                      {code.used_count} / {code.max_uses}
                    </td>
                    <td className="admin-muted">{code.first_used_at ? new Date(code.first_used_at).toLocaleString('en-IN') : '—'}</td>
                    <td className="admin-muted">{code.last_used_at ? new Date(code.last_used_at).toLocaleString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="admin-muted">
            This property is open to everyone: its photos and location need no code. Turn the gate back on in the form
            above.
          </p>
        )}
      </section>

      <section className="admin-section">
        <h2>Photos and video</h2>
        <p className="admin-muted">
          The cover is the one photo visitors see before unlocking. Everything else stays locked.
        </p>
        <UploadForm propertyId={property.id} role="gallery" label="Add photos or video" multiple />
        <div className="admin-media-grid">
          {gallery.map((item) => (
            <figure key={item.id} className={item.role === 'cover' ? 'admin-media is-cover' : 'admin-media'}>
              {item.kind === 'video' ? (
                 
                <video src={`/media/${item.key}/file`} controls preload="metadata" />
              ) : (
                 
                <img src={`/media/${item.key}/sm`} alt={item.alt} loading="lazy" />
              )}
              <figcaption>
                {item.role === 'cover' && <span className="admin-badge">Cover — public</span>}
                {item.role !== 'cover' && <span className="admin-badge locked">Locked</span>}
                <form action={saveMediaAlt} className="admin-inline-form">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="alt" defaultValue={item.alt} placeholder="Describe the photo" maxLength={200} />
                  <button className="admin-btn small" type="submit">
                    Save
                  </button>
                </form>
                <div className="admin-media-actions">
                  {item.role !== 'cover' && item.kind === 'image' && (
                    <form action={makeCover}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="propertyId" value={property.id} />
                      <button className="admin-btn small" type="submit">
                        Make cover
                      </button>
                    </form>
                  )}
                  <form action={moveMedia}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button className="admin-btn small" type="submit" aria-label="Move earlier">
                      ↑
                    </button>
                  </form>
                  <form action={moveMedia}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button className="admin-btn small" type="submit" aria-label="Move later">
                      ↓
                    </button>
                  </form>
                  <form action={removeMedia}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="admin-btn danger small" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </figcaption>
            </figure>
          ))}
          {!gallery.length && <p className="admin-muted">No photos yet.</p>}
        </div>
      </section>

      <section className="admin-section">
        <h2>Site plan and brochure</h2>
        <div className="admin-two">
          <div>
            <UploadForm propertyId={property.id} role="plan" label="Site plan (image)" />
            {plan && (
              <figure className="admin-media">
                { }
                <img src={`/media/${plan.key}/sm`} alt="" />
                <figcaption>
                  <form action={removeMedia}>
                    <input type="hidden" name="id" value={plan.id} />
                    <button className="admin-btn danger small" type="submit">
                      Delete plan
                    </button>
                  </form>
                </figcaption>
              </figure>
            )}
          </div>
          <div>
            <UploadForm propertyId={property.id} role="brochure" label="Brochure (PDF)" accept="application/pdf" />
            {brochure && (
              <p>
                <a href={`/media/${brochure.key}/file`} target="_blank" rel="noopener">
                  {brochure.original_name || 'Brochure.pdf'}
                </a>
                <form action={removeMedia}>
                  <input type="hidden" name="id" value={brochure.id} />
                  <button className="admin-btn danger small" type="submit">
                    Delete
                  </button>
                </form>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="admin-section danger-zone">
        <h2>Delete</h2>
        <form action={removeProperty}>
          <input type="hidden" name="id" value={property.id} />
          <button className="admin-btn danger" type="submit">
            Delete this property and its photos
          </button>
        </form>
      </section>
    </>
  );
}
