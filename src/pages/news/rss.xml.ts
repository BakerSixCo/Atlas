import type { APIRoute } from 'astro';
import { getPosts } from '../../lib/content';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const items = posts.map((p) => {
    const url = new URL(`/news/${p.slug}`, site).href;
    return `<item><title>${esc(p.entry.title)}</title><link>${url}</link><guid>${url}</guid>${p.entry.date ? `<pubDate>${new Date(`${p.entry.date}T12:00:00Z`).toUTCString()}</pubDate>` : ''}<description>${esc(p.entry.summary ?? '')}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Atlas Jiu-Jitsu News</title><link>${site}</link><description>News and events from Atlas Jiu-Jitsu, Meridian, Idaho.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
