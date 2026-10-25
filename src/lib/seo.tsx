// Centralised SEO helpers: absolute URL building, <head> meta/OG/canonical
// construction, and JSON-LD structured-data builders.
//
// Why absolute URLs matter: canonical + og:url must be absolute for Google and
// social scrapers to resolve them correctly. VITE_SITE_URL is the canonical
// origin (no trailing slash), inlined at BUILD time by Vite — set it in the
// Cloudflare Pages build environment (e.g. https://zoloil.ro).

import type { Car, CompanyInfo } from "@/lib/types";
import type { SiteSettingsInput } from "@/lib/site";
import { SITE, isPlaceholderPhone } from "@/lib/site";
import { fmtKm, fmtPrice } from "@/lib/format";

/** Canonical origin, no trailing slash. Empty when unset (dev / preview). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

/** Default social share image: 1200×630 JPEG generated from the hero photo. */
export const DEFAULT_OG_IMAGE_PATH = "/og-image.jpg";

/**
 * Resolve a path or partial URL to an absolute URL against SITE_URL.
 * - Absolute http(s) URLs are returned unchanged.
 * - Root-relative paths (e.g. "/img/abc", "/masini") are prefixed with SITE_URL.
 * - If SITE_URL is unset, the input is returned as-is (best effort in dev).
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return SITE_URL || "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return SITE_URL ? `${SITE_URL}${path}` : path;
}

export interface SeoInput {
  title: string;
  description: string;
  /** Root-relative path for this page, e.g. "/masini". Used for canonical + og:url. */
  path: string;
  /** Image URL/path; absolutised. Defaults to the site OG image. */
  image?: string | null;
  /** og:type — "website" (default) or "product" for car detail. */
  type?: "website" | "product" | "article";
  /** When true, emits noindex,follow (used for empty landing pages, sold cars). */
  noindex?: boolean;
}

/**
 * Build the `meta` + `links` arrays for a TanStack route `head()`.
 * Produces title, description, robots, canonical, Open Graph and Twitter tags
 * with absolute URLs throughout.
 */
export function seoHead(input: SeoInput): {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
} {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.image || DEFAULT_OG_IMAGE_PATH);
  const type = input.type ?? "website";

  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: input.description },
    {
      name: "robots",
      content: input.noindex ? "noindex,follow" : "index,follow,max-image-preview:large",
    },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    // Dimensions are only known for the default share image.
    ...(input.image
      ? []
      : [
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
        ]),
    { property: "og:locale", content: "ro_RO" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
  ];

  return { meta, links: [{ rel: "canonical", href: url }] };
}

// ---------------------------------------------------------------------------
// JSON-LD component
// ---------------------------------------------------------------------------
/**
 * Renders one or more JSON-LD blocks. Rendered inside route components so the
 * markup is present in the server-rendered HTML (Google reads JSON-LD anywhere
 * in the document, not only <head>).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Structured data is serialised by us from typed values (no user HTML),
          // and </script> sequences are escaped defensively.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Structured-data builders
// ---------------------------------------------------------------------------
const ORG_ID = () => `${SITE_URL || ""}/#organization`;

/**
 * Split a free-text address like "661, DN11, 527070 Cernat, Romania" into the
 * street part and the 6-digit Romanian postal code. Returns null when there is
 * no postal code (e.g. the bare "Cernat, jud. Covasna, România" fallback).
 */
export function parseAddress(address: string): { street: string; postalCode: string } | null {
  const m = address.match(/^(.*?),?\s*\b(\d{6})\b/);
  if (!m || !m[1].trim()) return null;
  return { street: m[1].trim().replace(/,$/, ""), postalCode: m[2] };
}

/**
 * AutoDealer node — the dealership entity. Contact/address come only from the
 * live admin settings (never hardcoded) and placeholder NAP data is skipped.
 */
export function organizationJsonLd(
  settings?: SiteSettingsInput | null,
  company?: CompanyInfo | null,
) {
  const sameAs = (settings?.social_links ?? []).filter((s) => s.enabled && s.url).map((s) => s.url);
  if (!settings && SITE.facebook) sameAs.push(SITE.facebook);

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": ORG_ID(),
    name: SITE.name,
    // Legal name only once the owner has marked it verified in the admin panel.
    ...(company?.legal_name && company.verified_fields?.includes("legal_name")
      ? { legalName: company.legal_name }
      : {}),
    url: SITE_URL || undefined,
    logo: absoluteUrl("/web-app-manifest-512x512.png"),
    image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    description: SITE.tagline,
    areaServed: [SITE.county, "România"],
    ...(sameAs.length ? { sameAs } : {}),
  };
  const phone = settings?.phone?.trim();
  if (phone && !isPlaceholderPhone(phone)) node.telephone = phone.replace(/[^\d+]/g, "");
  if (settings?.contact_email) node.email = settings.contact_email;
  const parsed = settings?.address ? parseAddress(settings.address.trim()) : null;
  node.address = {
    "@type": "PostalAddress",
    ...(parsed ? { streetAddress: parsed.street, postalCode: parsed.postalCode } : {}),
    addressLocality: SITE.city,
    addressRegion: SITE.county,
    addressCountry: "RO",
  };
  if (settings?.maps_url) node.hasMap = settings.maps_url;
  return node;
}

