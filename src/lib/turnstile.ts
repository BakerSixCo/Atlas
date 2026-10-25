/** Server-side check of a Cloudflare Turnstile token. Fails closed: any error means "not verified". */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(opts: {
  token: unknown;
  secret: string;
  ip?: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const { token, secret, ip, fetchImpl = fetch } = opts;
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  try {
    const res = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const result = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!result.success) console.warn('[trial] turnstile rejected:', (result['error-codes'] ?? []).join(','));
    return result.success === true;
  } catch (err) {
    console.error('[trial] turnstile check failed:', (err as Error).message);
    return false;
  }
}
