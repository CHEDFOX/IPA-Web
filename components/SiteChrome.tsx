import Link from 'next/link';
import { mailtoHref, telHref, whatsappHref } from '@/lib/format';
import { fill, localeHref, type Dictionary, type Locale } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { currentYear } from '@/lib/year';
import { Chat, Mail, Phone } from './Icons';

interface ChromeProps {
  settings: Settings;
  locale: Locale;
  t: Dictionary;
}

export function SiteHeader({
  settings,
  locale,
  t,
  path,
  current,
}: ChromeProps & { path: string; current?: 'portfolio' }) {
  const message = whatsappHref(settings, fill(t.greeting, { name: settings.siteName }));
  const other: Locale = locale === 'en' ? 'hi' : 'en';
  const href = (p: string) => localeHref(locale, p);
  return (
    <header className="wrap site-header">
      <Link href={href('/')} className="brand">
        <span className="brand-name">{settings.siteName}</span>
        {settings.tagline && <span className="brand-tag">{settings.tagline}</span>}
      </Link>
      <nav className="nav" aria-label={t.nav.portfolio}>
        <Link href={href('/properties')} aria-current={current === 'portfolio' ? 'page' : undefined}>
          {t.nav.portfolio}
        </Link>
        {settings.aboutText && <Link href={href('/#about')}>{t.nav.about}</Link>}
        <Link href={href('/#contact')}>{t.nav.contact}</Link>
        <Link className="lang-switch" href={localeHref(other, path)} hrefLang={other} lang={other} prefetch={false}>
          {t.nav.switchTo}
        </Link>
        {message && (
          <a className="btn btn-accent btn-sm" href={message} target="_blank" rel="noopener">
            <Chat /> {t.nav.message}
          </a>
        )}
      </nav>
    </header>
  );
}

export async function SiteFooter({ settings, locale, t }: ChromeProps) {
  const year = await currentYear();
  const href = (p: string) => localeHref(locale, p);
  return (
    <footer className="wrap site-footer">
      <div className="footer-meta">
        <span className="brand-name">{settings.siteName}</span>
        <span className="footer-note">
          © {year} {settings.siteName}
          {settings.footerNote && ` · ${settings.footerNote}`}
        </span>
      </div>
      <nav className="footer-links" aria-label={t.nav.contact}>
        <Link href={href('/properties')}>{t.nav.portfolio}</Link>
        {settings.aboutText && <Link href={href('/#about')}>{t.nav.about}</Link>}
        <Link href={href('/#contact')}>{t.nav.contact}</Link>
        {settings.instagram && (
          <a href={settings.instagram} target="_blank" rel="noopener">
            Instagram
          </a>
        )}
        {settings.facebook && (
          <a href={settings.facebook} target="_blank" rel="noopener">
            Facebook
          </a>
        )}
      </nav>
    </footer>
  );
}

/** The green "Looking for something specific?" band with whichever contact buttons are set. */
export function ContactBand({ settings, t, title, text }: Omit<ChromeProps, 'locale'> & { title?: string; text?: string }) {
  const wa = whatsappHref(settings, fill(t.lookingGreeting, { name: settings.siteName }));
  const tel = telHref(settings.phone);
  const mail = mailtoHref(settings.email, settings.siteName);
  const body = text ?? settings.contactText;
  return (
    <section id="contact" className="contact-band" aria-labelledby="contact-title">
      <div className="contact-band-inner">
        <div className="contact-band-text">
          <h2 id="contact-title">{title ?? settings.contactTitle}</h2>
          {body && <p>{body}</p>}
        </div>
        <div className="contact-actions">
          {wa && (
            <a className="btn btn-light" href={wa} target="_blank" rel="noopener">
              <Chat size={18} /> {t.contact.whatsapp}
            </a>
          )}
          {tel && (
            <a className="btn btn-on-dark" href={tel}>
              <Phone size={18} /> {t.contact.call}
            </a>
          )}
          {mail && (
            <a className="btn btn-on-dark" href={mail}>
              <Mail size={18} /> {t.contact.email}
            </a>
          )}
          {!wa && !tel && !mail && <p>{t.contact.missing}</p>}
        </div>
      </div>
    </section>
  );
}
