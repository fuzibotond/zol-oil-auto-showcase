# ZOL-OIL — Supabase → Cloudflare Migration Plan

**Status:** Phase 1 (audit) complete. Foundation (Phase 2 start) implemented.
**Author:** Migration engineering pass.
**Last updated:** 2026-07-15

> **Confirmed decisions (2026-07-15):**
> - **Cutover style:** big-bang rewrite on `develop` (no parallel Supabase kept working);
>   `main` stays live on Supabase until the final verified cutover.
> - **Admin auth:** **Cloudflare Access** in front of `/admin*` (+ server-side Access-JWT
>   verification and a D1 `admin_users` allowlist as defense-in-depth). This supersedes the
>   D1-session recommendation originally written in §6.
> - **Working mode:** phase-by-phase with check-ins.

> This document is the source of truth for the migration. It is grounded in an
> actual read of the repository at the `develop` branch, not assumptions.

---

## 1. Current architecture

### 1.1 Stack
- **Framework:** TanStack Start (`@tanstack/react-start` 1.167) on React 19, Vite 7.
- **Build/deploy:** Nitro with `preset: "cloudflare-pages"` (`vite.config.ts`), wrapped by
  `@lovable.dev/vite-tanstack-config`. **The app already deploys to Cloudflare Pages** — only
  the *data plane* (Supabase) needs migrating, not the hosting.
- **Styling:** Tailwind CSS v4, Radix UI primitives, shadcn-style components in `src/components/ui`.
- **Server logic:** `createServerFn` server functions in `src/lib/api/*.functions.ts`.
  These compile to RPC endpoints. Client middleware `attachSupabaseAuth` attaches the
  Supabase bearer token; server middleware `requireSupabaseAuth` validates it.
- **CSRF:** `createCsrfMiddleware` is already wired in `src/start.ts` (filters `serverFn`).
- **SSR error handling:** custom wrapper in `src/server.ts` + `src/lib/error-page.ts`.

### 1.2 Routing (file-based, `src/routes`)
| Route | Purpose | SSR |
|---|---|---|
| `index.tsx` | Homepage (featured cars) | yes |
| `masini.tsx` / `masini.index.tsx` | Inventory list + filters | yes |
| `masini.$slug.tsx` | Vehicle detail + gallery + lead form | yes |
| `contact.tsx` | Contact page + lead form | yes |
| `auth.tsx` | Admin login/signup (Supabase Auth) | yes |
| `admin.tsx` | Admin shell + auth guard | `ssr: false` |
| `admin.index.tsx` | Dashboard | client |
| `admin.masini.*` | Vehicle CRUD (list/new/edit) | client |
| `admin.leaduri.tsx` | Leads management | client |
| `admin.setari.tsx` | Site settings | client |
| `sitemap[.]xml.ts` | Dynamic XML sitemap | server route |
| `__root.tsx` | Root layout (Header/Footer/CookieConsent) | — |

### 1.3 Data model (Supabase Postgres)
Defined in `supabase/migrations/`:
- **`user_roles`** — `(id, user_id→auth.users, role app_role enum, created_at)`, unique `(user_id, role)`.
- **`cars`** — full vehicle record. Unique `slug`. `equipment TEXT[]`, `autovit_url`, `status`,
  `is_featured`, timestamps. Indexes on `status`, `is_featured`, `brand`.
- **`car_images`** — `(id, car_id→cars CASCADE, url, alt_text, sort_order, created_at)`.
  Index `(car_id, sort_order)`.
- **`leads`** — `(id, car_id→cars SET NULL, name, phone, email, message, source, status, created_at)`.
- **`site_settings`** — single-row `id='default'` config: contact email/phone/whatsapp,
  `opening_hours JSONB`, `social_links JSONB`, timestamps.
- **Function `has_role(uuid, app_role)`** — SECURITY DEFINER, used by RLS + admin checks.
- **Trigger `update_updated_at_column()`** on `cars`, `site_settings`.

### 1.4 Authentication & authorization
- **Supabase Auth** (email/password). Session persisted in `localStorage` client-side
  (`src/integrations/supabase/client.ts`).
- Admin route guard: `admin.tsx` `beforeLoad` calls `supabase.auth.getUser()`; then
  `checkIsAdmin` server fn verifies the `admin` role via `has_role`.
- Server functions use `requireSupabaseAuth` middleware → validates Bearer JWT via
  `supabase.auth.getClaims()`, then `assertAdmin()` re-checks `has_role`.
