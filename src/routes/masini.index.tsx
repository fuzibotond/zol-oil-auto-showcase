import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { listCars } from "@/lib/api/cars.functions";
import { CarCard } from "@/components/site/CarCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, SITE } from "@/lib/site";
import { JsonLd, seoHead, itemListJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { facetPath, PRICE_BANDS, brandsFromCars, facetStock, isAvailable } from "@/lib/landing";
import { slugify } from "@/lib/format";
import { trackFilter } from "@/lib/analytics";

export const Route = createFileRoute("/masini/")({
  // Guard the read so a transient D1 issue renders an empty inventory, not an error page.
  loader: async () => {
    try {
      return await listCars({ data: {} });
    } catch {
      return [];
    }
  },
  head: () =>
    seoHead({
      title: `Mașini second-hand de vânzare în ${SITE.county} · Parc Auto ZOL-OIL ${SITE.city}`,
      description: `Mașini second-hand verificate tehnic la Parc Auto ZOL-OIL din ${SITE.city}, ${SITE.county}. Filtrează după marcă, model, an, preț, combustibil sau transmisie și vezi stocul actual.`,
      path: "/masini",
    }),
  component: InventoryPage,
});

type SortKey = "newest" | "price-asc" | "price-desc" | "mileage-asc";

function InventoryPage() {
  const cars = Route.useLoaderData();
  const isLoading = false;

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [fuel, setFuel] = useState("");
  const [trans, setTrans] = useState("");
  const [body, setBody] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxKm, setMaxKm] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [openFilters, setOpenFilters] = useState(false);
  // Sold cars are hidden by default so buyers see what they can actually get;
  // they stay one click away (and their pages remain reachable).
  const [showSold, setShowSold] = useState(false);
  const soldCount = useMemo(() => cars.filter((c) => !isAvailable(c)).length, [cars]);

  const brands = useMemo(() => Array.from(new Set(cars.map((c) => c.brand))).sort(), [cars]);

  const filtered = useMemo(() => {
    let list = cars.filter((c) => {
      if (!showSold && !isAvailable(c)) return false;
      if (q && !`${c.brand} ${c.model} ${c.version ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (brand && c.brand !== brand) return false;
      if (fuel && c.fuel_type !== fuel) return false;
      if (trans && c.transmission !== trans) return false;
      if (body && c.body_type !== body) return false;
      if (minPrice && c.price < Number(minPrice)) return false;
      if (maxPrice && c.price > Number(maxPrice)) return false;
      if (minYear && c.year < Number(minYear)) return false;
      if (maxKm && c.mileage > Number(maxKm)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      // Whatever the sort, cars that can still be bought come first.
      const soldDiff = Number(!isAvailable(a)) - Number(!isAvailable(b));
      if (soldDiff) return soldDiff;
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "mileage-asc":
          return a.mileage - b.mileage;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [cars, showSold, q, brand, fuel, trans, body, minPrice, maxPrice, minYear, maxKm, sort]);
  const availableShown = filtered.filter(isAvailable).length;

  // Report which filters buyers actually use (debounced so a burst of keystrokes
  // or dropdown changes becomes a single, meaningful filter_used event).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const active = { q, brand, fuel, trans, body, minPrice, maxPrice, minYear, maxKm, sort };
    if (!q && !brand && !fuel && !trans && !body && !minPrice && !maxPrice && !minYear && !maxKm)
      return;
    const t = setTimeout(() => trackFilter(active), 900);
    return () => clearTimeout(t);
  }, [q, brand, fuel, trans, body, minPrice, maxPrice, minYear, maxKm, sort]);

  // Category links only where unsold stock exists (empty categories are noindex).
  const inStock = useMemo(() => cars.filter(isAvailable), [cars]);
  const brandLinks = useMemo(() => brandsFromCars(inStock).slice(0, 12), [inStock]);
  const stock = useMemo(() => facetStock(cars), [cars]);
  const fuelLinks = stock.fuels;
  const transLinks = stock.transmissions;
  const priceLinks = PRICE_BANDS.filter((b) => stock.priceBands.includes(b.slug));

  function resetAll() {
    setQ("");
    setBrand("");
    setFuel("");
    setTrans("");
    setBody("");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxKm("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Acasă", path: "/" },
            { name: "Mașini", path: "/masini" },
          ]),
          itemListJsonLd(filtered, "/masini"),
        ]}
      />
      <Breadcrumbs items={[{ name: "Acasă", path: "/" }, { name: "Mașini" }]} />
      <div className="mt-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-medium text-accent uppercase tracking-wider">
            Stoc disponibil
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Mașini second-hand de vânzare în {SITE.county}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {availableShown} {availableShown === 1 ? "mașină disponibilă" : "mașini disponibile"} la
            parcul auto din {SITE.city}
            {showSold && filtered.length > availableShown
              ? ` · ${filtered.length - availableShown} vândute`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sortare" className="sr-only">
            Sortează
          </label>
          <select
            id="sortare"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
          >
            <option value="newest">Cele mai noi</option>
            <option value="price-asc">Preț crescător</option>
            <option value="price-desc">Preț descrescător</option>
            <option value="mileage-asc">Kilometraj crescător</option>
          </select>
          <button
            type="button"
            onClick={() => setOpenFilters(!openFilters)}
            aria-expanded={openFilters}
            aria-controls="filtre"
            className="md:hidden inline-flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtre
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside
          id="filtre"
          aria-label="Filtre"
          className={`${openFilters ? "" : "hidden md:block"}`}
        >
          <div className="surface-card p-5 space-y-4 md:sticky md:top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Filtre</h2>
              <button
                type="button"
                onClick={resetAll}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Resetează
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="cautare" className="sr-only">
                Caută marcă sau model
              </label>
              <input
                id="cautare"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Caută marcă, model..."
                className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm"
              />
            </div>
            <Select label="Marcă" value={brand} onChange={setBrand} options={brands} />
            <Select label="Combustibil" value={fuel} onChange={setFuel} options={[...FUEL_TYPES]} />
            <Select
              label="Transmisie"
              value={trans}
              onChange={setTrans}
              options={[...TRANSMISSIONS]}
            />
            <Select label="Caroserie" value={body} onChange={setBody} options={[...BODY_TYPES]} />
            <Range
              label="Preț (€)"
              minVal={minPrice}
              maxVal={maxPrice}
              setMin={setMinPrice}
              setMax={setMaxPrice}
              placeholderMin="Min"
              placeholderMax="Max"
            />
            <Range
              label="An minim / km max"
              minVal={minYear}
              maxVal={maxKm}
              setMin={setMinYear}
              setMax={setMaxKm}
              placeholderMin="An"
              placeholderMax="Km"
            />
            {soldCount > 0 && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSold}
                  onChange={(e) => setShowSold(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Arată și mașinile vândute ({soldCount})
              </label>
            )}
          </div>
        </aside>

        {/* Listing */}
        <div>
          {/* Keeps h1 → h2 → h3 (cards) order even when the filter panel is hidden. */}
          <h2 className="sr-only">Mașini în stoc</h2>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="surface-card overflow-hidden">
                  <div className="aspect-[16/10] bg-muted animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <div className="font-display text-lg font-semibold">
                Nicio mașină nu corespunde filtrelor
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Resetează filtrele sau contactează-ne pentru alte oferte.
              </p>
              <button
                type="button"
                onClick={resetAll}
                className="mt-4 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Resetează filtrele
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c, i) => (
                <CarCard key={c.id} car={c} priority={i === 0} />
              ))}
            </div>
          )}

          {/* Internal linking — crawlable category pages for common searches. */}
          <section className="mt-14 border-t border-border pt-8">
            <h2 className="font-display text-lg font-semibold">Caută mașini după categorie</h2>
            {brandLinks.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Mărci
                </div>
                <div className="flex flex-wrap gap-2">
                  {brandLinks.map((b) => (
                    <a
                      key={b.slug}
                      href={facetPath("marca", b.slug)}
                      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 hover:bg-secondary transition-colors"
                    >
                      {b.name} <span className="text-muted-foreground">({b.count})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Combustibil
              </div>
              <div className="flex flex-wrap gap-2">
                {fuelLinks.map((f) => (
                  <a
                    key={f}
                    href={facetPath("combustibil", slugify(f))}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 hover:bg-secondary transition-colors"
                  >
                    {f}
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Preț
              </div>
              <div className="flex flex-wrap gap-2">
                {priceLinks.map((band) => (
                  <a
                    key={band.slug}
                    href={facetPath("pret", band.slug)}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 hover:bg-secondary transition-colors"
                  >
                    Mașini {band.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Transmisie
              </div>
              <div className="flex flex-wrap gap-2">
                {transLinks.map((t) => (
                  <a
                    key={t}
                    href={facetPath("cutie", slugify(t))}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 hover:bg-secondary transition-colors"
                  >
                    Cutie {t.toLowerCase()}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
      >
        <option value="">Toate</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Range({
  label,
  minVal,
  maxVal,
  setMin,
  setMax,
  placeholderMin,
  placeholderMax,
}: {
  label: string;
  minVal: string;
  maxVal: string;
  setMin: (v: string) => void;
  setMax: (v: string) => void;
  placeholderMin: string;
  placeholderMax: string;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend className="block text-xs font-medium text-muted-foreground mb-1">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <input
          id={`${id}-min`}
          aria-label={`${label}: ${placeholderMin}`}
          inputMode="numeric"
          value={minVal}
          onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
          placeholder={placeholderMin}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
        />
        <input
          id={`${id}-max`}
          aria-label={`${label}: ${placeholderMax}`}
          inputMode="numeric"
          value={maxVal}
          onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
          placeholder={placeholderMax}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
        />
      </div>
    </fieldset>
  );
}
