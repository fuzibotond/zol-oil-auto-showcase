# ZOL-OIL — Bug & Findings Report

**Date:** 2026-07-22 · Source: static analysis + code review + build/bundle analysis.
Severity: Critical / High / Medium / Low. Status: Open / Fixed.

> No **Critical** (security breach / data loss / unauthorized admin) issues were found.

---

## High

### H-1 · Missing legal/GDPR pages (privacy, cookie, terms)
- **Severity:** High · **Priority:** P0 for public promotion
- **Component:** whole site (no `src/routes/confidentialitate|cookie|termeni`)
- **Env:** all
- **Steps:** visit footer / look for privacy links. **Expected:** RO privacy policy, cookie
  policy, and terms/legal notice reachable. **Actual:** none exist; the lead form's consent
  line links to nothing.
- **Risk:** A Romanian business collecting names/phones/emails via a contact form must provide a
  GDPR privacy notice. Legally required before promotion.
- **Fix:** Build editable `/confidentialitate`, `/politica-cookie`, `/termeni` (D1 `legal_pages`
  table already exists). Link them in the footer. Legal text needs owner/lawyer review.
- **Status:** **Fixed (implementation)** — three editable RO legal pages built and reachable,
  linked in the footer + sitemap, lead-form consent links to the privacy policy, admin editor at
  `/admin/legal`. Company identity seeded from zoloil.ro (unverified). **Remaining:** the seeded
  legal text is `needs_review = 1` and must be reviewed by a Romanian professional before promotion.

### H-2 · 2.9 MB homepage hero image (`public/parc-auto.png`)
- **Severity:** High · **Priority:** P1 · **Component:** homepage (`index.tsx`)
- **Steps:** load `/`. **Expected:** hero image a few hundred KB. **Actual:** `parc-auto.png`
  is **3,005,269 bytes**, served as PNG with no responsive sizes and no width/height.
- **Risk:** Dominates LCP and page weight, especially on mobile; also a CLS risk (no dimensions).
- **Fix:** Export a resized WebP/AVIF (~1600px max, target <300 KB), add explicit width/height.
  Optionally an R2 variant. **Status:** Open.

---

## Medium

### M-1 · No rate limiting / CAPTCHA on the public lead form
- **Severity:** Medium · **Component:** `submitLead` (`cars.functions.ts`), `LeadForm`
- **Detail:** Only a honeypot guards submissions. A bot ignoring the honeypot can POST leads
  unbounded, filling D1 and triggering Resend emails.
- **Fix:** Add a Cloudflare WAF rate-limit rule on the server-fn path (owner, dashboard) and/or a
  Cloudflare **Turnstile** widget (free). Consider an app-level per-IP cap. **Status:** Open.

### M-2 · `/api/upload` lacks Origin/CSRF check
- **Severity:** Medium · **Component:** `src/routes/api.upload.ts`
- **Detail:** The CSRF middleware only covers `serverFn` calls, not custom server routes. Upload
  authorization relies solely on the `CF_Authorization` cookie; a cross-site page could attempt an
  authenticated upload. Impact is limited (image add only), but it's an unguarded state-changing
  route.
- **Fix:** Verify the `Origin`/`Referer` header matches the site origin before accepting, or
  require the `Cf-Access-Jwt-Assertion` header (not the cookie) for this route. **Status:** Open.

### M-3 · Open Graph `url`/`image` are relative
- **Severity:** Medium (SEO/social) · **Component:** `masini.$slug.tsx`, other routes
- **Detail:** `og:url` and `og:image` are set to `/masini/<slug>` and `/img/...`. Social scrapers
  (Facebook/WhatsApp) require **absolute** URLs, so link previews may show no image.
- **Fix:** Prefix with `VITE_SITE_URL` when building OG tags. **Status:** Open.

### M-4 · No Content-Security-Policy
- **Severity:** Medium · **Component:** `public/_headers`
- **Detail:** Baseline security headers were added (see fixes), but no CSP. The homepage/contact
  embed a Google Maps iframe and use inline styles, so CSP needs careful testing.
- **Fix:** Add a tested CSP (`frame-src https://www.google.com`, `img-src` for R2 domain, etc.).
  **Status:** Open (recommendation).

### M-5 · No automated tests
- **Severity:** Medium · **Component:** repo
- **Detail:** No test framework; 0% coverage of validation, mappers, auth logic.
- **Fix:** Add Vitest + focused unit tests (see `TEST_COVERAGE_MATRIX.md`). **Status:** Open.

---

## Low

### L-1 · Cookie banner copy claimed analytics that don't exist — **Fixed**
- Was: "…analiză trafic…"; no analytics scripts exist. Updated to state only necessary cookies
  are used. **Status:** Fixed (`CookieConsent.tsx`).

### L-2 · Gallery arrow buttons missing `aria-label` — **Fixed**
- Car-detail gallery prev/next were icon-only with no accessible name. Added Romanian
  `aria-label`s. **Status:** Fixed (`masini.$slug.tsx`).

### L-3 · Missing security headers — **Fixed**
- Added `public/_headers` with `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` (verified present in `dist/_headers` after build). **Status:** Fixed.

### L-4 · `robots.txt` has no `Sitemap:` directive
- **Component:** `public/robots.txt`. Add `Sitemap: https://<domain>/sitemap.xml` once the
  production domain is known. **Status:** Open (needs domain).

### L-5 · Mobile menu toggle lacks `aria-expanded`
- **Component:** `Header.tsx`. Add `aria-expanded={open}` to the toggle button. **Status:** Open.

### L-6 · No skip-navigation link / reduced-motion handling
- **Component:** `__root.tsx`. Minor WCAG improvements. **Status:** Open.

### L-7 · Car-detail placeholder image is a remote Unsplash URL
- **Component:** `masini.$slug.tsx` `PLACEHOLDER`. Adds an external dependency + unoptimised
  1600px image for cars with no photos. Prefer a small bundled local placeholder. **Status:** Open.

### L-8 · `listCars` returns up to 200 rows with no pagination
- **Component:** `repository.ts`. Fine for a small dealership now; add pagination before inventory
  grows large. **Status:** Open (future).

---

## Improvement opportunities (not defects)

- Add Vehicle/Product JSON-LD to car pages and LocalBusiness/AutoDealer to the homepage.
- Add a persistent "Setări cookie" control if any non-essential cookies are ever introduced.
- Add an admin data-retention/export + delete flow for leads (GDPR data-subject requests).
- Serve WebP/AVIF variants for R2 vehicle images.
- HSTS at the Cloudflare zone level (owner).
