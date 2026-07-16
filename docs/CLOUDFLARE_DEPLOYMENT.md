# ZOL-OIL — Cloudflare Deployment Guide

> The app now runs entirely on Cloudflare — **D1** (data), **R2** (images), and
> **Access** (admin auth). Supabase has been removed. See
> [CLOUDFLARE_MIGRATION_PLAN.md](CLOUDFLARE_MIGRATION_PLAN.md).

## Current state

- **Data:** Cloudflare **D1** (SQLite). Server functions use a parameterised repository.
- **Images:** Cloudflare **R2**. Admin uploads go through `/api/upload` (signature-validated,
  Access-protected); delivery via a custom domain (`R2_PUBLIC_BASE_URL`) or the same-origin
  `/img/<key>` route.
- **Admin (`/admin*`):** **Cloudflare Zero Trust Access**. No application password. The server
  verifies the Access JWT on every admin request and checks an `ADMIN_EMAILS` allowlist.
- **Fails closed:** without Access/secrets, `/admin` shows "Acces refuzat" and no admin API works.
- **Requires D1/R2 bindings** to be provisioned (Step 2.5) — the data-backed pages need them.

---

## Step 0 — No custom domain yet? Use `*.pages.dev`

You do **not** need to own a production domain to deploy or to gate admin.

- Cloudflare Pages auto-assigns **`<your-project>.pages.dev`** — treat that as your
  production URL for now.
- Cloudflare Access works on `.pages.dev`, so in Step 1 set the Access application
  **domain to `<your-project>.pages.dev`** and path `/admin`.
- Set `VITE_SITE_URL=https://<your-project>.pages.dev` in the Pages env vars so
  sitemap/SEO canonical links are valid.
- Do **not** use the Pages "protect entire project with Access" toggle — that would
  lock the *public* site. Use the path-scoped self-hosted Access app (Step 1).
- When you later buy a domain: add it as a **Custom domain** in the Pages project,
  then update the Access app domain, `VITE_SITE_URL`, and (in the R2 phase) the image
  domain. No code changes — config only.
- Preview deploys get `<hash>.<your-project>.pages.dev`; to reach admin there too,
  point the Access app at the wildcard `*.<your-project>.pages.dev`.

## Step 1 — Create the Cloudflare Access application (you)

1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. **Application name:** `ZOL-OIL Admin`.
3. **Application domain:** your production hostname, **path `/admin`** (this covers `/admin/*`).
   - The Access session cookie (`CF_Authorization`) is issued for the whole hostname,
     so protecting `/admin` is enough for the admin API calls too.
4. **Add a policy:** Action **Allow**; Include → **Emails** = the owner's email(s)
   (or a Google/GitHub identity provider group).
5. Save. Then open the application's **Overview/Settings** and copy the
   **Application Audience (AUD) Tag** — you'll need it as `ACCESS_AUD`.
6. Your **team domain** is shown under Zero Trust → **Settings** → **Custom Pages**
   (or in the URL): it looks like `yourteam.cloudflareaccess.com`. That's `ACCESS_TEAM_DOMAIN`.

## Step 2 — Set the environment variables on the Pages project (you)

Cloudflare dashboard → **Workers & Pages** → your Pages project → **Settings** →
**Environment variables** → **Production** (and Preview if you use it):

| Name | Value | Notes |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | `yourteam.cloudflareaccess.com` | no `https://` |
| `ACCESS_AUD` | *(the AUD tag from Step 1.5)* | |
| `ADMIN_EMAILS` | `owner@example.com` | comma-separated for multiple admins |

Optional vars: `RESEND_API_KEY` + `NOTIFY_EMAIL` (new-lead email), `NOTIFY_FROM`
(verified Resend sender), `VITE_SITE_URL`. The old `SUPABASE_*` variables are **no
longer used** and can be deleted once the migration is verified.

> I never handle these secret values — set them yourself in the dashboard.

## Step 2.5 — Provision D1 + R2 (you — needs `wrangler login`)

The app now runs on Cloudflare D1 (data) and R2 (images). Create them and wire the
bindings:

```bash
# 1. Create the database — copy the printed database_id
wrangler d1 create zol-oil

# 2. Create the image bucket
wrangler r2 bucket create zol-oil-images
```

Then in **wrangler.toml**, uncomment the `[[d1_databases]]`, `[[r2_buckets]]` and
`[vars]` blocks and paste the real `database_id`. Apply the schema:

```bash
# Local (for `vite dev`) and remote (production):
wrangler d1 migrations apply zol-oil --local
wrangler d1 migrations apply zol-oil --remote
```

Cloudflare Pages picks up the bindings from `wrangler.toml` at deploy. (If you prefer,
you can instead add the D1/R2 bindings in the Pages dashboard → Settings → Functions →
Bindings, and leave wrangler.toml commented.)

### Bringing existing data over (optional)
A fresh D1 database is **empty** — the site will show no cars until data exists. Two options:
- **Start clean:** add vehicles through the admin panel (uploads go to R2 automatically).
- **Migrate existing Supabase data:** run the Supabase→D1 export/import script
  (`scripts/migrate/` — ask me to generate it; it needs your Supabase service-role key,
  transforms the rows, mirrors Storage images to R2, and prints a migration report).

## Step 3 — Go live (me, on your word)

Tell me when Steps 1–2 are done and I will:
```
git checkout main
git merge develop
git push
```
Cloudflare Pages auto-builds and deploys `main`. Then:
1. Visit `/admin` → you'll be redirected to the Cloudflare Access login.
2. After authenticating with an allowlisted email, the admin panel loads.
3. "Schimbă contul" / logout uses `/cdn-cgi/access/logout`.

## Rollback

- Revert the deploy commit on `main` and push, or redeploy the previous Pages
  deployment from the dashboard. Supabase Auth data is untouched, so reverting
  fully restores the previous login.

## Notes / known items

- **Local dev:** `vite dev` has no real Access proxy, so there's no
  `CF_Authorization` cookie and the admin panel will read as "not admin" locally.
  Test admin against a deployed Preview/Production, or we can add a clearly-gated
  dev-only bypass later (not enabled, for safety).
- **Bindings caveat:** Nitro generates its own `dist/_worker.js/wrangler.json` at
  build and ignores `pages_build_output_dir` from the root `wrangler.toml`. The
  root `wrangler.toml` bindings are used for **local** dev; **production** D1/R2
  bindings (when we get there) are set in the Pages dashboard → Settings →
  Functions → Bindings, or via nitro config.
