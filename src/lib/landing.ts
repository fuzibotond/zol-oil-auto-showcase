// SEO landing-page configuration.
//
// Each landing page targets a real Romanian search intent (a brand, a fuel type,
// a transmission or a price band) and is backed by real, unsold inventory. Pages
// with zero matching cars are rendered with noindex so we never publish thin
// pages. There are deliberately NO per-city pages: they would all list the same
// stock (doorway pages) — local relevance lives on the home/contact pages.
// Copy is written to be genuinely useful, not keyword-stuffed.

import type { Car } from "@/lib/types";
import { FUEL_TYPES, TRANSMISSIONS, SITE } from "@/lib/site";
import { slugify } from "@/lib/format";

export type FacetKind = "marca" | "combustibil" | "cutie" | "pret";

/** Cars a buyer can still get (everything except sold). */
export function isAvailable(car: Pick<Car, "status">): boolean {
  return car.status !== "vandut";
}

export interface Facet {
  kind: FacetKind;
  slug: string;
  /** Short human label, e.g. "Volkswagen", "Diesel", "sub 10.000 €". */
  label: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  matches: (car: Car) => boolean;
  /** Path prefix segment used in URLs, e.g. "marca". */
  segment: FacetKind;
}

const CITY = SITE.city;
const COUNTY = SITE.county;

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------
export function brandFacet(brandSlug: string, brandName?: string): Facet {
  const label = brandName ?? deSlug(brandSlug);
  return {
    kind: "marca",
    segment: "marca",
    slug: brandSlug,
    label,
    h1: `${label} second-hand de vânzare`,
    title: `${label} second-hand de vânzare în ${COUNTY} | Parc Auto ZOL-OIL`,
    description: `Mașini ${label} rulate, verificate tehnic, disponibile la Parc Auto ZOL-OIL din ${CITY}, ${COUNTY}. Vezi stocul actual de ${label}, cu preț, an, kilometraj și combustibil.`,
    intro: `Cauți un ${label} second-hand? La Parc Auto ZOL-OIL din ${CITY}, județul ${COUNTY}, găsești modele ${label} verificate tehnic și pregătite de drum. Filtrează după an, kilometraj, combustibil sau transmisie și vino la o probă pe drum.`,
    matches: (c) => slugify(c.brand) === brandSlug,
  };
}

// ---------------------------------------------------------------------------
// Fuel
// ---------------------------------------------------------------------------
const FUEL_BY_SLUG: Record<string, (typeof FUEL_TYPES)[number]> = Object.fromEntries(
  FUEL_TYPES.map((f) => [slugify(f), f]),
);

export function fuelFacetFromSlug(slug: string): Facet | null {
  const fuel = FUEL_BY_SLUG[slug];
  if (!fuel) return null;
  return {
    kind: "combustibil",
    segment: "combustibil",
    slug,
    label: fuel,
    h1: `Mașini ${fuel.toLowerCase()} second-hand`,
    title: `Mașini ${fuel.toLowerCase()} second-hand în ${COUNTY} | ZOL-OIL ${CITY}`,
    description: `Mașini second-hand cu motor ${fuel.toLowerCase()}, verificate tehnic, la Parc Auto ZOL-OIL din ${CITY}, ${COUNTY}. Vezi ofertele actuale de autoturisme ${fuel.toLowerCase()}.`,
    intro: `Autoturisme second-hand cu alimentare ${fuel.toLowerCase()}, disponibile în parcul auto ZOL-OIL din ${CITY}, ${COUNTY}. Fiecare mașină este verificată tehnic înainte de vânzare.`,
    matches: (c) => c.fuel_type === fuel,
  };
}

// ---------------------------------------------------------------------------
// Transmission
// ---------------------------------------------------------------------------
const TRANS_BY_SLUG: Record<string, (typeof TRANSMISSIONS)[number]> = Object.fromEntries(
  TRANSMISSIONS.map((t) => [slugify(t), t]),
);