- **RLS** enforces public-read / admin-write on every table. `leads` allow anonymous INSERT.

### 1.5 Storage & images
- Supabase Storage bucket **`car-images`** (public, 10 MB limit, jpeg/png/webp/gif).
- Upload happens **client-side** in `AdminCarForm.tsx` (`supabase.storage.upload`), then the
  public URL is stored in `car_images.url`. External URLs are also allowed.
- Public images are also referenced by absolute URL — some may be external.

### 1.6 Third-party services & tracking
- **Resend** email via Supabase Edge Function `supabase/functions/notify-lead` (new-lead alerts).
- **Google Maps** embed (`SITE.mapsEmbed`) — iframe on contact page.
- **No analytics / pixels / ad trackers** found. The cookie banner currently claims
  "analiză trafic" but no analytics script exists → **misleading copy to fix**.
- Lovable error reporting (`src/lib/lovable-error-reporting.ts`, `error-capture.ts`).

### 1.7 Hardcoded / placeholder company data (⚠️ must be verified)
`src/lib/site.ts` and the `site_settings` seed contain **placeholder** values:
- Phone `+40 700 000 000`, email `contact@zol-oil.ro`, address "Cernat, jud. Covasna".
- **No CUI/CIF, no Trade Register number, no legal entity name.** These do not exist
  anywhere in the repo and must be supplied by the business owner.

