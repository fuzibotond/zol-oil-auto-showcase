import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Security headers for EVERY response from the Worker (SSR HTML + server fns).
// Cloudflare Pages `_headers` only applies to static assets, NOT to responses
// produced by the Worker — so these must be set here for the actual pages.
// CSP is intentionally omitted here (needs testing against the Google Maps iframe
// + inline styles) — see PRODUCTION_AUDIT.md.
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
  headers.set("Strict-Transport-Security", "max-age=15552000");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Canonical origin (build-time). When the request arrives on the www/apex twin
// of this host (e.g. zoloil.ro vs www.zoloil.ro), 301 to the canonical host so
// only one hostname gets indexed. Other hosts (*.pages.dev previews, localhost)
// are left alone. A Cloudflare Redirect Rule can do the same at the edge.
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

function canonicalHostRedirect(request: Request): Response | null {
  if (!SITE_URL || (request.method !== "GET" && request.method !== "HEAD")) return null;
  let canonical: URL;
  try {
    canonical = new URL(SITE_URL);
  } catch {
    return null;
  }
  const url = new URL(request.url);
  const bare = (host: string) => host.replace(/^www\./, "");
  if (url.host === canonical.host || bare(url.host) !== bare(canonical.host)) return null;
  url.protocol = canonical.protocol;
  url.host = canonical.host;
  return new Response(null, { status: 301, headers: { Location: url.toString() } });
}

// Legacy URLs from the previous PHP site (seen in the Wayback Machine / old
// Google index). Section pages 301 to their equivalent; old car adverts
// (/<id>/<slug>.html, index.php?nr=<id>) have no equivalent — those cars were
// sold years ago — so they get 410 Gone with the normal "page not found" UI.
function legacyRedirect(url: URL): string | null {
  const path = url.pathname.toLowerCase();
  const cat = url.searchParams.get("cat");
  if (path === "/oferta" || (path === "/index.php" && cat === "oferta")) return "/masini";
  if (path === "/index.php" && cat === "contact") return "/contact";
  if (
    (path === "/index.php" && !url.searchParams.has("nr")) ||
    path === "/nyitolap.php" ||
    path === "/index.html"
  ) {
    return "/";
  }
  return null;
}

// One URL per page: "/masini/" and "/MASINI" used to answer 307 / 200, giving
// Google duplicate or temporary-redirect URLs. Redirect them permanently to
// the canonical lowercase, no-trailing-slash path. Percent-escapes (%C8%99)
// keep their case; technical paths (server fns, images, assets) are untouched.
const NO_NORMALIZE = /^\/(_serverFn|img|assets|fonts|hero|api)(\/|$)/;

function normalizedPath(url: URL): string | null {
  const path = url.pathname;
  if (path === "/" || NO_NORMALIZE.test(path)) return null;
  const target = path
    .replace(/\/+$/, "")
    .replace(/%[0-9A-Fa-f]{2}|[A-Z]/g, (m) => (m.length === 3 ? m : m.toLowerCase()));
  return target && target !== path ? target : null;
}

function isLegacyGone(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  return (
    /^\/\d+\/[^/]+\.html$/.test(path) ||
    (path === "/index.php" && url.searchParams.has("nr")) ||
    path === "/show_img.php"
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const hostRedirect = canonicalHostRedirect(request);
      if (hostRedirect) return withSecurityHeaders(hostRedirect);

      const url = new URL(request.url);
      const legacyTarget = legacyRedirect(url);
      if (legacyTarget) {
        return withSecurityHeaders(
          new Response(null, { status: 301, headers: { Location: legacyTarget } }),
        );
      }

      const isRead = request.method === "GET" || request.method === "HEAD";
      const cleanPath = isRead && !isLegacyGone(url) ? normalizedPath(url) : null;
      if (cleanPath) {
        return withSecurityHeaders(
          new Response(null, { status: 301, headers: { Location: cleanPath + url.search } }),
        );
      }

      const handler = await getServerEntry();
      let response = await handler.fetch(request, env, ctx);
      if (response.status === 404 && isLegacyGone(url)) {
        response = new Response(response.body, {
          status: 410,
          statusText: "Gone",
          headers: response.headers,
        });
      }
      const out = withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
      // Belt and braces next to robots.txt: private areas must never be indexed.
      if (/^\/(admin|auth)(\/|$)/.test(url.pathname)) {
        out.headers.set("X-Robots-Tag", "noindex, nofollow");
      }
      return out;
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
