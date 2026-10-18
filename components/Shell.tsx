import type { ReactNode } from 'react';
import type { Settings } from '@/lib/types';
import { SiteFooter, SiteHeader } from './SiteChrome';

export function Shell({ settings, current, children }: { settings: Settings; current?: 'portfolio'; children: ReactNode }) {
  return (
    <>
      <SiteHeader settings={settings} current={current} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
