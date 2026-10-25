/**
 * Pages are built as about.html and served at /about. During the static build Astro reports
 * the file path ("/about.html", "/index.html"), so turn it back into the public URL path.
 */
export function publicPath(pathname: string): string {
  const p = pathname.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  return p.length > 1 ? p.replace(/\/$/, '') : '/';
}
