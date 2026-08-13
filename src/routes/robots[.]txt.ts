import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Dynamic robots.txt so the Sitemap URL always matches the deployed origin
// (VITE_SITE_URL). Set VITE_SITE_URL in the Pages env (e.g. https://nou.zoloil.ro).
const BASE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const lines = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /auth",
          ...(BASE_URL ? [`Sitemap: ${BASE_URL}/sitemap.xml`] : []),
          "",
        ];
        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
