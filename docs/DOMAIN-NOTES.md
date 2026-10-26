# Domain notes: atlas-jiujitsu.com

Record of the domain setup, for rollback and future reference. None of this is secret; it is all public DNS information.

## Before the move (Hostinger)

- **Registrar and DNS host:** Hostinger
- **Old nameservers:** `ns1.dns-parking.com`, `ns2.dns-parking.com`
- **Old DNS records** (as imported into Cloudflare on 2026-10-26):

| Type | Name | Content |
|---|---|---|
| A | atlas-jiujitsu.com | 82.25.83.53 |
| A | ftp | 82.25.83.53 |
| AAAA | atlas-jiujitsu.com | 2a02:4780:2b:2057:0:edc:a7ed:2 |
| CNAME | www | atlas-jiujitsu.com |

There were no MX, SPF, DKIM or DMARC records (no domain email was in use).

## Cloudflare

- **Cloudflare nameservers assigned to this domain:** `rafe.ns.cloudflare.com`, `vicky.ns.cloudflare.com`
- **Status:** nameservers switched and the zone is Active. The site launched on 2026-10-26.
- `atlas-jiujitsu.com` and `www` are attached to the Worker `atlas` as custom domains (Cloudflare creates and proxies those records itself). `www` redirects to the bare domain with a Redirect Rule (301, path and query kept).
- Email Routing is on for the domain. Its MX, SPF and DKIM records are **DNS only** by design; leave them alone. Destination `atlasjiujitsu90@gmail.com` is verified.
- Turnstile widget "Atlas free trial" covers `atlas-jiujitsu.com`, `www` and the `workers.dev` address.
- The old Hostinger A, AAAA, `ftp` and `www` records were deleted at launch (listed above for rollback).

## How to roll back

If something goes wrong after the nameserver switch:

1. Hostinger → Domains → atlas-jiujitsu.com → DNS / Nameservers → Change Nameservers.
2. Enter `ns1.dns-parking.com` and `ns2.dns-parking.com` and save.
3. The old site returns once DNS settles (minutes to a few hours).

If something goes wrong with the live site, but the nameservers are still Cloudflare's: in the Worker → Domains, remove the two custom domains, then in Cloudflare → DNS → Records re-add the A record `atlas-jiujitsu.com` → `82.25.83.53` and the CNAME `www` → `atlas-jiujitsu.com` (both DNS only).

## Still to do

- [x] Switch nameservers at Hostinger; zone Active
- [x] Email Routing, Turnstile, admin login
- [x] Attach the domain to the Worker (launch)
- [x] Delete old Hostinger records; `www` → apex redirect
- [ ] Turn off the `workers.dev` Production route (Worker → Domains)
- [ ] Transfer the registrar to Cloudflare: unlock at Hostinger, get the EPP code, Cloudflare → Domain Registration → Transfer. Then enable DNSSEC. Cancel Hostinger only after the transfer finishes.
- [ ] Google Business Profile: website link, hours, sign-up link, coordinates
- [ ] Search Console (Domain property, TXT record in Cloudflare DNS) and the sitemap `https://atlas-jiujitsu.com/sitemap-index.xml`; Bing Webmaster Tools
- [ ] Ask The Mecca Gym to link to the new site
