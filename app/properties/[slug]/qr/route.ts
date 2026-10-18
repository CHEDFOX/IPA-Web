import { getProperty, SITE_URL } from '@/lib/api';
import { qrResponse } from '@/lib/qr';

export async function GET(_request: Request, { params }: RouteContext<'/properties/[slug]/qr'>) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return new Response('Not found', { status: 404 });
  return qrResponse(`${SITE_URL}/properties/${property.slug}`, `${property.slug}-qr.svg`);
}