### 1.8 Environment variables (current)
Public (`VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_KEY`, `VITE_SITE_URL`.
Server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NOTIFY_EMAIL`.

---

## 2. Supabase dependency inventory

| Location | Dependency | Migration action |
|---|---|---|
| `package.json` | `@supabase/supabase-js`, `supabase` (dev CLI) | Remove after cutover |
| `src/integrations/supabase/client.ts` | Public/anon client | Replace with D1 access via server fns |
| `src/integrations/supabase/client.server.ts` | Service-role admin client | Replace with D1 binding |
| `src/integrations/supabase/auth-middleware.ts` | Bearer JWT validation | Replace with session-cookie auth |
| `src/integrations/supabase/auth-attacher.ts` | Client token attacher | Remove (cookie-based) |
| `src/integrations/supabase/types.ts` | Generated DB types | Replace with hand-written D1 types |
| `src/utils/supabase.ts` | Alias client | Remove |
| `src/lib/api/cars.functions.ts` | All car/lead reads+writes | Rewrite against D1 repository |
| `src/lib/api/site-settings.functions.ts` | Settings reads+writes | Rewrite against D1 repository |
| `src/components/admin/AdminCarForm.tsx` | Client-side storage upload | Rewrite to server upload → R2 |
| `src/routes/auth.tsx` | `signInWithPassword`/`signUp` | Replace with session login fn |
| `src/routes/admin.tsx` | `auth.getUser`/`signOut` | Replace with session check/logout fn |
| `supabase/functions/notify-lead` | Edge function + Resend | Move to a server fn / Worker email call |
| `supabase/migrations/*` | Postgres schema | Translate to D1 SQL (kept for history) |
| `src/hooks/use-site-settings.ts` | Reads settings fn | Unaffected (calls server fn) — verify |

---

## 3. Supabase → Cloudflare mapping

| Supabase | Cloudflare | Notes |
|---|---|---|
| Postgres tables | **D1** (SQLite) | Rewrite SQL: no `TIMESTAMPTZ`→`TEXT` ISO8601; no `TEXT[]`→JSON text; no enums→`CHECK`; `gen_random_uuid()`→app-generated IDs |
| RLS policies | **App-layer authz** | D1 has no RLS. Enforce in every server fn via session + role check |
| `has_role()` RPC | `admin_users` table lookup | Simple role column |
| Supabase Auth | **D1-backed sessions** (recommended) or Cloudflare Access | See §6 |
| Supabase Storage `car-images` | **R2 bucket** | Server-side upload, metadata in D1 |
| Storage public URL | **Custom image delivery route/domain** | Not `r2.dev` in production |
| Edge Function `notify-lead` | Server fn calling Resend HTTP API | Runs in the Worker on lead insert |
| Service-role key | D1/R2 **bindings** | No secret key in code; bindings are server-only |

### 3.1 SQLite/D1 translation rules
- `UUID DEFAULT gen_random_uuid()` → `TEXT PRIMARY KEY` filled by `crypto.randomUUID()` in app code.
- `TIMESTAMPTZ DEFAULT now()` → `TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))`.
- `NUMERIC(10,2)` (price) → store as `INTEGER` **minor units are overkill for EUR car prices**;
  use `REAL` or `INTEGER` euros. Decision: `INTEGER` (whole currency units) — no cents used today.
- `TEXT[] equipment` → `TEXT` holding JSON array; parse/stringify in the repository layer.
- `JSONB opening_hours/social_links` → `TEXT` holding JSON; same treatment.
- `BOOLEAN` → `INTEGER` (0/1).
- Enums (`app_role`, status) → plain `TEXT` + `CHECK(...)` constraint.
- Foreign keys: supported by D1 but **must** `PRAGMA foreign_keys=ON` per connection — D1
  enables FK enforcement by default for the binding; still declare them for integrity + cascade.

---

## 4. Database migration strategy

1. **New D1 schema** in `migrations/d1/` (version-controlled, numbered, idempotent where safe).
   Tables: `admin_users`, `sessions`, `cars`, `car_images`, `car_features` (optional; equipment
   currently a JSON array — keep as-is for MVP), `leads`, `site_settings`, `company_info`,
   `about_sections`, `legal_pages`, `consent_log` (optional).
2. **Repository layer** `src/lib/db/` — typed functions wrapping parameterised D1 queries.
   All server fns call the repository; no raw SQL in routes.
3. **Access to the binding:** read `env.DB` (D1) and `env.R2` from the request context. On
   Cloudflare Pages + Nitro, bindings arrive on the Worker `env`; expose via a server helper.
4. **Data migration** (§5) is a one-time export→transform→import, not a live sync.
5. **Ordering preserved:** `car_images.sort_order` and `cars` ordering carried over verbatim.
6. **Publication status:** `cars.status` already models availability; add nothing new for MVP.

---

## 5. Data & image migration strategy

### 5.1 Records
Provide a Node script (`scripts/migrate/`) that:
1. Reads from Supabase (service-role) — `cars`, `car_images`, `leads`, `site_settings`, `user_roles`.
2. Transforms fields per §3.1 (arrays→JSON, bools→0/1, timestamps→ISO, price→integer).
3. Emits SQL `INSERT` batches **or** writes via `wrangler d1 execute`.
4. Validates row counts (exported vs imported) and FK integrity.
5. Writes a **migration report** (`docs/migration-report.json` + summary): exported, imported,
   failed, missing images, duplicate images, orphaned images, validation errors.

### 5.2 Images (Supabase Storage → R2)
1. List objects in `car-images`; for each referenced `car_images.url`:
   - If it points to Supabase Storage → download, re-upload to R2 with a new key, record metadata.
   - If external (autovit/other host) → **keep URL as-is** for MVP (flag in report), or optionally
     mirror to R2. Decision: keep external, mirror only Supabase-hosted objects.
2. Update `car_images` rows to the new R2 object key + delivery URL.
3. Detect duplicates (same content hash) and orphans (R2 object with no DB row / DB row with no object).

### 5.3 Admin users
Supabase Auth passwords are **not exportable** (hashed in `auth.users`). Admin accounts must be
**re-created** in the new system (owner sets a new password on first launch). Document this — it is
unavoidable and expected.

---

## 6. Authentication migration strategy

**Confirmed approach: Cloudflare Access** protecting `/admin*` (and the server-fn RPC paths),
with server-side verification of the Access JWT plus a D1 `admin_users` email allowlist.

Design (Access):
- Configure a Cloudflare Access self-hosted application over `/admin*` **and** the server-function
  endpoints, so admin RPCs can't be called around the HTML route. Policy = allowed admin emails
  (or an IdP group).
- Each admin server function validates the `Cf-Access-Jwt-Assertion` header: verify signature against
  `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` (JWKS), check `aud` == `ACCESS_AUD`,
  then confirm the email exists in `admin_users` (defense-in-depth). No hidden-UI reliance.
- Remove Supabase Auth, `/auth` login page, `attachSupabaseAuth`/`requireSupabaseAuth`.
- Owner adds their email to the Access policy and to `admin_users`.

Env: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` (see `.dev.vars.example`).

<details><summary>Alternative (not chosen): D1-backed session cookies</summary>

Design:
- `admin_users(id, email UNIQUE, password_hash, role, created_at, ...)`.
  Password hashing with **PBKDF2 via WebCrypto** (available in Workers; no native bcrypt).
  High iteration count; per-user random salt.
- `sessions(id, user_id, expires_at, created_at, user_agent, ...)`. Session id = 256-bit random,
  stored **hashed** in D1; raw id only in the cookie.
- Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, rolling expiry. New session id on login
  (session-fixation safe).
- Login rate limiting: per-IP + per-email attempt counter (D1 or in-memory KV-style) with lockout/backoff.
- CSRF: existing `createCsrfMiddleware` covers server-fn mutations; keep and verify it fires for admin.
- Every admin server fn: resolve session → user → assert role server-side. No reliance on hidden UI.
- Logout: delete session row + clear cookie.

This session-cookie design was the original recommendation but is **superseded** by the Cloudflare
Access decision above. Kept for reference only.

</details>

---

## 7. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Big-bang rip-out breaks live `main` | Production outage | Strangler approach: build D1/R2 behind a repository interface on `develop`; cut over once green. Never merge a half-migration to `main`. |
| D1 lacks Postgres features (RLS, arrays, `now()`) | Silent data bugs | Explicit translation rules (§3.1); app-layer authz on every fn. |
| Admin passwords can't be migrated | Admin lockout at launch | Owner re-creates admin account; documented + seed script. |
| External image URLs rot | Broken galleries | Report flags external URLs; optional mirror to R2. |
| `r2.dev` used in prod | Perf/branding/rate limits | Custom domain or Worker delivery route (Phase 3). |
| Price stored as float | Rounding | Store integer currency units. |
| Missing real legal data | Non-compliant launch | Editable fields + visible "needs verification" checklist; never invent values. |
| Bindings undefined at module scope on Workers | Runtime crashes | Read `env` per-request only (pattern already documented in `config.server.ts`). |

---

## 8. Rollback strategy

- All work lands on `develop`; `main` stays on Supabase until cutover is verified.
- Cutover = one commit switching env/bindings + removing Supabase. Roll back = revert that commit;
  Supabase project stays intact and untouched during migration (read-only export only).
- Keep Supabase project alive for **at least 30 days** post-launch as a fallback data source.
- D1: use `wrangler d1 export` for backups before each migration; Time Travel for point-in-time restore.
- Tag the last Supabase-based release (`git tag pre-cloudflare-cutover`) for instant redeploy.

---

## 9. Manual Cloudflare / owner setup (cannot be done from code)

These **require the Cloudflare account owner / business owner** and are tracked in
`docs/CLOUDFLARE_DEPLOYMENT.md`:
1. Create D1 database → capture `database_id` for `wrangler.toml`.
2. Create R2 bucket(s) → capture bucket name; configure public access / custom domain.
3. Configure a **custom image-delivery domain** (e.g. `img.zol-oil.ro`) — no `r2.dev` in prod.
4. Set secrets: `RESEND_API_KEY`, `NOTIFY_EMAIL`, session signing pepper.
5. Run schema migrations against D1 (staging + prod).
6. Run data + image migration scripts (needs Supabase service-role key).
7. Create the first admin user (set password).
8. Attach production domain, verify DNS + HTTPS.
9. **Provide real legal company data** (legal name, CUI/CIF, Trade Register no., registered office).
10. **Legal review** of privacy/cookie/terms text by a Romanian professional.

---

## 10. Proposed implementation sequence

Phases run on `develop`, keeping `main`/Supabase live until the final cutover:

1. **Foundation (non-breaking):** `wrangler.toml` with D1/R2 bindings, D1 schema migrations,
   `src/lib/db/` repository + env accessor, `.dev.vars` updates. Supabase still present.
2. **Auth:** D1 sessions + login/logout server fns; swap `auth.tsx`/`admin.tsx` guards.
3. **Data fns:** rewrite `cars.functions.ts` / `site-settings.functions.ts` against the repository.
4. **R2 image service:** server upload, delivery route, admin form rewrite.
5. **Data + image migration scripts** and report.
6. **About Us + company info + legal/cookie** features (Phases 4–5).
7. **Remove Supabase** entirely; search-and-verify.
8. **Audit + tests + deployment docs** (Phases 6–8), then cutover.

---

## Appendix A — Proposed D1 schema (summary)

See `migrations/d1/0001_init.sql` (created in Phase 2). High level:
`admin_users`, `sessions`, `cars`, `car_images`, `leads`, `site_settings`, `company_info`,
`about_sections`, `legal_pages`. Equipment stays a JSON array on `cars` for MVP (no `car_features`
table unless faceted filtering by feature is added later).
