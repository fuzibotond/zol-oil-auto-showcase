# ZOL-OIL — Cloudflare Deployment Guide

> **Scope note:** this guide currently covers what is live in the codebase today —
> Cloudflare **Access** admin authentication (data is still on Supabase). The D1
> and R2 sections will be added when the data/image migration lands. See
> [CLOUDFLARE_MIGRATION_PLAN.md](CLOUDFLARE_MIGRATION_PLAN.md).

## Current state after this change

- **Public site:** unchanged — served by Cloudflare Pages, data from Supabase.
- **Admin (`/admin*`):** authentication is handled by **Cloudflare Zero Trust Access**.
  There is no application password anymore. The server verifies the Access JWT on
  every admin request and additionally checks an `ADMIN_EMAILS` allowlist.
- **Fails closed:** if Access/secrets are not configured, `/admin` shows
  "Acces refuzat" and no admin API works. The public site is unaffected.

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

Keep the existing Supabase variables in place (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) — admin data writes use the service-role key.

> I never handle these secret values — set them yourself in the dashboard.

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
