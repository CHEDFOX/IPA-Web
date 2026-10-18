import Link from 'next/link';
import { mailtoHref, telHref, whatsappHref } from '@/lib/format';
import type { Settings } from '@/lib/types';
import { Chat, Mail, Phone } from './Icons';
import { currentYear } from '@/lib/year';

export function SiteHeader({ settings, current }: { settings: Settings; current?: 'portfolio' }) {
  const message = whatsappHref(settings, `Hello ${settings.siteName}, I'd like to ask about your properties.`);
  const hasAbout = Boolean(settings.aboutText);
  return (
    <header className="wrap site-header">
      <Link href="/" className="brand">
        <span className="brand-name">{settings.siteName}</span>
        {settings.tagline && <span className="brand-tag">{settings.tagline}</span>}
      </Link>
      <nav className="nav" aria-label="Main">
        <Link href="/properties" aria-current={current === 'portfolio' ? 'page' : undefined}>
          Portfolio
        </Link>
        {hasAbout && <Link href="/#about">About</Link>}
        <Link href="/#contact">Contact</Link>
        {message && (
          <a className="btn btn-accent btn-sm" href={message} target="_blank" rel="noopener">
            <Chat /> Message us
          </a>
        )}
      </nav>
    </header>
  );
}

export async function SiteFooter({ settings }: { settings: Settings }) {
  const year = await currentYear();
  return (
    <footer className="wrap site-footer">
      <div className="footer-meta">
        <span className="brand-name">{settings.siteName}</span>
        <span className="footer-note">
          © {year} {settings.siteName}
          {settings.footerNote && ` · ${settings.footerNote}`}
        </span>
      </div>
      <nav className="footer-links" aria-label="Footer">
        <Link href="/properties">Portfolio</Link>
        {settings.aboutText && <Link href="/#about">About</Link>}
        <Link href="/#contact">Contact</Link>
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
export function ContactBand({ settings, title, text }: { settings: Settings; title?: string; text?: string }) {
  const wa = whatsappHref(settings, `Hello ${settings.siteName}, I'm looking for a property.`);
  const tel = telHref(settings.phone);
  const mail = mailtoHref(settings.email, `Enquiry for ${settings.siteName}`);
  return (
    <section id="contact" className="contact-band" aria-labelledby="contact-title">
      <div className="contact-band-inner">
        <div className="contact-band-text">
          <h2 id="contact-title">{title ?? settings.contactTitle}</h2>
          {(text ?? settings.contactText) && <p>{text ?? settings.contactText}</p>}
        </div>
        <div className="contact-actions">
          {wa && (
            <a className="btn btn-light" href={wa} target="_blank" rel="noopener">
              <Chat size={18} /> WhatsApp
            </a>
          )}
          {tel && (
            <a className="btn btn-on-dark" href={tel}>
              <Phone size={18} /> Call
            </a>
          )}
          {mail && (
            <a className="btn btn-on-dark" href={mail}>
              <Mail size={18} /> Email
            </a>
          )}
          {!wa && !tel && !mail && <p>Add your WhatsApp, phone or email in the admin settings.</p>}
        </div>
      </div>
    </section>
  );
}
