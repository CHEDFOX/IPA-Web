import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { getSite } from '@/lib/api';
import { localeHref } from '@/lib/i18n';
import { getDictionary } from '@/lib/locale';
import { localizeSettings } from '@/lib/localize';

export default async function NotFound() {
  const { locale, t } = await getDictionary();
  const { settings } = await getSite();
  return (
    <Shell settings={localizeSettings(settings, locale)} locale={locale} t={t} path="/">
      <section className="wrap page-intro">
        <span className="label">{t.notFound.kicker}</span>
        <h1>{t.notFound.title}</h1>
        <p>{t.notFound.text}</p>
        <div className="hero-actions">
          <Link className="btn btn-accent" href={localeHref(locale, '/properties')}>
            {t.notFound.seeAll}
          </Link>
          <Link className="btn btn-outline" href={localeHref(locale, '/#contact')}>
            {t.notFound.contact}
          </Link>
        </div>
      </section>
      <div className="section" />
    </Shell>
  );
}
