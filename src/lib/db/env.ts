// Server-only accessor for Cloudflare bindings (D1 + R2).
//
// Nitro exposes the Worker `env` on `globalThis.__env__`:
//   • the cloudflare dev proxy sets it during `vite dev`
//   • the cloudflare_module (Workers) preset sets it on every production fetch
//   • the cloudflare-pages preset only sets it for scheduled events — see
//     docs/CLOUDFLARE_MIGRATION_PLAN.md §1 for the Pages→Workers recommendation.
//
// Always read bindings INSIDE a handler (never at module scope): on Workers the
// env binds per-request, so a module-scope read resolves to undefined.

import type { D1Database, R2Bucket } from "./cloudflare";

export interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  /** Custom image-delivery base URL, e.g. https://img.zol-oil.ro (no trailing slash). */
  R2_PUBLIC_BASE_URL?: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  /** Cloudflare Access team domain, e.g. myteam.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN?: string;
  /** Cloudflare Access application AUD tag (for JWT validation). */
  ACCESS_AUD?: string;
  /** Comma-separated allowlist of admin emails (defense-in-depth over the Access policy). */
  ADMIN_EMAILS?: string;
  [key: string]: unknown;
}

export function getCloudflareEnv(): CloudflareEnv {
  const env = (globalThis as { __env__?: CloudflareEnv }).__env__;
  if (!env) {
    throw new Error(
      "Cloudflare bindings unavailable (globalThis.__env__ is not set). " +
        "Run under Wrangler/Workers or `vite dev` with wrangler.toml bindings configured.",
    );
  }
  return env;
}

export function hasCloudflareEnv(): boolean {
  return Boolean((globalThis as { __env__?: CloudflareEnv }).__env__?.DB);
}

export function getDB(): D1Database {
  const { DB } = getCloudflareEnv();
  if (!DB) throw new Error("D1 binding `DB` is not configured — add it to wrangler.toml.");
  return DB;
}

export function getR2(): R2Bucket {
  const { R2 } = getCloudflareEnv();
  if (!R2) throw new Error("R2 binding `R2` is not configured — add it to wrangler.toml.");
  return R2;
}

/**
 * Read a string env var / secret, preferring the Cloudflare binding
 * (globalThis.__env__) and falling back to process.env. Does NOT throw when
 * bindings are absent — returns undefined so callers can decide.
 */
export function getEnvVar(name: string): string | undefined {
  const fromBinding = (globalThis as { __env__?: Record<string, unknown> }).__env__?.[name];
  if (typeof fromBinding === "string") return fromBinding;
  if (typeof process !== "undefined" && process.env && typeof process.env[name] === "string") {
    return process.env[name];
  }
  return undefined;
}

/** New collision-resistant id for D1 rows. */
export function newId(): string {
  return crypto.randomUUID();
}

/** ISO-8601 UTC timestamp used consistently across the schema. */
export function nowIso(): string {
  return new Date().toISOString();
}
