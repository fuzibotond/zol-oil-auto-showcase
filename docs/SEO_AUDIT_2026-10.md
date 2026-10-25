# ZOL-OIL — Production audit: SEO, performance, accessibility, conversion (2026-10-25)

Scope: repository `zol-oil-auto-showcase` (working tree incl. the previously uncommitted SEO
work) and the live site `https://www.zoloil.ro`. Nothing was deployed; no DNS / Cloudflare /
GTM / GA4 settings and no production data (D1/R2) were changed.

Legend: **PASS** verified working · **ISSUE** exists but wrong · **MISSING** · **MANUAL**
needs manual verification · **N/A**. "Verified in prod" = observed with real HTTP requests
against production; "code" = found by reading the source.

## 1. Architecture (verified)

| Area | Finding |
|---|---|
| Framework | React 19 + TanStack Start 1.167 / Router 1.168, Vite 7, Tailwind 4 (Lovable template) |
| Rendering | **SSR** on Cloudflare Pages Functions (nitro `cloudflare-pages` preset) + client hydration |
| Routing | File routes in `src/routes` (`routeTree.gen.ts` is generated at build) |
| Data | Cloudflare **D1** (`DB`) via `src/lib/db/repository.ts`; server functions in `src/lib/api/*` |
| Images | Cloudflare **R2** (`R2`), served same-origin by `src/routes/img.$.ts` (`/img/<key>`, 1-year immutable) |
| Admin / auth | `/admin/*` UI; Cloudflare **Access** JWT verified server-side (`src/lib/auth/access.ts`, RS256 + AUD + exp + allowlist) |
| SEO | `src/lib/seo.tsx` (head + JSON-LD builders), dynamic `robots.txt` / `sitemap.xml` routes |
| Analytics | GTM only (`VITE_GTM_ID=GTM-K7TXVR2Q`), Consent Mode v2 defaults *denied*; GA4 `G-YEBSSS708Q` lives inside GTM |
| Consent | `src/components/site/CookieConsent.tsx` + `src/lib/consent.ts` |
| Leads | `submitLead` → D1 `leads` + email via `zol-oil-mailer` Worker (Email Routing) |
| Tests | none before this audit → added `scripts/seo-smoke.mjs` (`npm run test:smoke`) |

## 2. Audit matrix

