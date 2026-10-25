import { defineMiddleware } from 'astro:middleware';

// The marketing site is static and gets its security headers from public/_headers.
// The CMS admin (/keystatic) and its API are server-rendered, so they need their own.
const cmsConfigured = Boolean(
  import.meta.env.PUBLIC_KEYSTATIC_CLOUD_PROJECT || import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG,
);

// No restrictive script/style CSP here: the Keystatic UI relies on inline styles.
// frame-ancestors + the headers below still stop clickjacking, sniffing and indexing.
const adminHeaders: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
};

export const onRequest = defineMiddleware(async ({ url }, next) => {
  const isAdmin = url.pathname.startsWith('/keystatic') || url.pathname.startsWith('/api/keystatic');
  if (!isAdmin) return next();

  // In production the admin only works once a login method is configured (see README).
  // Until then, fail closed with a clear message instead of a broken admin page.
  if (import.meta.env.PROD && !cmsConfigured) {
    return new Response('The site editor is not set up yet. See "Editing the site" in the README.', {
      status: 503,
      headers: { ...adminHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const res = await next();
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(adminHeaders)) out.headers.set(k, v);
  return out;
});
