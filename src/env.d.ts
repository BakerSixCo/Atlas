// Bindings declared in wrangler.jsonc, as seen from `import { env } from 'cloudflare:workers'`.
declare module 'cloudflare:workers' {
  export const env: {
    /** Email Service binding, locked to the trial inbox in wrangler.jsonc. Undefined until Email Routing is set up. */
    EMAIL?: {
      send(message: {
        to: string;
        from: string | { email: string; name?: string };
        replyTo?: string | { email: string; name?: string };
        subject: string;
        text?: string;
        html?: string;
      }): Promise<{ messageId: string }>;
    };
    /** Turnstile secret key (a Worker secret). When set, the form requires a passed challenge. */
    TURNSTILE_SECRET_KEY?: string;
    /** KV namespace the Cloudflare adapter provisions for sessions; reused for form rate limiting. */
    SESSION?: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    };
  };
}