| Feature | Status (before) | Evidence | Problem | Prio | Action / status now |
|---|---|---|---|---|---|
| Contact NAP in server HTML | ISSUE (verified in prod) | `curl https://www.zoloil.ro/` contains `0700 000 000` ×4, `0700000000` ×3; `useSiteSettings` only fetched client-side | Crawlers + no-JS users saw the template placeholder phone; the real number (0744 818 846) appeared only after hydration | P0 | **Fixed**: root loader loads settings + company info on the server, hooks seed from it (`src/routes/__root.tsx`, `src/hooks/use-site-settings.ts`, `use-company-info.ts`) |
| www vs apex | ISSUE (verified in prod) | `https://zoloil.ro/` and `https://www.zoloil.ro/` both **200** with identical HTML | Duplicate hosts; signals split | P0 | **Fixed in code**: 301 to the `VITE_SITE_URL` host (`src/server.ts` `canonicalHostRedirect`). Edge rule recommended too (manual) |
| Canonical host decision | **DECIDED 2026-10-25: `https://zoloil.ro`** | prod `robots.txt`/`sitemap.xml` still use `https://www.zoloil.ro` (old prod build env); repo `.env`, examples, `wrangler.toml` notes and Cloudflare Access use the apex | Prod build env still on www | P0 | Owner changes `VITE_SITE_URL` in Pages to `https://zoloil.ro` and redeploys (§5.1) — then the Worker 301s www → apex |
| HTTP→HTTPS | PASS (verified) | `http://zoloil.ro/` → 301 `https://zoloil.ro/`; same for www; single hop | — | — | — |
| Canonical tags | ISSUE (verified in prod) | prod `<link rel="canonical" href="/">`, `og:url="/"` (relative) | Relative canonical/og:url | P0 | **Fixed** (uncommitted `seoHead()` + `VITE_SITE_URL`): absolute everywhere; Lighthouse "canonical" audit failed before |
| Titles / descriptions | ISSUE | prod car title had no unique pattern | — | P1 | **Fixed**: `carTitle()` → `[Marcă] [Model] [Versiune] [An] – [Combustibil] | ZOL-OIL Cernat`; sold cars prefixed `Vândut:` |
| H1 | ISSUE | homepage H1 was just "ZOL-OIL." | Non-descriptive | P2 | **Fixed**: H1 now "Parc auto second-hand · Cernat, Covasna ZOL-OIL." (same visual) |
| robots.txt | PASS (verified) | 200, `Disallow: /admin`, `/auth`, Sitemap line | — | — | Also `X-Robots-Tag: noindex` on `/admin` + `/auth` responses |
| sitemap.xml | ISSUE (verified in prod) | 53 URLs incl. **18 sold cars**; `lastmod` on cars only | Sold/unavailable URLs listed | P1 | **Fixed**: sold excluded, landing pages only with unsold stock, image sitemap, no fake `lastmod` |
| Structured data | MISSING (verified in prod) | prod homepage: 0 JSON-LD blocks; About had hand-made JSON-LD with **placeholder phone** and relative URL | — | P1 | **Fixed**: `AutoDealer` (real NAP only, postal code parsed, `hasMap`, legalName only if verified), `WebSite`, `BreadcrumbList`, `ItemList`, `Car`+`Offer` (`nou-sosit` now InStock, sold → SoldOut) |
| Vehicle page crawlability | ISSUE (code) | description + equipment were rendered only after clicking a tab; similar cars fetched client-side | Core content/internal links missing from HTML | P1 | **Fixed**: ARIA tabs with all panels in HTML (`hidden`), similar cars in the loader |
| Sold vehicles | ISSUE (verified) | sold cars mixed into listing/homepage; detail page still said "Sună acum / Sunt interesat"; `InStock`-like UX | Misleading inquiry promise | P1 | **Fixed**: banner "Această mașină a fost vândută", CTAs ask for a similar car, alternatives (same brand first), `noindex,follow`, out of sitemap; hidden by default on `/masini` (toggle "Arată și mașinile vândute") |
| Legacy URLs | ISSUE (verified) | Wayback shows ~300 old URLs `/<id>/<slug>.html`, `index.php?nr=`, `index.php?cat=…`, `/oferta`; all returned plain 404 | — | P2 | **Fixed** (`src/server.ts`): section URLs 301 to `/`, `/masini`, `/contact`; old car adverts **410 Gone** (no equivalent cars; not redirected to home) |
| Doorway pages | ISSUE (uncommitted code) | `/masini/zona/{covasna,sfantu-gheorghe,targu-secuiesc,brasov}` listed the *same* stock with a swapped intro, plus unverifiable distance claims | Doorway pages | P1 | **Removed** (never deployed). Local relevance moved to real home/contact copy |
| Price landing pages | ISSUE | 7 overlapping bands; copy claimed "prețurile pot fi negociate" | Near-duplicates + unverified claim | P2 | Reduced to 4 bands; claim removed |
| Placeholder images | ISSUE (code) | car without photos showed an Unsplash stock car | Misleading | P2 | Neutral "Fotografii în curând" placeholder |
| Hidden cars via API | ISSUE (security, code) | public `listCars` passed client input straight to the repo → `{includeHidden:true}` exposed hidden cars | Data exposure | P1 | **Fixed**: options whitelisted (`src/lib/api/cars.functions.ts`) |
| Admin edge protection | ISSUE (verified in prod) | `zoloil.ro/admin` → 302 Access login; **`www.zoloil.ro/admin` → 200** (UI shell; server fns still reject without a valid Access JWT) | Defence-in-depth gap | P1 | Manual: add `www.zoloil.ro/admin*` to the Access app (§5). Code adds `X-Robots-Tag` |
| Hero image | ISSUE (verified) | `/parc-auto.png` **2.93 MB**, LCP element, preloaded | Mobile LCP 28.6 s | P0 | **Fixed**: AVIF/WebP 480–1440w (18–156 KB), `fetchpriority=high`, 1200×630 `og-image.jpg` (146 KB) |
| Car photos | ISSUE (verified) | originals stored as uploaded: 250 KB … **6.3 MB** each; listing page 13–19 MB | — | P0 | Code: future uploads downscaled in the browser (≤1920 px JPEG q0.82); thumbnails lazy; first card eager. **Existing** photos need Cloudflare Image Transformations (manual switch, then `VITE_IMAGE_RESIZING=cloudflare`) |
| Fonts | ISSUE (verified) | render-blocking `fonts.googleapis.com` CSS (Lighthouse: 0.5–1.5 s); visitor IP sent to Google | Perf + GDPR | P1 | **Fixed**: self-hosted Inter/Sora variable woff2 subset to Latin + Romanian/Hungarian glyphs (2 files, 73 KB, preloaded) |
| Caching | PASS/ISSUE | `/assets/*` immutable ✓; R2 images immutable ✓; root PNGs 30 d | new static files needed headers | — | `/hero/*`, `/og-image.jpg` 30 d; `/fonts/*` 1 y immutable |
| Compression | PASS (verified) | `content-encoding: br` on JS/CSS | — | — | — |
| Accessibility | ISSUE (Lighthouse) | colour-contrast (24 nodes home), `label` (lead form), `select-name` (sort), `target-size` (footer) | — | P1 | **Fixed**: accent darkened (L .55→.50), orange small text `#B93D0B`, dark text on orange buttons, labelled inputs/selects, footer targets ≥24 px, skip link, focus ring, `aria-expanded` menus, ARIA tabs, reduced-motion CSS |
| Lead form | ISSUE (code) | no `<label for>`; server Zod JSON shown verbatim in toast; no autocomplete | — | P1 | **Fixed**: labels, inline Romanian validation, `aria-invalid`, autocomplete, `role=alert`; `generate_lead` still only after server success |
| Analytics events | PASS/ISSUE | `car_view`, `contact_click`, `filter_used`, `generate_lead` exist; header/footer/about/maps clicks untracked | Gaps | P2 | Tracking added to header, footer, About, home map/Waze, contact FAQ. No PII in any event |
| Consent | PASS (code) / MANUAL | Consent Mode v2 default denied, banner, re-open link | **Cookie policy text says no analytics cookies are used** while GA4 + Meta run via GTM after consent | P1 | Owner/legal must update `/politica-cookie` in admin (§5) |
| About page copy | ISSUE (verified in prod) | section "Our Goals — Sell reliable cars for people..." (English placeholder) | Unfinished copy on indexed page | P0 | Owner: edit/unpublish in `/admin/despre` (data, not code) |
| Legal pages | ISSUE (verified in prod) | Markdown shown raw (`* numele;`, `[email](mailto:…)`); phone **0267 360 662** and **0757 760 546** vs site phone 0744 818 846 | — | P1 | Renderer fixed (lists + safe links). Phone numbers: owner confirmation (§5) |
| Slugs | ISSUE (verified in prod) | e.g. `/masini/volkswagen-jetta-2021` for a 2009 car (slug froze on default year) | Misleading URLs | P2 | Fixed for new cars (slug follows brand/model/year until edited). Existing slugs kept (changing them breaks URLs) |
| Tests | MISSING | — | — | P2 | `scripts/seo-smoke.mjs` (robots, sitemap, canonicals, titles, JSON-LD, status codes, placeholder NAP) |

