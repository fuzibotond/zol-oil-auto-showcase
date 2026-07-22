# ZOL-OIL — Performance Report

**Date:** 2026-07-22
**Environment:** Local **production build** (`vite build`) — static/bundle analysis only.
**Runtime performance (Lighthouse / Core Web Vitals): NOT MEASURED** — see why below.

> Honesty: no Lighthouse run, no live page loads, no field data. Numbers below are **build
> artifacts** (real file sizes) and **code-review risk assessments**, not measured page metrics.
> Anything not reliably measurable is `Not measured`.

## Pages tested

Analysis is build-wide (shared bundle) plus per-route chunk sizes. No page was loaded in a
browser, so per-page runtime metrics are `Not measured`.

## Summary table

| Page | Performance score | LCP | INP/TBT | CLS | Page weight | Main issue |
|---|--:|--:|--:|--:|--:|---|
| Homepage | Not measured | Not measured | Not measured | Not measured | ~2.9 MB+ | **2.9 MB hero PNG** (`parc-auto.png`) |
| Inventory | Not measured | Not measured | Not measured | Not measured | Not measured | Depends on vehicle image sizes |
| Car detail | Not measured | Not measured | Not measured | Not measured | Not measured | Remote Unsplash placeholder; OG image sizes |
| About | Not measured | Not measured | Not measured | Not measured | Not measured | Section images (admin-controlled) |
| Contact | Not measured | Not measured | Not measured | Not measured | Not measured | Google Maps iframe (third-party) |
| Admin dashboard / car form | Not measured | Not measured | Not measured | Not measured | Not measured | Separate admin chunks (good) |

## Bundle analysis (measured — real `dist/` sizes)

- **Total client JS:** ~545 KB uncompressed across route-split chunks (≈150–175 KB gzipped, est.).
- **Largest chunk:** `index-*.js` **409 KB** (React + React-DOM + TanStack Router/Query/Start core).
- **Route code-splitting:** present and healthy — admin routes ship as separate chunks
  (`admin.*`, `AdminCarForm`, etc.) so public visitors don't download admin code.
- **CSS:** Tailwind v4, single stylesheet (small; exact size not captured).
- **Supabase removed:** the previously-bundled `@supabase/*` libraries (~800 KB across chunks) are
  gone from the build — a large, confirmed reduction.

## Best / worst

- **Best-performing (by weight):** admin routes and car-detail chunk (7–12 KB each) — good splitting.
- **Worst-performing:** **Homepage**, purely because of the **2.9 MB `parc-auto.png`** hero.

## Main bottlenecks

1. **Homepage hero PNG — 2.9 MB.** Single biggest, most certain performance problem. Convert to
   WebP/AVIF, resize to display size, add width/height. (BUG H-2)
2. **Main JS chunk 409 KB.** Baseline React-SPA cost. Acceptable but worth watching; ensure it's
   served with Brotli (Cloudflare default) and long-cache (already `immutable` for `/assets/*`).
3. **Third-party Google Maps iframe** on homepage + contact — external requests; already `loading="lazy"`.

## Image-performance findings

- `parc-auto.png` 2.9 MB (critical). 
- Car-detail **placeholder** is a remote Unsplash 1600px image — external + unoptimised (BUG L-7).
- R2-served images use `/img/<key>` with `Cache-Control: public, max-age=31536000, immutable` — good.
- Vehicle images: no server-side responsive variants (WebP/AVIF) generated — original is served.
  About-section images use `loading="lazy"` ✓; car gallery thumbnails are eager (small).

## JavaScript & CSS findings

- Good route-level splitting; no obviously duplicated large deps after Supabase removal.
- No render-blocking third-party scripts on public pages (no analytics/pixels present).
- Fonts: `Sora`/system fonts referenced inline; **font-loading strategy not measured**.

## API & database findings

- **No N+1**: `listCars` runs 1 query for cars + 1 batched (`IN (...)`) query for their images.
  `getCarBySlug` = 2 queries. Indexes exist on `status`, `is_featured`, `brand`, `created_at`,
  and `(car_id, sort_order)`.
- `listCars` has **no pagination** (caps at 200) — fine now, revisit as inventory grows (BUG L-8).
- Server functions lazy-import the repository (keeps it out of the client bundle) — good.

## Core Web Vitals risks (assessed, not measured)

- **LCP:** high risk on homepage due to the 2.9 MB hero.
- **CLS:** moderate — hero `<img>` and some images lack explicit width/height.
- **INP/TBT:** `Not measured`; SPA hydration cost is the main variable.

## Five highest-priority performance improvements

1. **Optimise the homepage hero** (`parc-auto.png` → resized WebP/AVIF, <300 KB, width/height set).
2. **Add explicit width/height** to hero and content images to prevent layout shift.
3. **Generate/serve WebP variants** for R2 vehicle images (or use `<picture>`).
4. **Bundle a small local placeholder** instead of the remote Unsplash image.
5. **Confirm Brotli + cache** on HTML/JS at the edge and add a tested CSP without hurting caching.

## Tests not performed because of Cloudflare cost / safety restrictions

- Lighthouse / Lighthouse CI runs against preview or production (would require a running deploy).
- Field Core Web Vitals (needs real traffic).
- Any load/stress testing.
- R2 image-transformation/variant benchmarking (would need Cloudflare Images — a paid feature).

**How to measure safely later:** run `npm run build && npm run preview`, then Lighthouse (Chrome
DevTools) against `http://localhost:<port>` for a local-production estimate; or run Lighthouse
against the `*.pages.dev` preview. Label results as local/preview, not production field data.
