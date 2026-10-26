# Atlas Website: Owner's Guide

Edit anything on the site at **atlas-jiujitsu.com/keystatic**: press Save and the change is live in about one to three minutes.

(A shareable, editable copy of this guide also lives in your Claude Docs: "Atlas Website: Owner's Guide".)

## Setup status

Done: site live on atlas-jiujitsu.com, admin login (Keystatic Cloud), free trial email (Email Routing), spam check (Turnstile).

Still to do:

- [ ] Turn off the temporary `workers.dev` address (Cloudflare → Worker `atlas` → Domains)
- [ ] Update Google Business Profile: website link, hours matching the schedule, sign-up link. Add the review link and map coordinates in the admin's Site settings
- [ ] Add the site to Google Search Console and submit https://atlas-jiujitsu.com/sitemap-index.xml
- [ ] Ask The Mecca Gym to link to the new site
- [ ] Move the domain registrar from Hostinger to Cloudflare, then cancel Hostinger (see [DOMAIN-NOTES](DOMAIN-NOTES.md))

## Everyday jobs

The admin menu has four groups: Schedule, News & Alerts, Pages and People.

| Job | Where in the admin | Notes |
| --- | --- | --- |
| Change a class time or add a class | Schedule → Classes | Times use 24-hour format, like 18:30 for 6:30 PM. |
| Hide a class for a while | Schedule → Classes → open it → untick Show on schedule | Nothing is deleted; tick it again to bring it back. |
| Post a holiday closure | Schedule → Schedule notes & closures → add a closure | Past dates hide on their own. Add the same date to Google's Special hours. |
| Put an alert at the top of every page | News & Alerts → Site settings & alert banner → tick Show banner | Untick it when the news is old. |
| Post news, a seminar or a result | News & Alerts → News & Events → Create | Tick the event box for seminars so Google can list them. Tick Draft to keep a post hidden. |
| Change phone, email, address or sign-up link | News & Alerts → Site settings & alert banner | Then update Google to match. |
| Change the free trial offer | Pages → Free trial page → The offer | One short line, shown as a red badge. |
| Change the membership price or what's included | Pages → Membership & pricing | Update the price here only: the home page, membership page and Google data all read from it. Then check the sign-up page in GymMaster shows the same price. |
| Edit the home page, About page or handbook | Pages → Home page, About page or Student handbook | |
| Edit a program page (no-gi, wrestling, beginners, open mat) | Pages → Program pages | Don't change a page's web address: old links break. The Google title and description control how it looks in search. |
| Choose which review shows next to the price or the free trial form | People → Testimonials → open a review → "Also show next to…" | Pick one review for each spot. Reviews with stars and "Google review" need no name. |
| Edit the FAQ, testimonials or instructors | People → FAQ, Testimonials or Instructors | |
| Swap a photo | Open any photo field and choose a new image | Large landscape photos (about 2000 px wide) work best. Add a short description of each photo. |

## Rules of thumb

- **Save means live.** Every Save publishes to the real site after a short rebuild. Use Draft on news posts to keep something hidden until it's ready.
- **Keep Google in sync.** When a class time changes, change your Google Business Profile hours the same day.
- **Same details everywhere.** Use the identical name, address and phone on the site, Google, Instagram and any directory.
- **Keep the offer honest.** If the free trial terms change, edit the offer line so the site never promises something you don't do.
- **Mistakes can be undone.** Every change is saved in the site's history on GitHub, so an earlier version can always be restored.
- **Post now and then.** One news post a month (a belt promotion, a seminar, a result) gives Google fresh pages to find.

## If something looks wrong

- **My change isn't showing.** Wait three minutes, then refresh the page (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac).
- **The admin says "The site editor is not set up yet."** The Keystatic login setting was lost. See "One-time CMS login setup" in the README.
- **The free trial form says "That didn't go through."** The spam check failed or email sending is down. Visitors see your phone and email as a backup. Check Cloudflare → Email Service.
- **Anything else.** Ask Claude in your project chat, or check the README in the GitHub repo.