## 3. Performance — measured

Production baseline (Lighthouse 12.8.2, simulated throttling, this machine, 2026-10-25):

| Page (prod) | Perf | FCP | LCP | SI | TBT | CLS | Weight |
|---|---|---|---|---|---|---|---|
| Home – mobile | 63 | 4.65 s | 28.58 s | 4.65 s | 39 ms | 0.004 | 15.3 MB |
| Home – desktop | 79 | 0.96 s | 3.73 s | 0.96 s | 0 ms | 0.033 | 15.4 MB |
| /masini – mobile | 73 | 2.40 s | 7.62 s | 2.40 s | 32 ms | 0.005 | 13.1 MB |
| Car – mobile | 65 | 4.15 s | 11.57 s | 4.25 s | 19 ms | 0.000 | 2.5 MB |
| Car – desktop | 90 | 1.06 s | 1.86 s | 1.06 s | 0 ms | 0.001 | 2.6 MB |

Before/after under identical conditions (both builds served locally by `wrangler pages dev`,
same D1 data, same Lighthouse settings; local R2 is empty so **car photos are not part of
this comparison**):

Mobile (median of 3 runs each):

| Page | Perf before → after | FCP | LCP | CLS | Transfer |
|---|---|---|---|---|---|
| Home | 82 → **93** | 3.20 → **2.12 s** | 3.85 → **2.87 s** | 0.012 → 0 | 4.05 MB → **0.60 MB** |
| /masini | 87 → **94** ¹ | 2.14 → 2.13 s | 3.75 → **2.73 s** | 0.038 → 0 | 0.78 → 0.60 MB |
| Car detail | 80 → **87** | 3.61 → **2.27 s** | 3.96 → **3.66 s** | 0.001 → 0 | 0.76 → 0.59 MB |
| Contact | 89 → **95** | 2.12 → **1.97 s** | 3.43 → **2.72 s** | 0.012 → 0 | 1.18 → 1.11 MB |

