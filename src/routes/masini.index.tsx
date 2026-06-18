import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { listCars } from "@/lib/api/cars.functions";
import { CarCard } from "@/components/site/CarCard";
import { FUEL_TYPES, TRANSMISSIONS, BODY_TYPES } from "@/lib/site";

export const Route = createFileRoute("/masini/")({
  head: () => ({
    meta: [
      { title: "Mașini disponibile · Parc Auto ZOL-OIL Cernat" },
      { name: "description", content: "Vezi toate mașinile disponibile la Parc Auto ZOL-OIL din Cernat. Filtrează după marcă, an, preț, combustibil sau transmisie." },
      { property: "og:title", content: "Mașini disponibile · ZOL-OIL" },
      { property: "og:description", content: "Mașini second-hand verificate, disponibile în parcul auto din Cernat." },
      { property: "og:url", content: "/masini" },
    ],
    links: [{ rel: "canonical", href: "/masini" }],
  }),
  component: InventoryPage,
});

type SortKey = "newest" | "price-asc" | "price-desc" | "mileage-asc";

function InventoryPage() {
  const fetchCars = useServerFn(listCars);
  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["cars", "all"],
    queryFn: () => fetchCars({ data: {} }),
  });

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

  const brands = useMemo(() => Array.from(new Set(cars.map((c) => c.brand))).sort(), [cars]);

  const filtered = useMemo(() => {
    let list = cars.filter((c) => {
      if (q && !`${c.brand} ${c.model} ${c.version ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
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
      switch (sort) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "mileage-asc": return a.mileage - b.mileage;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [cars, q, brand, fuel, trans, body, minPrice, maxPrice, minYear, maxKm, sort]);

  function resetAll() {
    setQ(""); setBrand(""); setFuel(""); setTrans(""); setBody("");
    setMinPrice(""); setMaxPrice(""); setMinYear(""); setMaxKm("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-medium text-accent uppercase tracking-wider">Stoc disponibil</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Mașini disponibile</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "mașină" : "mașini"}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
            <option value="newest">Cele mai noi</option>
            <option value="price-asc">Preț crescător</option>
            <option value="price-desc">Preț descrescător</option>
            <option value="mileage-asc">Kilometraj crescător</option>
          </select>
          <button onClick={() => setOpenFilters(!openFilters)} className="md:hidden inline-flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
            <SlidersHorizontal className="h-4 w-4" /> Filtre
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className={`${openFilters ? "" : "hidden md:block"}`}>
          <div className="surface-card p-5 space-y-4 md:sticky md:top-20">
            <div className="flex items-center justify-between">
              <div className="font-display font-semibold">Filtre</div>
              <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <X className="h-3 w-3" /> Resetează
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută marcă, model..." className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm" />
            </div>
            <Select label="Marcă" value={brand} onChange={setBrand} options={brands} />
            <Select label="Combustibil" value={fuel} onChange={setFuel} options={[...FUEL_TYPES]} />
            <Select label="Transmisie" value={trans} onChange={setTrans} options={[...TRANSMISSIONS]} />
            <Select label="Caroserie" value={body} onChange={setBody} options={[...BODY_TYPES]} />
            <Range label="Preț (€)" minVal={minPrice} maxVal={maxPrice} setMin={setMinPrice} setMax={setMaxPrice} placeholderMin="Min" placeholderMax="Max" />
            <Range label="An minim / km max" minVal={minYear} maxVal={maxKm} setMin={setMinYear} setMax={setMaxKm} placeholderMin="An" placeholderMax="Km" />
          </div>
        </aside>

        {/* Listing */}
        <div>
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
              <div className="font-display text-lg font-semibold">Nicio mașină nu corespunde filtrelor</div>
              <p className="mt-1 text-sm text-muted-foreground">Resetează filtrele sau contactează-ne pentru alte oferte.</p>
              <button onClick={resetAll} className="mt-4 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">Resetează filtrele</button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
        <option value="">Toate</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Range({ label, minVal, maxVal, setMin, setMax, placeholderMin, placeholderMax }: { label: string; minVal: string; maxVal: string; setMin: (v: string) => void; setMax: (v: string) => void; placeholderMin: string; placeholderMax: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input inputMode="numeric" value={minVal} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={placeholderMin} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
        <input inputMode="numeric" value={maxVal} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={placeholderMax} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
      </div>
    </div>
  );
}
