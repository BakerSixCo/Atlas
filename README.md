# Atlas Jiu-Jitsu: atlas-jiujitsu.com

A fast, secure static site for Atlas Jiu-Jitsu, built with Astro and hosted on Cloudflare Workers. A visual CMS (Keystatic) lets you edit content without touching code.

## Editing the site (for owners)

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
| Edit the homepage, About page or handbook | **Pages** |

Until a login method is configured (below), `/keystatic` deliberately shows "The site editor is not set up yet" instead of a broken admin page.

### One-time CMS login setup

Choose one of these options.

**Option A: Keystatic Cloud (easiest, free for up to 3 editors)**
1. Sign up at https://keystatic.cloud, create a team and project, and connect the `BakerSixCo/Atlas` GitHub repo.
2. In Cloudflare → your Worker → Settings → **Build → Variables**, add `PUBLIC_KEYSTATIC_CLOUD_PROJECT` = `team-name/project-name`.
3. Redeploy. Editors then log in at `/keystatic` with their Keystatic account.

**Option B: your own GitHub App**
1. Run `npm run dev` locally with `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` unset, then visit `localhost:4321/keystatic` and follow the "create GitHub App" flow.
2. Copy the generated values into Cloudflare: `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` as a build variable, and `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` and `KEYSTATIC_SECRET` as encrypted secrets.

## Deploying (Cloudflare Workers Builds)

- **Repo:** `BakerSixCo/Atlas`, branch `main`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Worker name:** `atlas-jiujitsu` (this must match `name` in `wrangler.jsonc`; change one to match the other)
- **Custom domain:** add `atlas-jiujitsu.com` and `www` under Worker → Settings → Domains & Routes, then remove the old WordPress DNS records.

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

- **Program pages** (`/programs/*`) target the searches people actually make ("no-gi jiu-jitsu Meridian", "wrestling classes Meridian", "jiu-jitsu for beginners"). Each one has its own Google title and description fields in the admin, so keep the main phrase first.
- **Structured data:** every page tells Google the gym's name, address, phone, class hours, service area and founder. Program pages add Service + FAQ markup. News posts marked as events produce Event listings.
- **Fill in once** under **Site settings**: the Google Business Profile link, the review link, and latitude/longitude.
- Old WordPress URLs 301-redirect to the new pages; `sitemap-index.xml` is generated on every build.

### Security

- The public site is static HTML, with no database, PHP or plugins to exploit.
- A strict CSP allows no inline scripts and no third-party scripts, fonts or trackers. Fonts are self-hosted.
- Only the `/keystatic` admin runs server code, and it authenticates through GitHub or Keystatic Cloud. Content changes become git commits, so every edit is versioned and can be reverted.
