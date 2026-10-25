# ZOL-OIL — Google Search Console indexing audit (2026-10-25)

Search Console snapshot supplied by the owner: 66 indexed, 65 not indexed — 34 *Not found
(404), validation failed*, 23 *Discovered – currently not indexed*, 5 *Crawled – currently
not indexed*, 2 *Page with redirect*, 1 *Duplicate, Google chose different canonical*.

**No URL export was provided**, so the mapping of GSC buckets to URLs below is *inferred*
from live HTTP tests, the Wayback Machine URL history and the code. Each row says whether
the problem was **verified** (reproduced with a real request) or **inferred**. Passing tests
do not mean Google will index a page — that remains Google's decision.

## State of production at audit time

`https://zoloil.ro` still runs the build **before PR #4**: the #4 deploy failed with
`Binding name 'VITE_SITE_URL' already in use` (fix: delete the dashboard copy of the
variable, see PR #5). So several problems below are already fixed in `main` but not live.

Production measurements (2026-10-25, `curl`):

| Request | Result |
|---|---|
| `http://zoloil.ro/`, `http://www.zoloil.ro/` | 301 → https ✓ |
| `https://www.zoloil.ro/` and `https://zoloil.ro/` | **both 200** (duplicate host) |
| `https://zoloil.ro/masini/` | **307** (temporary) → `/masini` |
| `https://zoloil.ro/MASINI` | **200** (duplicate URL; canonical points to `/masini`) |
| `https://zoloil.ro/masini?sort=price` | 200, canonical `/masini` ✓ (no parameter explosion — filters are client state, not URLs) |
| `/1618/opel-astra-1-6i-twin-top.html`, `/index.php?nr=101`, `/oferta` | 404 |
| `/masini/<unknown slug>` | 404 ✓ (no soft 404) |
| `sitemap.xml` | 53 URLs on `https://www.zoloil.ro`, **all 53 return 200**; includes **18 sold cars** |
| Car data (serialized in each page) | 46 cars: 22 disponibil, 4 în curând, 1 nou sosit, 1 rezervat, 18 vândut; **all 46 have `description: null`**; equipment lists exist but were only rendered after a tab click |

## Findings

| # | Issue | Sev. | Routes / files | Evidence (how to reproduce) | Root cause | Fix | Verification |
|---|---|---|---|---|---|---|---|
| 1 | **34 "Not found (404)" are old-site URLs** — *inferred* | Info | `/<id>/<slug>.html`, `index.php?nr=…`, `index.php?cat=…`, `/oferta` | Wayback CDX lists ~307 such URLs on `zoloil.ro`; all answer 404 today | Previous PHP site's car adverts (cars sold years ago) | Already in #4: section URLs **301** to `/`, `/masini`, `/contact`; adverts **410 Gone** (`src/server.ts`). Not redirected to the homepage (would be soft 404s) | Local: smoke test `410`/`301` ✓. Live after deploy |
| 2 | "Validation failed" on those 404s — *expected* | Info | — | Validation asks Google to confirm the URLs now work; they correctly don't | Not a defect | None — **don't validate** this bucket; 404/410 URLs drop out by themselves | — |
| 3 | www and apex both 200 — **verified** | High | all | see table | No host redirect; old build had relative canonicals (`href="/"`) | Already in #4: 301 www → `https://zoloil.ro`, absolute canonicals. Likely source of the **1 "Duplicate, Google chose different canonical"** — *inferred* | Local ✓; live after deploy |
| 4 | Trailing slash answered with **307** — **verified** | Medium | `/masini/` and any `/<path>/` | `curl -I https://zoloil.ro/masini/` → 307 | Router's default trailing-slash redirect is temporary | **New**: 301 to the no-slash path before routing (`src/server.ts` `normalizedPath`). Likely part of the **2 "Page with redirect"** (with `http://` variants) — *inferred*; those entries are fine once permanent | Local: `/masini/` → 301 `/masini` ✓ |
| 5 | Uppercase paths answer **200** — **verified** | Low | `/MASINI`, `/Contact` | `curl -I https://zoloil.ro/MASINI` → 200 | Case-insensitive routing | **New**: 301 to lowercase (percent-escapes untouched; `/img`, `/assets`, `/_serverFn`, `/api` excluded) | Local: `/MASINI` → 301, `/Contact/` → 301 `/contact` ✓ |
| 6 | Sold cars in sitemap — **verified** | Medium | `sitemap.xml`, car pages | 18 sold cars listed | Sitemap listed every visible car | Already in #4: sold pages stay 200 (shared links, history) but `noindex,follow`, `SoldOut`, alternatives, and leave the sitemap. Decision: sold pages have no description, only specs/photos → low search value; the index should show buyable cars | Local: sold car `noindex`, not in sitemap ✓ |
| 7 | Thin vehicle pages — **verified** | High | `/masini/<slug>` | All 46 cars `description: null`; equipment hidden behind a tab in the old build | Old build rendered only the "Specificații" tab server-side; no free-text descriptions in the data | Already in #4: description + equipment + alternatives in the server HTML. **Owner action**: write a short original description per car (state, history, service, why this car) — likely the main reason for **5 "Crawled – not indexed"** and part of **23 "Discovered – not indexed"** — *inferred* | Local: panels present in HTML ✓ |
| 8 | Unknown brand slugs render a 200 "no stock" page — **verified in code** | Medium | `/masini/marca/<anything>` (in `main`, not yet live) | `landingLoader` accepted any slug | Brand facet built from the URL | **New**: 404 unless some car (any status) has that brand (`src/lib/landing-route.tsx`) | Local: `/masini/marca/marca-inexistenta` → 404, `/masini/marca/opel` → 200 ✓ |
| 9 | Links to empty (noindex) categories — **verified in code** | Low | homepage, landing "Caută și după" | Home linked all 5 fuels (GPL/Hibrid/Electric have no stock) | Static category lists | **New**: `facetStock()` — home, listing, landing pages and sitemap link/list only categories with unsold stock. Home uses one light query (`availableCarFacets`, no image rows) replacing the count query | Local: 20 category links, all in sitemap ✓ |
| 10 | Identical photo alt texts — **verified** | Low | car gallery | Every photo `alt="Seat Leon"` (admin default) | Admin pre-fills `Brand Model` | **New**: default alt treated as empty → "BMW 520d … 2006 Diesel Automată — fotografia 1 din 8" | Local ✓ |
| 11 | Slug years don't match car years — **verified** | Low | e.g. `/masini/skoda-yeti-2021` is a 2010 car | sitemap vs data | Old admin slug froze on the default year (fixed for new cars in #4) | **Not changed** — URLs are live/indexed; changing them needs a redirect table. Recommend leaving them | — |
| 12 | robots.txt | OK | `robots.txt` | Allows everything except `/admin`, `/auth`, `/api`; assets/images/fonts not blocked | — | — | ✓ |
| 13 | Orphans / discovery | OK | `/masini` | Listing is server-rendered with **all** unsold cars as `<a href>` links; no pagination | — | Smoke test now asserts every sitemap car is linked from `/masini` | Local ✓ |
| 14 | Rendering | OK (after #4) | all | SSR HTML contains title, H1, specs, price, JSON-LD; TBT ~20 ms | — | — | Lighthouse (local) mobile 87–95 |

"Discovered – currently not indexed" (23) is most likely the newly published car pages
(Google knows the URLs but hasn't crawled them yet); with the host split and thin content
fixed, these usually move over weeks. Not a code defect by itself — *inferred*.

## Files changed in this round

`src/server.ts` (trailing slash / lowercase 301), `src/lib/landing.ts` (`facetStock`,
`relatedFacetLinks` takes stock), `src/lib/landing-route.tsx` (unknown brand → 404, related
links from stock), `src/lib/db/repository.ts` (`availableCarFacets`),
`src/lib/api/cars.functions.ts` (`availableStockSummary`), `src/routes/index.tsx`,
`src/routes/masini.index.tsx`, `src/routes/sitemap[.]xml.ts`, `src/routes/masini.$slug.tsx`
(alt text), `scripts/seo-smoke.mjs` (new checks).

Tests: `tsc --noEmit` ✓, `npm run build` ✓, ESLint (changed files) 0 errors,
`npm run test:smoke -- http://localhost:8788 --canonical https://zoloil.ro` → all checks
pass (wrangler pages dev, local D1).

## Manual actions in Google Search Console (after the deploy succeeds)

1. Confirm the live site: `curl -I https://www.zoloil.ro/masini` → 301 to
   `https://zoloil.ro/masini`, and run `npm run test:smoke -- https://zoloil.ro --canonical https://zoloil.ro`.
2. Use a **Domain property** (`zoloil.ro`). *Sitemaps*: remove `https://www.zoloil.ro/sitemap.xml`,
   submit `https://zoloil.ro/sitemap.xml`.
3. **Not found (404)**: export the list. Old `/<id>/*.html` and `index.php` URLs → do nothing
   (they now return 410 and will drop). Do not click *Validate fix*. If any **current**
   `/masini/<slug>` appears, tell us — that would be a real broken link.
4. **Page with redirect**: http:// and www URLs are expected here. No action.
5. **Duplicate, Google chose different canonical**: inspect the URL; if it's a www or
   trailing-slash variant, no action — it resolves after the 301s.
6. **Discovered / Crawled – not indexed**: URL-inspect 3–5 available cars → *Request indexing*
   (daily quota is small; prioritise newest stock). Add a real description to each car in
   `/admin` first — that is the biggest lever we can control.
7. Expect sold cars to move to *Excluded by 'noindex' tag* — intended.
8. Re-check *Pages* and *Core Web Vitals* reports in 2–4 weeks; GSC data lags.
