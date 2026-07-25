# ZOL-OIL — Pre-Launch Checklist

Derived from `QA_TEST_REPORT.md`, `BUG_REPORT.md`, `PERFORMANCE_REPORT.md`.

## Must fix before launch

- [x] **Legal/GDPR pages** — privacy, cookie, terms built at `/confidentialitate`,
      `/politica-cookie`, `/termeni`, linked in footer + sitemap; lead-form consent links to the
      privacy policy. **Owner action:** have the text reviewed by a RO professional, then untick
      "Necesită verificare juridică" in **Admin → Pagini legale**. (BUG H-1)
- [ ] **Verify company legal data** — legal name/CUI/Reg.Com./office were seeded from zoloil.ro but
      are **unverified**. Confirm them in **Admin → Companie** and tick the checklist. Add the
      official email + VAT status (not found on the old site).
- [ ] **Homepage hero image** — replace the 2.9 MB `parc-auto.png` with a resized WebP/AVIF
      (<300 KB) and set width/height. (BUG H-2)
- [ ] **Cloudflare Access** configured over `/admin` with the owner's email in the policy, and
      `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` / `ADMIN_EMAILS` set on the Pages project. (owner)
- [ ] **At least one real vehicle** created and viewed end-to-end on the deployed site (D1 is
      currently empty).

## Strongly recommended before launch

- [ ] **Rate limiting / Turnstile** on the lead form (Cloudflare WAF rule + free Turnstile). (BUG M-1)
- [ ] **Origin/CSRF check** on `/api/upload`. (BUG M-2)
- [ ] **Absolute OG `url`/`image`** using `VITE_SITE_URL` so social previews work. (BUG M-3)
- [ ] **`robots.txt` `Sitemap:`** line with the production domain. (BUG L-4)
- [ ] **Set `VITE_SITE_URL`** to the real origin (feeds sitemap, OG, WhatsApp car link, lead emails).
- [ ] Run **Lighthouse** against `npm run preview` or the `*.pages.dev` preview and record results.
- [ ] Add a **minimal automated test suite** (Vitest) for auth, validation, and image checks. (BUG M-5)

## Can be improved after launch

- [ ] Content-Security-Policy (tested against Google Maps iframe). (BUG M-4)
- [ ] WebP/AVIF variants for R2 vehicle images.
- [ ] Vehicle/Product + homepage LocalBusiness structured data.
- [ ] `aria-expanded` on mobile menu, skip-nav link, reduced-motion handling. (BUG L-5/L-6)
- [ ] Local bundled placeholder image instead of remote Unsplash. (BUG L-7)
- [ ] Inventory pagination as the catalogue grows. (BUG L-8)
- [ ] Lead data-retention + export/delete flow (GDPR data-subject requests).
- [ ] Normalise repo line endings (`.gitattributes` added; run `git add --renormalize .` once,
      intentionally, to clear the CRLF eslint noise on Windows checkouts).

## Manual checks required from the owner

- [ ] Confirm real legal company data (legal name, CUI, Reg. Com., registered office).
- [ ] Legal review of privacy/cookie/terms text by a Romanian professional.
- [ ] Verify Google Maps / Waze links point at the correct location.
- [ ] Confirm the notification email (`NOTIFY_EMAIL`) and a verified Resend sender (`NOTIFY_FROM`).
- [ ] Real-device responsive spot-check (iOS Safari, Android Chrome) — not performed in this audit.

## Cloudflare dashboard checks that require owner access (no changes made by this audit)

- [ ] **Access application** over `/admin` with the correct policy + identity provider (or default
      One-time PIN).
- [ ] **Secrets/vars** on the Pages project: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ADMIN_EMAILS`,
      `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM`, `VITE_SITE_URL`. Never commit these.
- [ ] **D1 + R2 bindings** present on the deployed project (bindings `DB` and `R2`).
- [ ] **HSTS** enabled at the zone (SSL/TLS → Edge Certificates), plus consider a WAF rate-limit rule.
- [ ] **Custom domain** + DNS/HTTPS when moving off `*.pages.dev`; then update Access app domain,
      `VITE_SITE_URL`, and the R2 image domain.
- [ ] Optional: attach a **custom domain to the R2 bucket** and set `R2_PUBLIC_BASE_URL` (avoids the
      same-origin `/img/` route and the `r2.dev` dev URL).

## Cloudflare cost-safety

This audit created no Cloudflare resources, ran no load tests, sent no emails, and made no dashboard,
DNS, or billing changes. Only D1 **schema** migrations were applied (no bulk/test-record writes).
