// Cloudflare Access (Zero Trust) JWT verification — server only.
//
// Cloudflare injects a signed JWT for authenticated users of an Access
// application, both as the `Cf-Access-Jwt-Assertion` request header and as the
// `CF_Authorization` cookie (scoped to the app hostname, path=/). We verify the
// RS256 signature against the team's JWKS, check the audience (AUD) and expiry,
// and return the authenticated identity.
//
// Config (secrets/vars):
//   ACCESS_TEAM_DOMAIN  e.g. "myteam.cloudflareaccess.com"
//   ACCESS_AUD          the Access application's Audience (AUD) tag

import { getEnvVar } from "@/lib/db/env";

export interface AccessIdentity {
  email: string;
  sub: string;
}

interface Jwk extends JsonWebKey {
  kid: string;
}
interface Jwks {
  keys: Jwk[];
}

const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour
let jwksCache: { team: string; fetchedAt: number; keys: Map<string, CryptoKey> } | null = null;

function b64urlToBytes(input: string): Uint8Array {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToString(input: string): string {
  return new TextDecoder().decode(b64urlToBytes(input));
}

async function loadKeys(team: string): Promise<Map<string, CryptoKey>> {
  if (jwksCache && jwksCache.team === team && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access JWKS fetch failed: ${res.status}`);
  const jwks = (await res.json()) as Jwks;
  const keys = new Map<string, CryptoKey>();
  for (const jwk of jwks.keys) {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    keys.set(jwk.kid, key);
  }
  jwksCache = { team, fetchedAt: Date.now(), keys };
  return keys;
}

/**
 * Verify a Cloudflare Access JWT. Throws on any failure. Returns the identity
 * on success. NEVER trust the token contents without a successful return here.
 */
export async function verifyAccessToken(token: string): Promise<AccessIdentity> {
  const team = getEnvVar("ACCESS_TEAM_DOMAIN");
  const aud = getEnvVar("ACCESS_AUD");
  if (!team || !aud) {
    throw new Error("Cloudflare Access not configured (ACCESS_TEAM_DOMAIN / ACCESS_AUD missing).");
  }

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed Access token");
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = JSON.parse(b64urlToString(headerB64)) as { kid?: string; alg?: string };
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unexpected Access token header");

  const keys = await loadKeys(team);
  const key = keys.get(header.kid);
  if (!key) throw new Error("Unknown Access signing key");

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(signatureB64) as unknown as BufferSource,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`) as unknown as BufferSource,
  );
  if (!valid) throw new Error("Invalid Access token signature");

  const claims = JSON.parse(b64urlToString(payloadB64)) as {
    email?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
  };

  const auds = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (!auds.includes(aud)) throw new Error("Access token audience mismatch");
  if (claims.exp && Date.now() / 1000 > claims.exp) throw new Error("Access token expired");
  if (!claims.email) throw new Error("Access token missing email");

  return { email: claims.email.toLowerCase(), sub: claims.sub ?? claims.email };
}

/** Extract the Access JWT from a request: header first, then CF_Authorization cookie. */
export function extractAccessToken(request: Request | undefined): string | null {
  if (!request?.headers) return null;
  const header = request.headers.get("cf-access-jwt-assertion");
  if (header) return header;
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "CF_Authorization") return rest.join("=");
  }
  return null;
}

/**
 * Assert the request is from an allowlisted admin (for server-ROUTE handlers,
 * which don't use the `requireAdmin` server-fn middleware). Returns the email
 * or throws.
 */
export async function assertAdminRequest(request: Request | undefined): Promise<string> {
  const token = extractAccessToken(request);
  if (!token) throw new Error("Unauthorized");
  const identity = await verifyAccessToken(token);
  if (!isAllowlistedAdmin(identity.email)) throw new Error("Forbidden");
  return identity.email;
}

/** Comma-separated ADMIN_EMAILS allowlist (defense-in-depth over the Access policy). */
export function isAllowlistedAdmin(email: string): boolean {
  const raw = getEnvVar("ADMIN_EMAILS");
  if (!raw) return false;
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
