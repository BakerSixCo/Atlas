# Atlas Jiu-Jitsu: atlas-jiujitsu.com

A fast, secure static site for Atlas Jiu-Jitsu, built with Astro and hosted on Cloudflare Workers. A visual CMS (Keystatic) lets you edit content without touching code.

## Editing the site (for owners)

A short plain-English version of this section is in [docs/OWNER-GUIDE.md](docs/OWNER-GUIDE.md).

Go to **atlas-jiujitsu.com/keystatic**, log in, edit something and hit **Save**. The site rebuilds automatically and your change is live in about a minute.

| I want to… | Where in the admin |
|---|---|
| Change a class time or add a class | **Schedule → Classes** |
| Hide a class temporarily | Open the class → uncheck **Show on schedule** |
| Post a holiday closure | **Schedule → Schedule notes & closures** (past dates hide automatically) |
| Put an alert at the top of every page | **News & Alerts → Site settings & alert banner** → check **Show banner** |
| Post a seminar, promotion or result | **News & Alerts → News & Events** → Create |
| Edit the FAQ, testimonials or instructors | **People** |
| Change the phone number, email or sign-up link | **Site settings** |
| Change the membership price | **Pages → Membership & pricing** |
| Edit the homepage, About page or handbook | **Pages** |

If the login setting is ever missing, `/keystatic` deliberately shows "The site editor is not set up yet" instead of a broken admin page.

### One-time CMS login setup

Choose one of these options.

**Option A: Keystatic Cloud (easiest, free for up to 3 editors)**
1. Sign up at https://keystatic.cloud, create a team and project, and connect the `BakerSixCo/Atlas` GitHub repo.
2. In Cloudflare → your Worker → Settings → **Build → Variables**, add `PUBLIC_KEYSTATIC_CLOUD_PROJECT` = `team-name/project-name`.
3. Redeploy. Editors then log in at `/keystatic` with their Keystatic account.

**Option B: your own GitHub App**
1. Run `npm run dev` locally with `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` unset, then visit `localhost:4321/keystatic` and follow the "create GitHub App" flow.
2. Copy the generated values into Cloudflare: `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` as a build variable, and `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` and `KEYSTATIC_SECRET` as encrypted secrets.

## Free trial form (emails the gym)

