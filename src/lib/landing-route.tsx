// Shared loader / head / component wiring for every SEO landing route.
// Each thin route file (masini.marca.$marca.tsx, etc.) supplies only its literal
// path + param and delegates here, so the behaviour stays consistent.

import { notFound } from "@tanstack/react-router";
import { listCars } from "@/lib/api/cars.functions";
import {
  resolveFacet,
  relatedFacetLinks,
  facetPath,
  facetStock,
  isAvailable,
  type FacetKind,
  type FacetStock,
} from "@/lib/landing";
import { slugify } from "@/lib/format";
import { seoHead } from "@/lib/seo";
import { CollectionView } from "@/components/site/CollectionView";
import type { Car } from "@/lib/types";

export interface LandingLoaderData {
  slug: string;
  kind: FacetKind;
  brandName?: string;
  cars: Car[];
  stock: FacetStock;
}

function sortForListing(a: Car, b: Car): number {
  const feat = (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  if (feat) return feat;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

/** Loader: resolve the facet, fetch inventory, keep unsold matches, sort. */
export async function landingLoader(kind: FacetKind, slug: string): Promise<LandingLoaderData> {
  const facet = resolveFacet(kind, slug);
  if (!facet) throw notFound();
  let all: Car[] = [];
  let loaded = false;
  try {
    all = await listCars({ data: {} });
    loaded = true;
  } catch {
    all = []; // transient D1 issue → render an empty (noindex) collection, not an error
  }
  // Any slug resolves to a brand facet, so a made-up brand would render a 200
  // "no stock" page (a soft 404). Only brands we have (or had) on the site exist.
  if (kind === "marca" && loaded && !all.some((c) => slugify(c.brand) === slug)) {
    throw notFound();
  }
  // Sold cars are not useful on a category page (and would keep it indexable
  // with nothing to buy); they remain reachable via their own detail URL.
  const cars = all.filter((c) => isAvailable(c) && facet.matches(c)).sort(sortForListing);
  const brandName =
    kind === "marca" ? all.find((c) => slugify(c.brand) === slug)?.brand : undefined;
  return { slug, kind, brandName, cars, stock: facetStock(all) };
}

/** head(): SEO tags. Empty collections are noindex,follow (never thin pages). */
export function landingHead(
  data: LandingLoaderData | undefined,
  kind: FacetKind,
  slug: string,
): ReturnType<typeof seoHead> | { meta: Array<Record<string, string>> } {
  const facet = resolveFacet(kind, slug, data?.brandName);
  if (!facet) return { meta: [{ title: "Mașini second-hand · ZOL-OIL" }] };
  const empty = !data || data.cars.length === 0;
  return seoHead({
    title: facet.title,
    description: facet.description,
    path: facetPath(kind, slug),
    noindex: empty,
  });
}

/** Landing page component. */
export function LandingComponent({ data }: { data: LandingLoaderData }) {
  const facet = resolveFacet(data.kind, data.slug, data.brandName)!;
  const path = facetPath(data.kind, data.slug);
  return (
    <CollectionView
      facet={facet}
      cars={data.cars}
      path={path}
      crumbs={[
        { name: "Acasă", path: "/" },
        { name: "Mașini", path: "/masini" },
        { name: facet.label },
      ]}
      related={relatedFacetLinks(path, data.stock)}
    />
  );
}