Desktop after: Home 100, /masini 99, Car 98, Contact 99 (before: 99 / 98 / 97 / 98).
Accessibility 88–92 → **98–100**; SEO 92 → **100** (canonical now absolute); Best practices
unchanged (96 locally only because local R2 images 404).

¹ single "before" run. TBT stayed ~20 ms everywhere (JS was never the bottleneck).

What drove it: hero 2.93 MB PNG → 18–156 KB AVIF/WebP with `fetchpriority=high`; Google
Fonts CSS removed; fonts subset to Latin + Romanian/Hungarian glyphs (171 KB in 4 files → 73 KB
in 2, preloaded — removing the preload was tested and made FCP worse, ~3.2 s); reserved image
dimensions (CLS 0).

**Not yet captured**: in production the dominant mobile cost on `/masini` and the homepage car
grid is the original car photos (up to 6.3 MB each). That needs the Cloudflare Image
Transformations switch (§5.4). Expect production numbers to differ from these local runs;
re-measure after deploy with PageSpeed Insights (lab + field/CrUX).

## 4. Changes made (files)

See the PR/commit description; summary by area:

- **Server/SEO infrastructure**: `src/server.ts` (canonical-host 301, legacy 301/410, admin `X-Robots-Tag`), `src/lib/seo.tsx`, `src/routes/sitemap[.]xml.ts`, `src/lib/landing.ts`, `src/lib/landing-route.tsx`, removed `src/routes/masini.zona.$zona.tsx`.
- **SSR data**: `src/routes/__root.tsx` (loader), `src/hooks/use-site-settings.ts`, `src/hooks/use-company-info.ts`.
- **Inventory**: `src/lib/db/repository.ts` (sold-last ordering, `availableOnly`, better alternatives), `src/lib/api/cars.functions.ts` (option whitelist), `src/routes/masini.$slug.tsx`, `src/routes/masini.index.tsx`, `src/components/site/CarCard.tsx`, `src/components/site/CollectionView.tsx`.
- **Pages**: `src/routes/index.tsx`, `src/routes/contact.tsx` (FAQ), `src/routes/despre-noi.tsx`, legal routes, `src/components/site/LegalArticle.tsx`.
- **UX/a11y**: `src/components/site/{Header,Footer,LeadForm,ContactButtons}.tsx`, `src/styles.css`.
- **Performance**: `public/hero/*`, `public/og-image.jpg`, `public/fonts/*`, `public/_headers`, `src/lib/images/{responsive,client-resize}.ts`, admin uploaders.
- **Tests/tooling**: `scripts/seo-smoke.mjs`, `npm run test:smoke`, `.claude/launch.json`.

## 5. Manual action list (owner)

### Domain / Cloudflare — canonical host is **`https://zoloil.ro`** (non-www)
1. **Pages build variable.** Cloudflare dashboard → Workers & Pages → project **zol-oil** →
   Settings → *Variables and Secrets* → **Production** environment:
   - `VITE_SITE_URL` = `https://zoloil.ro` (exactly: https, no `www`, **no trailing slash**),
     type *Text* (not *Secret* — Vite must read it at build time). Edit the existing value
     (`https://www.zoloil.ro`); don't add a second one.
   - If the page says variables are *managed by wrangler.toml*, instead add
     `VITE_SITE_URL = "https://zoloil.ro"` under `[vars]` in `wrangler.toml` (next to
     `VITE_GTM_ID`) and commit.
   - Preview environment: leave it unset (previews then keep relative URLs and are not
     redirected), or set it to the preview URL — never to `https://zoloil.ro`.
   - Save, then **Deployments → latest production deployment → Retry deployment** (or push a
     commit). The variable is inlined at build time, so a rebuild is required.
2. **Custom domains** (same project → Custom domains): keep **both** `zoloil.ro` and
   `www.zoloil.ro` attached and *Active* — www must keep resolving so it can redirect.
3. **Edge redirect (recommended).** Zone `zoloil.ro` → Rules → *Redirect Rules* → Create rule
   "www to apex": *Custom filter* `Hostname equals www.zoloil.ro` → *Dynamic* redirect,
   expression `concat("https://zoloil.ro", http.request.uri.path)`, status **301**,
   *Preserve query string* ✓. (After step 1 the Worker already 301s www → apex for pages;
   the edge rule also covers static files and costs no Worker invocation.)
4. **Cloudflare Access**: the app already protects `zoloil.ro/admin`. After steps 1/3, `www`
   requests are redirected to the apex before reaching the admin, but add
   `www.zoloil.ro` / path `admin` as an extra application domain anyway (defence in depth).
