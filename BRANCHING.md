# Branch and Database Separation

This project can run in two fully separate environments:

- `main`: production website + production Supabase project
- `develop`: development website + development Supabase project

## 1) Create two Supabase projects

Create two projects in Supabase:

- Production project (for `main`)
- Development project (for `develop`)

Run the same SQL migrations on both projects.

## 2) Local environment files

Use Vite modes with branch-specific env files:

- `.env.main` for production values
- `.env.develop` for development values

Templates are provided:

- `.env.main.example`
- `.env.develop.example`

Example local commands:

- `npm run dev:develop` uses `.env.develop`
- `npm run dev:main` uses `.env.main`
- `npm run build:develop` uses `.env.develop`
- `npm run build:main` uses `.env.main`

## 3) Deployment environment variables

Set variables per deployed environment (not in git):

Required vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NOTIFY_EMAIL`

Recommended mapping:

- Production deployment (from `main`) -> production Supabase variables
- Preview/staging deployment (from `develop`) -> development Supabase variables

## 4) Git workflow

- Keep `main` deployable and stable.
- Build features from `develop` or feature branches off `develop`.
- Merge to `main` only when ready for production release.

## 5) Security notes

- Never commit `.env`, `.env.main`, `.env.develop`, `.dev.vars`.
- If a service role key was committed previously, rotate it in Supabase immediately.
