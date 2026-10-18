import { getProperty, SITE_URL } from '@/lib/api';
import { isLocale, localeHref } from '@/lib/i18n';
import { qrResponse } from '@/lib/qr';

export async function GET(_request: Request, { params }: RouteContext<'/[lang]/properties/[slug]/qr'>) {
  const { lang, slug } = await params;
  const property = isLocale(lang) ? await getProperty(slug) : null;
  if (!property || !isLocale(lang)) return new Response('Not found', { status: 404 });
  return qrResponse(`${SITE_URL}${localeHref(lang, `/properties/${property.slug}`)}`, `${property.slug}-qr.svg`);
}
