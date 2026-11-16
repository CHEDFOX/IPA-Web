import { CODE_POOL, UNLOCK_MINUTES } from '@/lib/server/access';
import { siteMedia } from '@/lib/server/repo';
import { readSettings } from '@/lib/server/settings';
import { removeSiteImage } from '../actions';
import { SettingsForm, SiteImageForm } from './SettingsForm';
import { connection } from 'next/server';
import { isSignedIn } from '@/lib/server/auth';

export const instant = false;

export default async function SettingsPage() {
  await connection();
  // A layout cannot protect a page: each one checks for itself before touching data.
  if (!(await isSignedIn())) return null;
  const values = readSettings() as unknown as Record<string, string>;
  const hero = siteMedia('hero');
  const portrait = siteMedia('portrait');

  return (
    <>
      <h1>Settings</h1>
      <SettingsForm values={values} />

      <section className="admin-section">
        <h2>Home page pictures</h2>
        <div className="admin-two">
          <div>
            <SiteImageForm role="hero" label="Big picture at the top" />
            {hero && (
              <>
                { }
                <img className="admin-preview" src={`/media/${hero.key}/sm`} alt="" />
                <form action={removeSiteImage}>
                  <input type="hidden" name="id" value={hero.id} />
                  <button className="admin-btn danger small" type="submit">
                    Remove picture
                  </button>
                </form>
              </>
            )}
          </div>
          <div>
            <SiteImageForm role="portrait" label="Portrait beside the About text" />
            {portrait && (
              <>
                { }
                <img className="admin-preview" src={`/media/${portrait.key}/sm`} alt="" />
                <form action={removeSiteImage}>
                  <input type="hidden" name="id" value={portrait.id} />
                  <button className="admin-btn danger small" type="submit">
                    Remove picture
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>How access works</h2>
        <ul className="admin-list">
          <li>
            Each gated property keeps <strong>{CODE_POOL} access codes</strong> ready on its page, all unused.
          </li>
          <li>A code stops working once its uses are spent, and a fresh one takes its place at once.</li>
          <li>
            An unlock lasts <strong>{UNLOCK_MINUTES} minutes</strong>, and the clock restarts while the visitor is on
            the site. Closing the tab and coming back within that time still works; leaving for longer does not.
          </li>
          <li>
            To change the length, set <code>IPA_UNLOCK_MINUTES</code> in the server&rsquo;s environment and restart;
            <code>IPA_CODE_POOL</code> changes how many codes stand ready.
          </li>
        </ul>
      </section>
    </>
  );
}
