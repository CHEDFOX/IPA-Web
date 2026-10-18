import QRCode from 'qrcode';

/** An SVG QR code response; SVG prints sharply at any size (signboards, flyers). */
export async function qrResponse(url: string, filename: string) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#141814', light: '#ffffff' },
  });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
