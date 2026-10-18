import { getSharedProperty, SITE_URL } from '@/lib/api';
import { isLocale, localeHref } from '@/lib/i18n';
import { qrResponse } from '@/lib/qr';

export async function GET(_request: Request, { params }: RouteContext<'/[lang]/p/[token]/qr'>) {
  const { lang, token } = await params;
  const property = isLocale(lang) ? await getSharedProperty(token) : null;
  if (!property || !isLocale(lang)) return new Response('Not found', { status: 404 });
  return qrResponse(`${SITE_URL}${localeHref(lang, `/p/${token}`)}`, `${property.slug}-private-qr.svg`);
}
