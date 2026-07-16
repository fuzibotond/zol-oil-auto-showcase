import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { adoptRequestEnv } from "@/lib/db/env";

const BASE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        adoptRequestEnv(request);
        const entries: {
          path: string;
          changefreq?: string;
          priority?: string;
          lastmod?: string;
        }[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/masini", changefreq: "daily", priority: "0.9" },
          { path: "/despre-noi", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
        ];

        try {
          const repo = await import("@/lib/db/repository");
          const cars = await repo.listCarSlugs();
          for (const c of cars) {
            entries.push({
              path: `/masini/${c.slug}`,
              changefreq: "weekly",
              priority: "0.8",
              lastmod: new Date(c.updated_at).toISOString(),
            });
          }
        } catch {
          // D1 not reachable yet — still emit the static routes below.
        }

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
