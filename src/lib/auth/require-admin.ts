// Server-fn middleware enforcing Cloudflare Access admin authentication.
//
// Replaces the former Supabase `requireSupabaseAuth`. Every admin server
// function must attach this middleware. Security model:
//   1. Cloudflare Access gates /admin* at the edge (owner-configured policy).
//   2. This middleware verifies the Access JWT server-side (signature + AUD + exp)
//      on EVERY admin mutation — so admin RPCs cannot be called without a valid
//      Access session, even if the path config were misconfigured.
//   3. The authenticated email must be in the ADMIN_EMAILS allowlist.
//
// It reads the token from the CF_Authorization cookie (sent same-origin) or the
// Cf-Access-Jwt-Assertion header, so it works whether or not the exact RPC path
// is inside the Access application.

import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { extractAccessToken, isAllowlistedAdmin, verifyAccessToken } from "./access";

export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const token = extractAccessToken(request);
  if (!token) throw new Error("Unauthorized");

  const identity = await verifyAccessToken(token);
  if (!isAllowlistedAdmin(identity.email)) throw new Error("Forbidden");

  return next({ context: { adminEmail: identity.email } });
});
