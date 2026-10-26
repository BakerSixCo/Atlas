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
- Until launch day the website records stay **DNS only** (grey cloud), so the old WordPress site behaves exactly as before.

## How to roll back

If something goes wrong after the nameserver switch:

1. Hostinger → Domains → atlas-jiujitsu.com → DNS / Nameservers → Change Nameservers.
2. Enter `ns1.dns-parking.com` and `ns2.dns-parking.com` and save.
3. The old site returns once DNS settles (minutes to a few hours).

If something goes wrong after the domain is attached to the new Worker (launch day), but the nameservers are still Cloudflare's: in Cloudflare → DNS → Records, delete the Worker's records for the root and `www`, and re-add the A record `atlas-jiujitsu.com` → `82.25.83.53` and the CNAME `www` → `atlas-jiujitsu.com` (both DNS only).

## Still to do

- [ ] Switch nameservers at Hostinger (check DNSSEC is off first)
- [ ] Wait for Cloudflare to show the domain as **Active**
- [ ] Email Routing, Turnstile, admin login (see the README)
- [ ] Attach the domain to the Worker (launch)
- [ ] Transfer the registrar to Cloudflare once everything is stable. Cancel Hostinger only after the transfer finishes.
