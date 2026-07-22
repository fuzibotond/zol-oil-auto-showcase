# ZOL-OIL — QA Test Report

**Date:** 2026-07-22
**Auditor:** Automated QA pass (static analysis + code review + build/bundle analysis).

## Executive summary

The application is architecturally sound and builds cleanly. Core data, image, auth,
and content-management flows are implemented on Cloudflare D1 + R2 + Access. The most
serious gaps for launch are **(1) missing legal/GDPR pages** (privacy, cookie, terms) for
a Romanian business that collects contact data, and **(2) a 2.9 MB homepage hero image**
that will dominate load time. Neither is a code defect — both are known unfinished work.

No **Critical** security or data-loss defects were found in review. Type-checking and the
production build pass. There is **no automated test suite** in the repo.

## Environment tested

| Item | Value |
|---|---|
| Mode | **Local** (static analysis, code review, local production build). No production/preview runtime testing. |
| OS / Node | Windows 11 · Node v24.9.0 |
| Package manager | npm (package-lock.json); bun.lock also present |
| Framework | TanStack Start (React 19, Vite 7, Nitro `cloudflare-pages` preset) |
| Data plane | Cloudflare D1 `zol-oil` (local + remote), R2 `zol-oil-images` |
| Auth | Cloudflare Access (Zero Trust) + `ADMIN_EMAILS` allowlist, server-verified |

## Methodology & honesty note

**Executed:** dependency review, `tsc`, `eslint`, production `vite build`, bundle-size
analysis of `dist/`, D1 migration validation on a fresh SQLite (run in a prior session:
tables, seed, CHECK, FK-cascade, unique-slug all passed), and manual source review of
every route, server function, and the data/image/auth layers.

**NOT executed (not fabricated):** Lighthouse / Core Web Vitals, live browser clicking,
real device/responsive rendering, cross-browser (Safari/Firefox) runtime, and any load
testing. These are marked **Not measured** throughout and listed as manual steps in
`PRE_LAUNCH_CHECKLIST.md`. Reason: preserving Cloudflare cost-safety, plus local D1 has no
seed vehicles and admin is gated by Access (not reachable on `vite dev` without a real
Access cookie). Dev-mode timings are deliberately **not** presented as production numbers.

## Commands executed

```bash
npx tsc --noEmit                 # PASS (0 errors)
npm run build                    # PASS (vite build, nitro cloudflare-pages)
npx eslint .                     # 429 errors — see note below
node <in-memory sqlite test>     # D1 schema migrations PASS (prior session)
find dist/assets -name '*.js'    # bundle-size analysis
```

**ESLint note:** the 429 errors are almost entirely `prettier/prettier` **CRLF** violations
in files across the repo (a Windows working-tree line-ending artifact — committed blobs are
LF, so CI on Linux is clean) plus a few pre-existing `@typescript-eslint/no-explicit-any`
and `no-empty` in files not touched by this work. New code added in this project is
lint-clean. This is a tooling/hygiene issue, not runtime bugs. A `.gitattributes` (`* text=auto
eol=lf`) was added to normalise line endings going forward.

## Functional areas reviewed

| Area | Method | Result |
|---|---|---|
| Homepage, inventory, car detail, contact, about | Code review + build | Pass (logic sound) |
| Inventory filtering/sorting | Code review (`masini.index.tsx`) | Present; not runtime-tested |
| Contact / lead form (validation, honeypot, server insert) | Code review | Pass; **no rate limit / CAPTCHA** (see bugs) |
| Admin CRUD (cars, leads, about, company, settings) | Code review | Pass; server-authz enforced |
| Auth (Access JWT verify + allowlist) | Code review | Pass; fails closed |
| Image upload → R2 (magic-byte validation, keys) | Code review | Pass |
| D1 schema / migrations | **Executed** (fresh SQLite) | Pass |
| 404 / empty / error states | Code review | Present (`__root.tsx` NotFound/Error) |

## Passed / Failed / Skipped

- **Passed (executed):** type-check, production build, D1 migration validation, bundle analysis.
- **Failed (executed):** repo-wide `eslint` (CRLF/pre-existing `any`) — environmental, not runtime.
- **Skipped (documented):** Lighthouse, live browser E2E, responsive/cross-browser rendering,
  production runtime, rate-limit live testing — to preserve Cloudflare cost-safety and because
  local admin/data isn't populated. See `PRE_LAUNCH_CHECKLIST.md` for how to run them safely.

## Browser & viewport coverage

**Not measured.** No live browser or device testing was performed. Layout was reviewed in
source only. Responsive risks (Tailwind breakpoints, the inline-styled homepage hero) are
noted in `BUG_REPORT.md` as review-based, not observed.

## Accessibility summary

Reviewed in source. Good: `lang="ro"`, form labels, most icon-buttons have `aria-label`,
image `alt` text present. Fixed in this pass: gallery arrow `aria-label`s. Remaining
(see bugs): no skip-nav link, no `aria-expanded` on the mobile menu toggle, focus-visible
relies on defaults, no reduced-motion handling. No automated axe scan was run (**Not measured**).

## SEO summary

Good: per-route `<title>`/description, canonical, OG tags, `lang="ro"`, dynamic
`sitemap.xml`, `AutoDealer` JSON-LD on `/despre-noi`. Gaps: `robots.txt` has **no `Sitemap:`**
directive; OG `url`/`image` are **relative** (social scrapers need absolute URLs); no
Vehicle/Product structured data on car pages; no LocalBusiness schema on the homepage.

## Security & privacy summary

Strong: parameterised D1 queries (no SQLi), React output-escaping (only JSON-LD uses
`dangerouslySetInnerHTML`, and it escapes `<`), server-side Access-JWT verification on every
admin mutation, file-upload signature validation. Fixed here: **security headers** added
(`public/_headers`). Gaps: **no legal/GDPR pages**, **no rate limiting / CAPTCHA** on the public
lead form, `/api/upload` has no Origin/CSRF check (relies on Access cookie), no CSP. HSTS
should be enabled at the Cloudflare zone (owner). No secrets are committed (`.dev.vars`,
`.env*` gitignored).

## Test coverage summary

**0% automated.** No test framework is installed (no vitest/jest/playwright). See
`TEST_COVERAGE_MATRIX.md`. Recommended first tests: repository mappers (JSON/bool round-trip),
R2 `detectImage` validation, lead/car Zod schemas, Access-JWT allowlist logic.

## Limitations

- No production/preview runtime testing (cost-safety + honesty).
- Local D1 empty → dynamic pages not exercised with real data at runtime.
- Admin unreachable locally (Access-gated) → admin UI verified by code review only.
- No Lighthouse/CWV numbers — see `PERFORMANCE_REPORT.md`.

## Cloudflare cost-safety confirmation

No load/stress tests were run. No new Cloudflare resources, domains, paid features, or Images
transformations were created. No emails/SMS were sent. The only production writes were D1
**schema migrations** (`wrangler d1 migrations apply --remote`) applied earlier to stand up the
empty database — no bulk/test-record writes. All analysis used local build output and code review.
