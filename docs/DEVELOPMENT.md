# Development Guide

## Branch Overview

| Branch    | Database          | Purpose                        |
|-----------|-------------------|--------------------------------|
| `main`    | Remote Supabase   | Live production website        |
| `develop` | Local Supabase    | Feature development and testing |

Changes are developed on `develop`, tested locally, then merged into `main` for production release.

---

## Working on `develop` (feature development)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) must be installed and running
- `.env.develop` must exist in the project root (already set up — do not commit it)

### Starting the development environment

```powershell
# 1. Start the local Supabase instance (only needed once per session)
npx supabase start

# 2. Switch to the develop branch
git checkout develop

# 3. Start the app with the develop environment
npm run dev:develop
```

App runs at **http://localhost:8081** (or next available port).  
Local Supabase Studio runs at **http://localhost:54323**.

### Stopping the local database

```powershell
npx supabase stop
```

### Admin access on develop

The local database has a test admin user created via Supabase Studio:

1. Open **http://localhost:54323 → Authentication → Users**
2. The admin user is listed there (email used during setup)
3. Log in at **http://localhost:8081/auth** with those credentials

If the admin role is missing for a user, run this in **SQL Editor** at http://localhost:54323:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your@email.com';
```

### Adding database changes (migrations)

When you need to change the database schema (new table, new column, etc.):

```powershell
# After making changes in Supabase Studio locally:
npx supabase db diff -f describe_your_change
```

This creates a new file in `supabase/migrations/`. Commit it with your feature branch — it will be applied to production when merged to `main`.

### Feature branch workflow

```powershell
# Start a new feature from develop
git checkout develop
git checkout -b feature/my-new-feature

# Work on the feature...
npm run dev:develop

# When done, merge back to develop
git checkout develop
git merge feature/my-new-feature
```

---

## Working on `main` (production)

> **Caution:** `main` is connected to the live production database. Any data changes affect real users.

### Starting the production environment locally

```powershell
git checkout main
npm run dev:main
```

This uses `.env.main` which points to the remote production Supabase project.

### Deploying to production

Push to `main` triggers the production deployment (Cloudflare Pages).  
Before merging, always verify the build passes:

```powershell
npm run build:main
```

---

## Environment Variables Reference

Both `.env.main` and `.env.develop` contain the same keys — only the values differ.

### `SUPABASE_PROJECT_ID`

The Supabase project reference ID (short alphanumeric string from the project URL).

- `main`: `knatquhcztmnhbxlierh` (remote production project)
- `develop`: `local` (local Docker instance)

Used by: Supabase CLI commands.

---

### `SUPABASE_URL` / `VITE_SUPABASE_URL`

The base API URL for all Supabase requests.

- `main`: `https://knatquhcztmnhbxlierh.supabase.co`
- `develop`: `http://127.0.0.1:54321`

`SUPABASE_URL` → server-side (SSR, auth middleware, server functions)  
`VITE_SUPABASE_URL` → client-side (browser, Vite build-time replacement)

Both must always have the same value within the same environment.

---

### `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_KEY`

The **anon / public key**. Safe to expose to the browser. Used for all normal client queries that go through Row Level Security (RLS).

- `SUPABASE_PUBLISHABLE_KEY` → server-side copy (auth middleware)
- `VITE_SUPABASE_PUBLISHABLE_KEY` → client-side (Vite injection)
- `VITE_SUPABASE_KEY` → alias, used by `src/utils/supabase.ts`

All three must always have the same value within the same environment.

---

### `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Secret — never expose to the browser or commit to git.**

Bypasses Row Level Security entirely. Used only in server-side admin operations:
- Creating/editing/deleting cars (`src/lib/api/`)
- Managing leads
- Any operation inside `*.server.ts` files

- `main`: the production service role key (JWT from Supabase dashboard)
- `develop`: the local service role key (from `npx supabase start` output — labeled "secret key")

---

## `.env` files summary

| File             | Tracked in git | Purpose                                      |
|------------------|---------------|----------------------------------------------|
| `.env`           | No            | Legacy default — not used when running with `--mode` |
| `.env.main`      | No            | Production values for `main` branch          |
| `.env.develop`   | No            | Local Supabase values for `develop` branch   |
| `.env.main.example`    | Yes     | Template for `.env.main` (no secrets)        |
| `.env.develop.example` | Yes     | Template for `.env.develop` (no secrets)     |
| `.env.example`   | Yes           | Generic template                             |
| `.dev.vars.example` | Yes        | Template for Cloudflare Wrangler secrets     |

> **Important:** `.env.main` and `.env.develop` are gitignored. Never commit them.
> If a service role key is accidentally committed, rotate it immediately in the Supabase dashboard (Settings → API → Regenerate).
