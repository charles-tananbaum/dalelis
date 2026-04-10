# Dalelis Mechanical — Website

A modern, SEO-optimized rebuild of [dalelismechanical.com](https://www.dalelismechanical.com).
Built with Astro 5, Tailwind CSS 4, and TypeScript.

---

## Stack

| | |
|---|---|
| **Framework** | [Astro 5](https://astro.build) — zero JS by default, fastest possible Lighthouse/Core Web Vitals |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) + custom CSS variables |
| **Type safety** | TypeScript (strict) |
| **Content** | Astro Content Collections (typed Markdown) |
| **SEO** | Sitemap plugin, Schema.org JSON-LD, Open Graph, canonical URLs |
| **Deploy target** | Cloudflare Pages, Vercel, Netlify — any static host |

### Why Astro?
This is a content-heavy, mostly-static local service site. Astro ships zero runtime JavaScript by default,
which gives the best possible mobile Core Web Vitals — critical for local SEO ranking. There's no auth,
database, or dynamic behavior that would justify Next.js's React runtime tax. Content Collections turn
services and service areas into typed Markdown files, so adding a new town is literally "drop a `.md` file."

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build to ./dist
npm run preview    # preview the built site
```

Requires Node 20.19+ or Node 22.12+.

---

## Project structure

```
dalelis/
├── content/
│   └── source-audit.md             # content audit from the original dalelismechanical.com
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── images/                     # (TODO) real photos go here
├── src/
│   ├── components/                 # Header, Footer, Hero, RequestForm, TrustBar, etc.
│   ├── content/                    # EDITABLE CONTENT — see below
│   │   ├── services/               # one .md per service
│   │   ├── service-areas/          # one .md per town
│   │   └── testimonials/           # one .md per review
│   ├── layouts/
│   │   └── BaseLayout.astro        # SEO head, JSON-LD schema, header/footer
│   ├── lib/
│   │   └── site.ts                 # single source of truth for business info
│   ├── pages/                      # file-based routing
│   │   ├── index.astro             # Home
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── reviews.astro
│   │   ├── specials.astro
│   │   ├── maintenance-plans.astro
│   │   ├── privacy.astro
│   │   ├── services/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro        # dynamic service pages
│   │   └── service-area/
│   │       ├── index.astro
│   │       └── [slug].astro        # dynamic town pages
│   ├── styles/global.css           # design tokens + utilities
│   └── content.config.ts           # content collection schemas
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Editing content

### Business info (phone, address, licenses, etc.)
Edit `src/lib/site.ts`. This is imported by every page, so changes propagate site-wide.

### Adding or editing a service
Create or edit a Markdown file in `src/content/services/`. Example:

```markdown
---
title: Boiler Repair
category: heating              # one of: plumbing | hvac | heating | cooling | water-heaters
order: 25                      # sort order within category
heroTagline: "Warm back fast."
shortDescription: "A one-sentence summary shown on the services index and card."
emergency: false               # true shows a 24/7 badge
signsYouNeed:                  # bullet list: "Call us if..."
  - "Loud banging from the boiler"
  - "No heat in some rooms"
whatWeDo:                      # bullet list: "Our approach"
  - "Full diagnostic"
  - "Pump and valve replacement"
seoTitle: "Boiler Repair Norwood MA | Dalelis"
seoDescription: "Fast boiler repair in Norwood, MA..."
---

Body copy goes here as standard Markdown. Shown in the "Overview" section of the service page.
```

The page will auto-generate at `/services/your-filename/`.

### Adding or editing a service area
Create a Markdown file in `src/content/service-areas/`:

```markdown
---
name: Needham
featured: true
intro: "One-paragraph intro shown on the town page."
---
```

Page auto-generates at `/service-area/needham/`.

### Adding a testimonial
Create a file in `src/content/testimonials/`:

```markdown
---
name: Jane Smith
rating: 5
source: Google
service: AC installation
featured: true
---

The review text goes here.
```

### Changing the color palette or typography
Edit the `@theme` block in `src/styles/global.css`. All components read from these CSS variables,
so changing the palette in one place updates the whole site.

---

## Deployment

### Cloudflare Pages
1. Push to GitHub.
2. Connect the repo in the Cloudflare Pages dashboard.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Node version: 20 or 22.

### Vercel / Netlify
Both auto-detect Astro. Build command: `npm run build`. Output directory: `dist`.

---

## SEO features built-in

- **Schema.org JSON-LD** — `HVACBusiness` + `Plumber` + `LocalBusiness` on every page, `Service` on service pages, `FAQPage` on the home page.
- **Sitemap** — auto-generated at `/sitemap-index.xml` via `@astrojs/sitemap`.
- **Open Graph + Twitter cards** — set per page via the `BaseLayout` props.
- **Canonical URLs** — set automatically.
- **Semantic HTML** — proper H1/H2 hierarchy, skip link, ARIA labels.
- **Fast images** — lazy-loaded, `loading="eager"` + `fetchpriority="high"` for hero only.

---

## Known TODOs

See `TODO.md` for a full list of placeholders that need real content (photos, copy edits, etc.)
before going live.

---

## License

All content and brand assets © James A. Dalelis Plumbing, Heating & Air Conditioning.