`/free-trial` has a form that emails `atlasjiujitsu90@gmail.com` (the visitor's address is set as Reply-To, so you answer straight from Gmail). It is one small server route, `src/pages/api/trial.ts`, using Cloudflare Email Service. Sending to a verified address of your own is free.

**One-time setup** (done for the live site; kept for reference):
1. Cloudflare dashboard → **Compute → Email Service → Email Routing → Onboard Domain** → `atlas-jiujitsu.com`. Cloudflare adds the DNS records it needs.
   - If you earlier added a "no email" lockdown (MX `.`, TXT `v=spf1 -all`, `_dmarc` reject), **delete those three records first**. Email Routing needs its own MX and SPF records, and Cloudflare adds a matching DMARC record.
2. Same page → **Destination addresses** → add `atlasjiujitsu90@gmail.com` and click the verification link Cloudflare emails to it.
3. Redeploy. Submit the form once on the live site to confirm an email arrives.

If email is ever down, submitting shows the "That didn't go through" page, which gives visitors your phone number and email, so no one is silently lost. If the very first deploy complains about the email binding, finish steps 1-2 and retry.

**How it's protected:** the email binding in `wrangler.jsonc` is locked to your address, so the form can never email anyone else. It also has a hidden trap field for bots, a limit of 5 requests per visitor per hour, input cleaning, and an origin check. For extra protection, add a Cloudflare rate-limiting rule for `/api/trial`.

**Turn on the "I'm not a robot" check (Cloudflare Turnstile, free).** Set up and enforced on the live site. Without it the form relies on the basic protections above.
1. Cloudflare dashboard → **Turnstile → Add widget**. Name it "Atlas free trial". Hostnames: `atlas-jiujitsu.com` and `www.atlas-jiujitsu.com` (add your `*.workers.dev` address too if you want to test before the domain is live). Widget mode: **Managed**. Copy the **Site key** and the **Secret key**.
2. In the admin → **Site settings** → **Turnstile site key**, paste the site key and save. The widget appears on `/free-trial` after the site rebuilds.
3. Cloudflare → your Worker → **Settings → Variables and Secrets → Add** → type **Secret**, name `TURNSTILE_SECRET_KEY`, paste the secret key → deploy.

Set **both**. The server only enforces the check once the secret exists, so if you add the secret but forget the site key, visitors can't submit (they see the error page with your phone and email). To switch the check off, delete the secret and clear the site key. Only `/free-trial` loads anything from Cloudflare's challenge domain; every other page keeps the strict security policy.

**Public address vs. delivery address:** the site shows `info@atlas-jiujitsu.com` (Site settings → Email), which Email Routing forwards to the gym Gmail. The form itself still delivers straight to `atlasjiujitsu90@gmail.com`, because the email binding can only send to a verified destination address.

**Changing the recipient:** edit `destination_address` in `wrangler.jsonc` and `TRIAL_TO` in `src/pages/api/trial.ts` (both must match), and verify the new address in step 2. The offer wording ("Your first week is free.") and all page text are editable in the admin under **Pages → Free trial page**.

## Deploying (Cloudflare Workers Builds)

- **Repo:** `BakerSixCo/Atlas`, branch `main`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Worker name:** `atlas` (this must match `name` in `wrangler.jsonc`; change one to match the other)
- **Custom domains:** `atlas-jiujitsu.com` and `www` are attached under Worker → Domains. `www` redirects to the bare domain via a Cloudflare Redirect Rule. See [docs/DOMAIN-NOTES.md](docs/DOMAIN-NOTES.md) for DNS records and rollback.

Every push to `main` deploys, and so does every save in the CMS.

## Developing

```sh
npm install
npm run dev      # http://localhost:4321, CMS at /keystatic (edits local files)
npm run build    # production build into dist/
npm run preview  # run the build in the real Cloudflare runtime
```

### How it fits together

- `src/content/`: all editable content (YAML and Markdown), managed by `keystatic.config.tsx`
- `src/pages/`: routes. `/schedule.ics` is a live calendar feed and `/news/rss.xml` an RSS feed.
- `src/lib/schedule.ts`: schedule logic. Times are always shown in America/Boise.
- `src/scripts/site.ts`: the only client JavaScript (~4 KB): live "on the mats now / up next" status, today highlight, schedule filters, mobile menu. Every page works without it.
- `public/_headers`: strict Content-Security-Policy, HSTS and other security headers
- `astro.config.mjs` → `redirects`: 301s from the old WordPress URLs so Google rankings carry over
- `archive/`: everything scraped from the old WordPress site (copy, photos, logos, handbook PDF)

### SEO

- **Program pages** (`/programs/*`) target the searches people actually make ("no-gi jiu-jitsu Meridian", "adult wrestling Meridian", "jiu-jitsu for beginners"). Each one has its own Google title and description fields in the admin, so keep the main phrase first.
- **Structured data:** every page tells Google the gym's name, address, phone, class hours, service area and founder. Program pages add Service + FAQ markup. News posts marked as events produce Event listings.
- **Fill in once** under **Site settings**: the Google Business Profile link, the review link, and latitude/longitude.
- Old WordPress URLs 301-redirect to the new pages; `sitemap-index.xml` is generated on every build.

### Security

- The public site is static HTML, with no database, PHP or plugins to exploit.
- A strict CSP allows no inline scripts and no third-party scripts, fonts or trackers. Fonts are self-hosted.
- Only the `/keystatic` admin runs server code, and it authenticates through GitHub or Keystatic Cloud. Content changes become git commits, so every edit is versioned and can be reverted.