5. **Verify** after deploy:
   - `curl -I https://www.zoloil.ro/masini` → `301` with `location: https://zoloil.ro/masini`
   - `curl -s https://zoloil.ro/robots.txt` → `Sitemap: https://zoloil.ro/sitemap.xml`
   - `npm run test:smoke -- https://zoloil.ro --canonical https://zoloil.ro` → all checks pass.
6. Optional but recommended: **Images → Transformations → Enable** for `zoloil.ro`, then set
   build var `VITE_IMAGE_RESIZING=cloudflare` and redeploy. Existing 3–6 MB car photos are then
   served as ~30–150 KB WebP/AVIF. Free plan: 5,000 unique transformations/month (≈ cars × photos × 3 widths).
7. Email obfuscation (Scrape Shield) rewrites e-mail addresses in HTML; fine for users with JS.

### Content in `/admin` (data — not changed by this work)
8. `/admin/despre`: replace or unpublish the English placeholder section "Our Goals — Sell reliable cars for people...".
9. `/admin/legal`: confirm the phone numbers in *Confidențialitate* (0267 360 662) and
   *Termeni* (0267 360 662, 0757 760 546) vs the site phone **0744 818 846**; update the
   **cookie policy** — it says no analytics/marketing cookies are used, but GA4 and the Meta
   Pixel run through GTM after consent.
10. `/admin/companie`: verify legal name / CUI / Reg. Com. / addresses and tick them as verified
   (the legal name then appears in structured data).
11. `/admin/setari`: confirm phone, WhatsApp, e-mail, address, opening hours and the Google
   Maps / Waze links (Maps link points to `maps.app.goo.gl/m1pA48ndqLf53R618`, Waze to a text
   search for "Cernat Covasna" — consider a pin link to the exact lot).
12. Check car **years** vs slugs (several slugs end in `-2021` for older cars). Fixing a slug
    changes the URL — only do it for cars not yet indexed, or ask for a redirect feature.
13. Mark sold cars as *Vândut* promptly; hide (not delete) cars that should disappear entirely.

### Claims needing confirmation (shown on the site today)
- "Verificate tehnic (la achiziție)" / "Mașini verificate tehnic" (home, landing pages).
- "Din 1994 — Experiență" (based on Reg. Com. J14/993/1994).
- "Postăm constant mașini noi pe Marketplace" (home Facebook block).
- "aproape de Târgu Secuiesc" and test-drive wording (home, contact FAQ) — added copy, please confirm.

### Google Search Console
14. Add a **Domain property** for `zoloil.ro` (DNS TXT in Cloudflare; it covers www and apex).
    Submit `https://zoloil.ro/sitemap.xml` (remove any old `https://www.zoloil.ro/sitemap.xml`
    submission). Inspect `/`, `/masini` and 2–3 car URLs → *Request indexing*.
15. Watch *Pages → Not indexed*: old `/<id>/*.html` URLs should move to "Not found (404/410)".
    Do not use the Removals tool for them.

### Google Business Profile
16. Ensure name, address (661, DN11, 527070 Cernat), phone and hours match the website exactly;
    website URL = `https://zoloil.ro`; category "Dealer auto second-hand" (Used car dealer); add
    photos of the lot; link the Maps pin used in `/admin/setari`.

### Google Analytics / GTM
17. In GTM create **Custom Event** triggers + GA4 event tags for `generate_lead`,
    `contact_click` (param `contact_method`, `context`, `car_id`), `car_view`, `filter_used`;
    mark `generate_lead` and `contact_click` as **key events** in GA4. Verify in GTM Preview
    that tags fire only after "Accept toate". (Not verified end-to-end — no GTM access.)

### Social / marketplaces
18. Link every Autovit/OLX/Facebook listing to the matching `/masini/<slug>` page; keep the
    same phone number everywhere.

## 6. Risks / not verified

- Not deployed: no production measurement after the changes; local A/B excludes car photos.
- Canonical-host 301 follows `VITE_SITE_URL`: until the Pages variable is changed to
  `https://zoloil.ro`, a deploy would still redirect apex → **www** (the old value). Change the
  variable before/with the deploy, then run the §5.5 checks.
- Sold cars become `noindex`: intended; if the owner prefers keeping them indexed, flip
  `noindex` in `src/routes/masini.$slug.tsx`.
- GA4/Meta events and lead e-mails were not tested end-to-end (no account access).
- Existing large car photos stay large until Image Transformations are enabled.
