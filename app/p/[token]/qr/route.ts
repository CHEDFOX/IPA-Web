import { getSharedProperty, SITE_URL } from '@/lib/api';
import { qrResponse } from '@/lib/qr';

export async function GET(_request: Request, { params }: RouteContext<'/p/[token]/qr'>) {
  const { token } = await params;
  const property = await getSharedProperty(token);
  if (!property) return new Response('Not found', { status: 404 });
  return qrResponse(`${SITE_URL}/p/${token}`, `${property.slug}-private-qr.svg`);
}
