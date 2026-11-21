import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy with a fresh nonce per page (Next adds it to its own scripts; every page renders per
 * request because the root layout reads cookies). Scripts run only with the nonce, so injected markup cannot.
 * Styles stay 'unsafe-inline': React style props and the Astryx runtime write inline styles, and a nonce in
 * style-src would switch that keyword off. The other security headers are in next.config.ts.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    // React rebuilds server error stacks with eval in development only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // blob: previews of photos being attached, data: generated avatars.
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: API routes set their own headers, static files carry no script.
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|flags|robots.txt|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
