import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifyTurnstile } from '../../lib/turnstile';

// Server-rendered: runs on Cloudflare at request time, everything else is static.
export const prerender = false;

// Must match the `send_email` binding in wrangler.jsonc. The binding itself is locked to
// TRIAL_TO, so even a bug here can never email anyone else. FROM must be on a domain
// onboarded in Cloudflare Email Service (see README → "Free trial form").
const TRIAL_TO = 'atlasjiujitsu90@gmail.com';
const TRIAL_FROM = { email: 'website@atlas-jiujitsu.com', name: 'Atlas Website' };

const MAX_PER_HOUR = 5;
const EXPERIENCE = ['Never trained', 'A little experience', 'Experienced'];

const redirect = (to: string) =>
  new Response(null, { status: 303, headers: { Location: to, 'Cache-Control': 'no-store' } });

/** Trim, drop control characters (blocks header/newline injection), cap length. */
const clean = (v: FormDataEntryValue | null, max: number, multiline = false) =>
  String(v ?? '')
    .replace(multiline ? /[^\S\n]*[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export const GET: APIRoute = () =>
  new Response('Use the form at /free-trial.', { status: 405, headers: { Allow: 'POST' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect('/free-trial/error');
  }

  // Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
  if (clean(form.get('website'), 200)) return redirect('/free-trial/thanks');

  const name = clean(form.get('name'), 100);
  const email = clean(form.get('email'), 200).toLowerCase();
  const phone = clean(form.get('phone'), 30);
  const experience = EXPERIENCE.includes(String(form.get('experience'))) ? String(form.get('experience')) : '';
  const preferred = clean(form.get('class'), 120);
  const message = clean(form.get('message'), 1000, true);

  if (!name || !EMAIL_RE.test(email)) return redirect('/free-trial/error?reason=invalid');

  // Link-stuffed messages are spam. Same silent success.
  if ((message.match(/https?:\/\//gi) ?? []).length > 1) return redirect('/free-trial/thanks');

  // Light per-visitor rate limit (best effort; KV is eventually consistent).
  const ip = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';
  const key = `trial:${ip}`;
  try {
    const count = Number((await env.SESSION?.get(key)) ?? 0);
    if (count >= MAX_PER_HOUR) return redirect('/free-trial/error?reason=busy');
    await env.SESSION?.put(key, String(count + 1), { expirationTtl: 3600 });
  } catch {
    /* rate limiting is optional; never block a real request because of it */
  }

  // Human check. Only enforced once the Turnstile secret is configured (see README).
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile({ token: form.get('cf-turnstile-response'), secret: env.TURNSTILE_SECRET_KEY, ip });
    if (!ok) return redirect('/free-trial/error?reason=verify');
  }

  if (!env.EMAIL) {
    console.error('[trial] EMAIL binding missing: Email Service is not set up yet');
    return redirect('/free-trial/error');
  }

  const when = new Date().toLocaleString('en-US', { timeZone: 'America/Boise', dateStyle: 'full', timeStyle: 'short' });
  const text = [
    `New free trial request from the website`,
    ``,
    `Name:        ${name}`,
    `Email:       ${email}`,
    `Phone:       ${phone || '(not given)'}`,
    `Experience:  ${experience || '(not given)'}`,
    `Class:       ${preferred || '(not given)'}`,
    ``,
    `Message:`,
    message || '(none)',
    ``,
    `Received ${when} (Boise time)`,
    `Reply to this email to answer ${name} directly.`,
  ].join('\n');

  try {
    await env.EMAIL.send({
      to: TRIAL_TO,
      from: TRIAL_FROM,
      replyTo: { email, name },
      subject: `Free trial request: ${name}`,
      text,
    });
  } catch (err) {
    console.error('[trial] send failed', (err as { code?: string }).code, (err as Error).message);
    return redirect('/free-trial/error');
  }

  return redirect('/free-trial/thanks');
};
