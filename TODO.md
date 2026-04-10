# TODO — Before Going Live

This is the list of placeholders, assumptions, and client-approval items.
Work through this before you ship the site.

---

## Photography (highest priority)

All hero and detail photos are currently **Unsplash stock** — they look fine but they are not Dalelis.
Replace with real job-site photography for authenticity, trust, and SEO.

- [ ] **Home hero** (`src/pages/index.astro`) — full-bleed background image. Suggestions:
  - A Dalelis-branded truck in front of a Norwood home
  - A technician in uniform working on a boiler or AC unit
  - A wide shot of the Dalelis crew in front of the shop
- [ ] **About page photo** (`src/pages/about.astro`) — currently stock. Replace with:
  - James Dalelis with the team, OR
  - The shop at 934R Washington St., OR
  - An in-progress installation
- [ ] **Service page hero images** (`src/pages/services/[slug].astro`) — `heroImages` map.
  Provide one real photo per category:
  - `cooling` — AC condenser or mini-split install
  - `heating` — furnace or boiler install
  - `plumbing` — water line or fixture work
  - `hvac` — general HVAC job
  - `water-heaters` — tank or tankless install
- [ ] **Gallery photos** — source site had a 5-photo project gallery. Not yet added to rebuild —
  decide whether to add a dedicated `/gallery` page or embed in `/about`.

Search-and-replace all `TODO: replace` comments in the codebase when photos are ready.

---

## Content / copy review

- [ ] **James Dalelis to review** the tone and voice on every service page. Some of the copy
  uses language like "no BS" and "honest" — confirm that matches how James wants to present.
- [ ] **Review count** in `src/lib/site.ts` (`SITE.rating.count`) — currently set to `85` as an
  approximation. Update with the actual Google review count.
- [ ] **Email address** (`dalelismechanical@gmail.com`) — confirm this is the right address for
  form submissions to route to. (It's used in the `mailto:` fallback from the contact form.)
- [ ] **Founded year is 2009** per the audit — confirm exact founding date for schema.org.
- [ ] **Discounts page** (`src/pages/specials.astro`) — currently uses generic "Ask about current
  specials" copy. If James wants specific dollar-off promotions listed ("$50 off first service",
  "Free AC diagnostic", etc.), add them here.

---

## External link verification

These links are preserved verbatim from the original site. Confirm they're still valid and correct:

- [ ] **Housecall Pro booking** — `https://book.housecallpro.com/book/James-A-Dalelis-Plumbing--Hvac-LLC/10a27057d6f746adaa9eac653d1b8a49?v2=true`
- [ ] **Google Reviews** — `https://maps.app.goo.gl/ntu5qG1QcnoCNXRk8`
- [ ] **Facebook** — `https://www.facebook.com/dalelisplumbing/`
- [ ] **Phone** — `(617) 716-9144` → `tel:+16177169144`

---

## Form submission

The `RequestForm` component currently uses a `mailto:` fallback that opens the user's email client.
This works but is not ideal. Before launch, integrate a real form handler:

- [ ] Cloudflare Pages Functions / Workers endpoint, OR
- [ ] Formspree / Basin / Getform, OR
- [ ] HubSpot / Housecall Pro webhook (if Housecall Pro accepts inbound leads via API)

The form fields (name, phone, service, zip, message) are already set up — just swap the submit handler
in `src/components/RequestForm.astro`.

---

## SEO finishing touches

- [ ] **OG image** — `public/og-default.jpg` doesn't exist yet. Create a 1200×630 social sharing image
  with the Dalelis logo, hero headline, and brand colors.
- [ ] **Favicon** — currently a placeholder SVG (`public/favicon.svg`). Replace with a real brand mark.
- [ ] **Google Search Console** — verify the rebuild and submit the new sitemap at
  `/sitemap-index.xml` once deployed.
- [ ] **Google Business Profile** — confirm the NAP (name, address, phone) on the site exactly matches
  the Google Business Profile listing for local SEO consistency.

---

## Service area expansion

Only 7 towns have dedicated pages right now (the featured list from the original footer). The other
33 towns are listed in the `/service-area/` index but don't have their own SEO pages. To add more:

1. Copy `src/content/service-areas/norwood.md`
2. Rename to the new town slug (lowercase, e.g. `newton.md`)
3. Update the `name:` and `intro:` frontmatter
4. Page auto-generates at `/service-area/newton/`

Recommended priority order for adding more: Brookline, Newton, Wellesley, Needham, Waltham — these are
the highest-traffic towns in the service area.

---

## Optional enhancements

- [ ] **Blog** — source site had two blog posts. Decide whether to port them over to the rebuild.
- [ ] **Gallery page** — if real job photos are provided, add a `/gallery/` or `/our-work/` page.
- [ ] **Team page** — if the client wants to introduce the crew.
- [ ] **Analytics** — currently no tracking. Add Plausible, Fathom, or Google Analytics before launch.
- [ ] **Mass Save rebate calculator / educational page** — deep SEO opportunity for local HVAC.

---

## Pre-launch checklist

- [ ] Replace all stock photography with real Dalelis photos
- [ ] Verify all external links
- [ ] Set up form submission endpoint
- [ ] Create OG social image
- [ ] Replace favicon
- [ ] Test on real mobile devices (iOS Safari, Android Chrome)
- [ ] Run Lighthouse on every key page (target: 100/100/100/100)
- [ ] Verify Schema.org JSON-LD in Google Rich Results Test
- [ ] Submit sitemap to Google Search Console
- [ ] 301 redirects from old URLs to new URLs (see `content/source-audit.md` for the full old sitemap)
