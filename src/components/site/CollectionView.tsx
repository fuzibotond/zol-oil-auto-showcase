import { Link } from "@tanstack/react-router";
import type { Car } from "@/lib/types";
import type { Facet } from "@/lib/landing";
import { CarCard } from "./CarCard";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { ContactButtons } from "./ContactButtons";

export interface RelatedLink {
  label: string;
  href: string;
}

/**
 * Presentational template shared by every SEO landing page (brand / fuel /
 * transmission / price / zone). Given a resolved facet and its matching cars,
 * it renders a unique H1 + intro, the car grid, internal links to related
 * collections, and JSON-LD (BreadcrumbList + ItemList).
 */
export function CollectionView({
  facet,
  cars,
  path,
  crumbs,
  related,
}: {
  facet: Facet;
  cars: Car[];
  path: string;
  crumbs: Crumb[];
  related: RelatedLink[];
}) {
  const jsonLd: object[] = [
    breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.path ?? path }))),
  ];
  if (cars.length) jsonLd.push(itemListJsonLd(cars, path));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{facet.h1}</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">{facet.intro}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {cars.length} {cars.length === 1 ? "mașină disponibilă" : "mașini disponibile"}
        </p>
      </header>

      {cars.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((c, i) => (
            <CarCard key={c.id} car={c} priority={i === 0} />
          ))}
        </div>
      ) : (
        <div className="mt-8 surface-card p-8 text-center">
          <div className="font-display text-lg font-semibold">
            Momentan nu avem {facet.label} în stoc
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Stocul se schimbă des. Scrie-ne și îți spunem când apare ce cauți — sau vezi toate
            mașinile disponibile acum.
          </p>
          <div className="mx-auto mt-5 max-w-sm">
            <ContactButtons />
          </div>
          <Link
            to="/masini"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Vezi toate mașinile →
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="font-display text-lg font-semibold">Caută și după</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <a
                key={r.href}
                href={r.href}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 hover:bg-secondary transition-colors"
              >
                {r.label}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
