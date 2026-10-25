import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { adoptRequestEnv } from "@/lib/db/env";
import { brandsFromCars, facetStock, isAvailable } from "@/lib/landing";
import { slugify } from "@/lib/format";

const BASE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

interface Entry {
  path: string;
  lastmod?: string;
  image?: string;
}

// Only canonical, indexable URLs belong here:
// - hidden cars are excluded by listCars();
// - sold cars are excluded (their pages are noindex and point to the stock);
// - landing pages are listed only when they have unsold matching cars
//   (otherwise they render noindex).
// changefreq/priority are omitted on purpose — Google ignores them; lastmod is
// only emitted where it reflects a real content change (car updated_at).
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        adoptRequestEnv(request);
        const entries: Entry[] = [
          { path: "/" },
          { path: "/masini" },
          { path: "/despre-noi" },
          { path: "/contact" },
          { path: "/confidentialitate" },
          { path: "/politica-cookie" },
          { path: "/termeni" },
        ];

        try {
          const repo = await import("@/lib/db/repository");
          const cars = (await repo.listCars({})).filter(isAvailable);

          // Newest change across the stock = when the listing pages last changed.
          const newest = cars.reduce<string | undefined>(
            (max, c) => (!max || c.updated_at > max ? c.updated_at : max),
            undefined,
          );
          if (newest) {
            const iso = new Date(newest).toISOString();
            entries[0].lastmod = iso;
            entries[1].lastmod = iso;
          }

          // Individual car detail pages (with primary image for image sitemap).
          for (const c of cars) {
            entries.push({
              path: `/masini/${c.slug}`,
              lastmod: new Date(c.updated_at).toISOString(),
              image: c.images?.[0]?.url,
            });
          }

          for (const b of brandsFromCars(cars)) entries.push({ path: `/masini/marca/${b.slug}` });
          // Same rule as the on-site category links: only categories with stock.
          const stock = facetStock(cars);
          for (const f of stock.fuels) entries.push({ path: `/masini/combustibil/${slugify(f)}` });
          for (const t of stock.transmissions)
            entries.push({ path: `/masini/cutie/${slugify(t)}` });
          for (const slug of stock.priceBands) entries.push({ path: `/masini/pret/${slug}` });
        } catch {
          // D1 not reachable — still emit the static routes above.
        }

        const esc = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const absImg = (u: string) => (/^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`);

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${esc(`${BASE_URL}${e.path}`)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.image
              ? `    <image:image><image:loc>${esc(absImg(e.image))}</image:loc></image:image>`
              : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