/** WebSite node. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL || ""}/#website`,
    url: SITE_URL || undefined,
    name: SITE.name,
    inLanguage: "ro-RO",
    ...(SITE_URL
      ? {
          publisher: { "@id": ORG_ID() },
        }
      : {}),
  };
}

/** BreadcrumbList from an ordered list of {name, path}. */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** Map a car status to a schema.org availability URL. */
export function availabilityFor(status: string): string {
  switch (status) {
    case "vandut":
      return "https://schema.org/SoldOut";
    case "rezervat":
      return "https://schema.org/LimitedAvailability";
    case "in-curand":
      return "https://schema.org/PreOrder";
    default:
      // "disponibil" and "nou-sosit" (just arrived) are both on the lot.
      return "https://schema.org/InStock";
  }
}

/** Vehicle (Car) + Offer structured data for a car detail page. */
export function vehicleJsonLd(car: Car, path: string) {
  const url = absoluteUrl(path);
  const images = (car.images ?? []).map((im) => absoluteUrl(im.url)).slice(0, 8);
  const description = car.description?.trim();

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${carName(car)} ${car.year}`,
    url,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    productionDate: String(car.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileage,
      unitCode: "KMT",
    },
    fuelType: car.fuel_type,
    vehicleTransmission: car.transmission,
    itemCondition: "https://schema.org/UsedCondition",
    ...(car.version ? { vehicleConfiguration: car.version } : {}),
    ...(description ? { description: description.slice(0, 500) } : {}),
    ...(images.length ? { image: images } : {}),
    ...(car.color ? { color: car.color } : {}),
    ...(car.body_type ? { bodyType: car.body_type } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: car.currency || "EUR",
      price: car.price,
      availability: availabilityFor(car.status),
      itemCondition: "https://schema.org/UsedCondition",
      url,
      seller: {
        ...(SITE_URL ? { "@id": ORG_ID() } : {}),
        "@type": "AutoDealer",
        name: SITE.name,
      },
    },
  };

  const engine: Record<string, unknown> = {};
  if (car.engine_size) {
    engine.engineDisplacement = {
      "@type": "QuantitativeValue",
      value: car.engine_size,
      unitCode: "CMQ",
    };
  }
  if (car.power) {
    engine.enginePower = {
      "@type": "QuantitativeValue",
      value: car.power,
      unitCode: "N12", // metric horsepower (CP)
    };
  }
  if (Object.keys(engine).length) {
    node.vehicleEngine = { "@type": "EngineSpecification", ...engine };
  }
  return node;
}

/** ItemList of cars for listing / landing pages (helps discovery). */
export function itemListJsonLd(cars: Car[], listPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absoluteUrl(listPath),
    numberOfItems: cars.length,
    itemListElement: cars.slice(0, 50).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/masini/${c.slug}`),
      name: `${carName(c)} ${c.year}`,
    })),
  };
}

/** "Brand Model Version" display name. */
export function carName(car: Pick<Car, "brand" | "model" | "version">): string {
  return [car.brand, car.model, car.version].filter(Boolean).join(" ");
}

/**
 * Unique, descriptive <title> for a car page:
 * "[Marcă] [Model] [Versiune] [An] – [Combustibil] | ZOL-OIL Cernat".
 * A long version is dropped and the engine size shown instead, so the title
 * stays short and near-identical cars still differ.
 */
export function carTitle(car: Car): string {
  const full = carName(car);
  const useVersion = Boolean(car.version) && full.length <= 40;
  const engine = car.engine_size ? (car.engine_size / 1000).toFixed(1) : "";
  const spec = useVersion ? car.fuel_type : [engine, car.fuel_type].filter(Boolean).join(" ");
  const name = useVersion ? full : `${car.brand} ${car.model}`;
  const prefix = car.status === "vandut" ? "Vândut: " : "";
  return `${prefix}${name} ${car.year} – ${spec} | ZOL-OIL ${SITE.city}`;
}

/** Compact meta description for a single car (sold cars point to the stock). */
export function carMetaDescription(car: Car): string {
  if (car.status === "vandut") {
    return `${carName(car)} (${car.year}) a fost vândut. Vezi mașinile second-hand disponibile acum la Parc Auto ZOL-OIL din ${SITE.city}, jud. ${SITE.county}.`;
  }
  const bits = [
    carName(car),
    `an ${car.year}`,
    fmtKm(car.mileage),
    car.fuel_type,
    car.transmission,
    car.power ? `${car.power} CP` : "",
    `preț ${fmtPrice(car.price, car.currency)}`,
  ].filter(Boolean);
  return `${bits.join(", ")}. Mașină second-hand la Parc Auto ZOL-OIL, ${SITE.city}, jud. ${SITE.county}. Sună sau scrie pe WhatsApp.`;
}
