import type { ReactNode } from 'react';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { SiteFooter, SiteHeader } from './SiteChrome';

interface Props {
  settings: Settings;
  locale: Locale;
  t: Dictionary;
  /** This page's address without the language prefix, for the language switch. */
  path: string;
  current?: 'portfolio';
  children: ReactNode;
}

export function Shell({ settings, locale, t, path, current, children }: Props) {
  return (
    <>
      <SiteHeader settings={settings} locale={locale} t={t} path={path} current={current} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} locale={locale} t={t} />
    </>
  );
}
