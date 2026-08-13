# ZOL-OIL — Live Production Audit (dev deployment)

**Target:** https://zol-oil-auto-showcase.pages.dev/
**Date:** 2026-07-22 · **Method:** live HTTP requests + headless browser inspection of the
deployed site, plus repo build/bundle analysis. Single requests only — **no load testing**.
Branch: `main` (local == origin; all commits deployed).

Legend: ✅ pass · ⚠️ needs attention · 🔴 important · 🔧 fixed in this pass (deploys on next push).

---

## 1. Measurements & test results (with explanations)

### Reliability — mostly ✅ (the platform migration is working in production)
| Check | Result | Explanation |
|---|---|---|
| Site up | ✅ HTTP 200 | Homepage returns 200 from Cloudflare edge. |
| **D1 in production** | ✅ working | A real vehicle (Peugeot 208, 4.999 €) is served — the D1 binding + the `bindCloudflareEnv` bridge work live. This was the previously-unverified risk; **now confirmed**. |
| **R2 images** | ✅ working | Vehicle image served as `…/img/cars/<id>.webp` — R2 delivery works and images are already **WebP**. |
| SSR response time | ✅ **TTFB 125 ms**, total 126 ms | Edge-rendered HTML is fast (24 KB document). |
| Console errors | ✅ none | No JS errors on the homepage. |
| Legal pages | ✅ live | `/confidentialitate` returns 200 (16 KB SSR). |
| Sitemap | ✅ live | `/sitemap.xml` returns 200. |
| Automated tests | ⚠️ 0% | No test framework installed. |
| Backups | ⚠️ undocumented | D1 Time Travel exists (owner), but no written backup/restore runbook. |

### Security — good access control, but headers were missing
| Check | Result | Explanation |
|---|---|---|
| **Admin protection** | ✅ | `/admin` → **HTTP 302** to `…cloudflareaccess.com/cdn-cgi/access/login` — Cloudflare Access gates admin at the edge (verified live). |
| HTTPS | ✅ | Served over HTTPS via Cloudflare. |
| **Security headers on HTML** | 🔴→🔧 | Measured: the HTML response had **no** `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` / `Permissions-Policy`. Cause: Pages `_headers` only covers **static assets**, not Worker/SSR responses. **Fixed** in `src/server.ts` (now sets them on every Worker response). |
| **HSTS** | 🔴→🔧 | `Strict-Transport-Security` was absent. **Fixed** (`max-age=15552000`); also enable at the zone. |
| SQL injection | ✅ | All D1 queries are parameterised (`.bind()`). |
| XSS | ✅ | React escaping; the only `dangerouslySetInnerHTML` is JSON-LD (escapes `<`); legal/about bodies are plain text. |
| File upload | ✅ | Magic-byte validation + size limit + non-guessable keys. |
| Lead-form abuse | ⚠️ | Honeypot only — **no rate limit / CAPTCHA**. |
| `/api/upload` CSRF | ⚠️ | No Origin/Referer check; relies on the Access cookie. |
| Secrets | ✅ | None in the client bundle or repo (`.dev.vars`/`.env*` gitignored). |

### Performance — fast HTML, one very heavy image
| Metric | Measured | Explanation |
|---|---|---|
| Homepage HTML | ✅ 24 KB, TTFB 125 ms | Excellent edge SSR. |
| **Hero `parc-auto.png`** | 🔴→🔧(partial) | **3,005,269 B (2.9 MB)**, and was served **`Cache-Control: max-age=0`** (re-fetched every visit). Dominates LCP/page weight. **Cache fixed** (`_headers`); **the size still needs a resized WebP/AVIF** (≤300 KB) — code can't shrink the binary. |
| Vehicle images | ✅ WebP via R2 | Good format + immutable cache. |
| Client JS (build) | ⚠️ ~545 KB total, 409 KB main chunk | Baseline React SPA; route-split (admin code separate). |
| Image dimensions | ⚠️ | Hero + car images have **no width/height** → layout-shift (CLS) risk. |
| Mobile 375 px | ✅ no horizontal scroll | Responsive layout holds. |
| Lighthouse/CWV score | Not run | Real sizes/timings measured instead; a full Lighthouse pass on preview is recommended. |

### Legal (Romania) — framework in place, content + claims need owner/lawyer
| Check | Result | Explanation |
|---|---|---|
| Privacy / cookie / terms pages | ✅ live | Reachable + linked in footer + sitemap; lead form links to the privacy policy. |
| Legal text status | ⚠️ | Marked `needs_review = 1` — **template text; must be reviewed by a RO professional**. |
| Company identification | ⚠️ | Seeded from zoloil.ro (SC Prod Com "Zol-Oil" SRL, CUI RO 6604723, J14/993/1994) and shown in footer/About where filled — but **unverified** (owner must confirm; email + VAT status missing). |
| ANPC link | ✅ | Present (SOL/ODR correctly **omitted** — obsolete). |
| Cookie consent | ✅ | Banner now states only necessary cookies; no analytics/trackers were found, so this is accurate. |
| **Marketing claims** | ⚠️ | Homepage hardcodes **"50+ mașini"**, **"10+ ani experiență"**, **"100% verificate tehnic"**. "10+ ani" is defensible (est. 1994), but "50+" and "100% verificate" are **unverifiable claims** — a misleading-commercial-practice risk (ANPC). Owner should confirm, soften, or make editable. |

---

## 2. Fix & optimisation plan (prioritised for a small dealership)

### P0 — before promoting the site
1. **Deploy the security-header fix** (this commit) and verify: `curl -I https://<domain>/` shows the four headers + HSTS. *(code done)*
2. **Legal review + data verification** — RO professional reviews the 3 legal pages (then untick "needs review"); owner confirms company data in **Admin → Companie** and adds official email + VAT status.
3. **Fix the hero image** — export `parc-auto.png` as a resized WebP/AVIF (≤300 KB) and set explicit `width`/`height`. Biggest single perf + CLS win. *(cache already fixed)*
4. **Review marketing claims** — confirm or soften "50+"/"100% verificate tehnic", or make them editable in admin so they’re owner-owned and accurate.

### P1 — soon after launch
5. **Lead-form protection** — add Cloudflare **Turnstile** (free) + a WAF rate-limit rule on the server-fn path (dashboard).
6. **`/api/upload`** — check `Origin`/`Referer` (or require the `Cf-Access-Jwt-Assertion` header).
7. **SEO** — absolute `og:url`/`og:image` (via `VITE_SITE_URL`); add homepage **LocalBusiness/AutoDealer** JSON-LD and **Vehicle** schema on car pages; add a `Sitemap:` line to `robots.txt`.
8. **CLS** — set `width`/`height` on all `<img>` (hero, gallery, cards).

### P2 — hardening & polish
9. **Content-Security-Policy** — add and test against the Google Maps iframe + inline styles.
10. **Automated tests (Vitest)** — auth allowlist, `detectImage`, Zod schemas, repository mappers.
11. **Backup/restore runbook** — document D1 Time Travel + periodic `wrangler d1 export`; R2 lifecycle.
12. **Inventory pagination** — add before the catalogue grows large (`listCars` currently caps at 200).
13. **HSTS at the zone** + consider a custom domain (updates Access app domain, `VITE_SITE_URL`, R2 image domain).

---

## 3. Cost-safety
Only single HTTP requests + one browser session were used. No load/stress tests, no new Cloudflare
resources, no paid features, no emails sent, no bulk writes. Admin was not entered (it is Access-gated).
