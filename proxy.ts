import { NextResponse, type NextRequest } from 'next/server';

// Pages live in app/[lang]. English keeps the plain addresses (/properties/…) and is served from
// /en internally; Hindi lives under /hi/…
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url, 308);
  }
  if (pathname === '/hi' || pathname.startsWith('/hi/')) return NextResponse.next();

  url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except API routes, build assets and the root files (icon, sitemap, robots).
  matcher: ['/((?!api/|_next/|icon\\.svg|sitemap\\.xml|robots\\.txt|favicon\\.ico).*)'],
};
