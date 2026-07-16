import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// The nitro cloudflare-pages preset attaches Cloudflare bindings (D1/R2) AND
// vars/secrets to the srvx request: `request.runtime.cloudflare.env`. It does NOT
// set `globalThis.__env__` on the fetch path (only in dev / scheduled). This
// request middleware lifts that env onto globalThis.__env__ once per request so
// server code can read it via getCloudflareEnv()/getEnvVar().
//
// Cloudflare env is stable across requests in an isolate (same binding objects),
// so assigning it to a global is safe under concurrency.
export const bindCloudflareEnv = createMiddleware().server(async ({ next }) => {
  const g = globalThis as { __env__?: Record<string, unknown> };
  if (!g.__env__?.DB) {
    const req = getRequest() as unknown as {
      runtime?: { cloudflare?: { env?: Record<string, unknown> } };
    };
    const env = req?.runtime?.cloudflare?.env;
    if (env) g.__env__ = env;
  }
  return next();
});