export function transmissionFacetFromSlug(slug: string): Facet | null {
  const trans = TRANS_BY_SLUG[slug];
  if (!trans) return null;
  const lower = trans.toLowerCase();
  // "Automată" → "automate", "Manuală" → "manuale" (natural Romanian plural).
  const plural = trans === "Automată" ? "automate" : "manuale";
  return {
    kind: "cutie",
    segment: "cutie",
    slug,
    label: `cutie ${lower}`,
    h1: `Mașini ${plural} second-hand`,
    title: `Mașini ${plural} second-hand în ${COUNTY} | Parc Auto ZOL-OIL ${CITY}`,
    description: `Mașini second-hand cu transmisie ${lower}, verificate tehnic, la Parc Auto ZOL-OIL din ${CITY}, ${COUNTY}. Vezi stocul actual.`,
    intro: `Autoturisme rulate cu cutie de viteze ${lower}, disponibile la ZOL-OIL în ${CITY}, ${COUNTY}. Toate mașinile sunt verificate tehnic la achiziție.`,
    matches: (c) => c.transmission === trans,
  };
}

// ---------------------------------------------------------------------------
// Price bands (EUR)
// ---------------------------------------------------------------------------
export interface PriceBand {
  slug: string;
  label: string;
  min?: number;
  max?: number;
}

// Few, mostly non-overlapping bands matched to the actual stock (most cars are
// 2.000–10.000 €). Overlapping bands would create near-duplicate pages.
export const PRICE_BANDS: PriceBand[] = [
  { slug: "sub-3000-euro", label: "sub 3.000 €", max: 3000 },
  { slug: "sub-5000-euro", label: "sub 5.000 €", max: 5000 },
  { slug: "5000-10000-euro", label: "între 5.000 și 10.000 €", min: 5000, max: 10000 },
  { slug: "peste-10000-euro", label: "peste 10.000 €", min: 10000 },
];

/** True when the car's price falls inside the band. */
export function inPriceBand(car: Pick<Car, "price">, band: PriceBand): boolean {
  return (band.min == null || car.price >= band.min) && (band.max == null || car.price <= band.max);
}

export function priceFacetFromSlug(slug: string): Facet | null {
  const band = PRICE_BANDS.find((b) => b.slug === slug);
  if (!band) return null;
  return {
    kind: "pret",
    segment: "pret",
    slug,
    label: `mașini ${band.label}`,
    h1: `Mașini second-hand ${band.label}`,
    title: `Mașini second-hand ${band.label} în ${COUNTY} | Parc Auto ZOL-OIL`,
    description: `Mașini rulate ${band.label}, verificate tehnic, la Parc Auto ZOL-OIL din ${CITY}, ${COUNTY}. Vezi ofertele actuale în această gamă de preț.`,
    intro: `Autoturisme second-hand ${band.label}, disponibile în parcul auto ZOL-OIL din ${CITY}, ${COUNTY}. Prețurile afișate sunt în euro.`,
    matches: (c) => inPriceBand(c, band),
  };
}

// ---------------------------------------------------------------------------
// Resolver + related links
// ---------------------------------------------------------------------------
/** Resolve a facet from its kind + slug. Returns null for unknown slugs. */
export function resolveFacet(kind: FacetKind, slug: string, brandName?: string): Facet | null {
  switch (kind) {
    case "marca":
      return brandFacet(slug, brandName);
    case "combustibil":
      return fuelFacetFromSlug(slug);
    case "cutie":
      return transmissionFacetFromSlug(slug);
    case "pret":
      return priceFacetFromSlug(slug);
    default:
      return null;
  }
}

/** Path for a facet. */
export function facetPath(kind: FacetKind, slug: string): string {
  return `/masini/${kind}/${slug}`;
}

/**
 * A curated set of internal links to related collections, excluding the current
 * page. Powers the "Caută și după" internal-linking block on landing pages.
 */
export function relatedFacetLinks(currentPath: string): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];
  for (const f of FUEL_TYPES) links.push({ label: f, href: facetPath("combustibil", slugify(f)) });
  for (const t of TRANSMISSIONS)
    links.push({ label: `Cutie ${t.toLowerCase()}`, href: facetPath("cutie", slugify(t)) });
  for (const b of PRICE_BANDS)
    links.push({ label: `Preț ${b.label}`, href: facetPath("pret", b.slug) });
  return links.filter((l) => l.href !== currentPath);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function deSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Distinct brands present in the inventory, as {slug, name, count}. */
export function brandsFromCars(cars: Car[]): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const c of cars) {
    const slug = slugify(c.brand);
    const existing = map.get(slug);
    if (existing) existing.count++;
    else map.set(slug, { slug, name: c.brand, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
