# ZOL-OIL — Test Coverage Matrix

**Automated coverage: 0%** (no test framework installed). "Manual" below = **source code
review** in this pass, not live browser testing. "Result" reflects review confidence, not a
runtime pass. Legend: ✅ reviewed/sound · ⚠️ gap/risk · ❌ missing · N/M not measured.

| Area | Scenario | Automated | Manual | Result | Notes |
|---|---|--:|--:|---|---|
| Homepage | Render, featured/latest cars, CTAs | ❌ | ✅ | ✅ | 2.9 MB hero (H-2) |
| Inventory | List, filter, sort | ❌ | ✅ | ⚠️ | Logic present; not runtime-tested; no pagination |
| Car detail | Specs, gallery, similar, WhatsApp prefill | ❌ | ✅ | ✅ | OG image relative (M-3) |
| About (`/despre-noi`) | Hero, sections, official info, JSON-LD | ❌ | ✅ | ✅ | Renders only filled company fields |
| Contact | Info, map, lead form | ❌ | ✅ | ✅ | Map from editable address |
| Privacy / Cookie / Terms | Exist & linked | ❌ | ✅ | ❌ | **Not built** (H-1) |
| 404 / error / empty states | Fallback UI | ❌ | ✅ | ✅ | `__root.tsx` NotFound/Error present |
| Navigation & links | Header/mobile/footer/sitemap | ❌ | ✅ | ✅ | "Despre noi"/"Companie" wired |
| Lead form validation | Required, email, phone, honeypot | ❌ | ✅ | ⚠️ | Zod server-side ✓; **no rate limit** (M-1) |
| Lead submission | Insert to D1 + notify | ❌ | ✅ | ✅ | Best-effort Resend; failure won't block insert |
| Admin auth | Access JWT verify + allowlist | ❌ | ✅ | ✅ | Fails closed; server-enforced |
| Admin: cars CRUD | Create/edit/delete/status/featured | ❌ | ✅ | ✅ | Service authz on every fn |
| Admin: images | Upload/replace/remove/reorder, R2 cleanup | ❌ | ✅ | ✅ | Magic-byte validation |
| Admin: about CRUD | Sections add/edit/delete/publish/reorder | ❌ | ✅ | ✅ | Body is plain text (no HTML XSS) |
| Admin: company info | Fields + verified checklist | ❌ | ✅ | ✅ | Verify only when value present |
| Admin: settings | Contact/address/maps/hours/social | ❌ | ✅ | ✅ | Address drives embedded map |
| APIs: `/api/upload` | Auth + validation | ❌ | ✅ | ⚠️ | No Origin/CSRF check (M-2) |
| APIs: `/img/$` | R2 delivery, cache, traversal guard | ❌ | ✅ | ✅ | Rejects `..`; immutable cache |
| APIs: `sitemap.xml` | Static + car URLs | ❌ | ✅ | ✅ | From D1 |
| Data: D1 schema | Tables, FK, CHECK, unique, cascade | ❌ | **✅ executed** | ✅ | Ran on fresh SQLite (prior session) |
| Data integrity | Slug uniqueness, image ordering | ❌ | ✅ | ✅ | `uniqueSlug`, sort_order preserved |
| Responsiveness | 360→1920 viewports | ❌ | ⚠️ | N/M | Source review only; not rendered |
| Accessibility | Labels, focus, alt, contrast | ❌ | ⚠️ | ⚠️ | Partial; no axe scan (see QA report) |
| SEO | Titles, canonical, OG, JSON-LD, robots | ❌ | ✅ | ⚠️ | robots missing Sitemap; OG relative |
| Security | SQLi, XSS, upload, headers, authz | ❌ | ✅ | ⚠️ | Headers fixed; no CSP/rate-limit |
| Performance | CWV, bundle, images | ❌ | ⚠️ | N/M | Bundle measured; CWV not measured |

## Untested critical functionality (highest priority to cover)

1. Access-JWT verification + `ADMIN_EMAILS` allowlist (`src/lib/auth/*`).
2. `submitLead` validation + honeypot handling.
3. `adminUpsertCar` slug uniqueness + image replacement.
4. R2 `detectImage` (magic-byte) validation and size limits.
5. Repository row↔domain mapping (JSON arrays, 0/1 booleans).

## Recommended first test suite (Vitest)

- `src/lib/images/r2.ts` — `detectImage` for jpg/png/webp/gif + rejects text/SVG/oversize.
- `src/lib/auth/access.ts` — `isAllowlistedAdmin`, `extractAccessToken` cookie/header parsing.
- Zod schemas — `CarInput`, `LeadInput`, `SettingsInputSchema`, company/about schemas.
- Repository mappers — round-trip via `node:sqlite` in-memory (pattern already proven).

Coverage tooling (statements/branches/functions/lines): **not available** — no runner installed.
