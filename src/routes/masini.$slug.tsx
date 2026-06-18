import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft, Calendar, Cog, Fuel, Gauge, Palette, Zap,
  Car as CarIcon, Share2, ChevronLeft, ChevronRight,
  CheckCircle2, Phone, MessageCircle, Send,
} from "lucide-react";
import { getCarBySlug, similarCars } from "@/lib/api/cars.functions";
import { fmtKm, fmtPrice, fmtNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { StatusBadge } from "@/components/site/StatusBadge";
import { LeadForm } from "@/components/site/LeadForm";
import { CarCard } from "@/components/site/CarCard";

const PLACEHOLDER = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80&auto=format&fit=crop";

export const Route = createFileRoute("/masini/$slug")({
  loader: async ({ params }) => {
    const car = await getCarBySlug({ data: params.slug });
    if (!car) throw notFound();
    return { car };
  },
  head: ({ loaderData, params }) => {
    const car = loaderData?.car;
    if (!car) return { meta: [{ title: "Mașină · ZOL-OIL" }] };
    const title = `${car.brand} ${car.model} ${car.year} ${car.transmission} de vânzare | ZOL-OIL Cernat`;
    const desc = `${car.brand} ${car.model}${car.version ? " " + car.version : ""}, an ${car.year}, ${fmtKm(car.mileage)}, ${car.fuel_type}, ${car.transmission}. Preț ${fmtPrice(car.price, car.currency)}. Parc Auto ZOL-OIL Cernat.`;
    const img = car.images?.[0]?.url;
    const ogUrl = `/masini/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: ogUrl },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: ogUrl }],
    };
  },
  component: CarDetail,
});

type Tab = "specs" | "descriere" | "dotari";

function CarDetail() {
  const { car } = Route.useLoaderData() as { car: import("@/lib/types").Car };
  const fetchSimilar = useServerFn(similarCars);
  const { data: similar = [] } = useQuery({
    queryKey: ["similar", car.id],
    queryFn: () => fetchSimilar({ data: { excludeId: car.id, brand: car.brand } }),
  });

  const images = car.images && car.images.length ? car.images : [{ id: "p", url: PLACEHOLDER, alt_text: null, sort_order: 0, car_id: car.id }];
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("specs");
  const title = `${car.brand} ${car.model}`;
  const waMsg = encodeURIComponent(`Bună ziua, sunt interesat de ${title} (${car.year}) — ${SITE.city}`);

  const tabs: { id: Tab; label: string }[] = [
    { id: "specs", label: "Specificații" },
    ...(car.description ? [{ id: "descriere" as Tab, label: "Descriere" }] : []),
    ...(car.equipment?.length ? [{ id: "dotari" as Tab, label: `Dotări (${car.equipment.length})` }] : []),
  ];

  function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => {});
    } else if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  return (
    <div className="pb-28 md:pb-0">
      {/* ── Hero band ── */}
      <div className="bg-secondary/60 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/masini" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Înapoi la mașini
          </Link>
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> Distribuie
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* Title block */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={car.status} />
                {car.is_featured && (
                  <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background">
                    Recomandat
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
              {car.version && <p className="mt-1 text-base text-muted-foreground">{car.version}</p>}

              {/* Quick-glance chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip icon={<Calendar className="h-3.5 w-3.5" />} label={String(car.year)} />
                <Chip icon={<Gauge className="h-3.5 w-3.5" />} label={fmtKm(car.mileage)} />
                <Chip icon={<Fuel className="h-3.5 w-3.5" />} label={car.fuel_type} />
                <Chip icon={<Cog className="h-3.5 w-3.5" />} label={car.transmission} />
                {car.power && <Chip icon={<Zap className="h-3.5 w-3.5" />} label={`${car.power} CP`} />}
                {car.body_type && <Chip icon={<CarIcon className="h-3.5 w-3.5" />} label={car.body_type} />}
              </div>
            </div>

            {/* Gallery */}
            <div className="surface-card overflow-hidden">
              <div className="relative bg-secondary/40" style={{ aspectRatio: "16/9" }}>
                <img
                  src={images[idx].url}
                  alt={images[idx].alt_text ?? title}
                  className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-full bg-background/90 backdrop-blur shadow-md hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-full bg-background/90 backdrop-blur shadow-md hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 text-background px-2.5 py-1 text-xs font-medium backdrop-blur">
                      {idx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setIdx(i)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        i === idx ? "border-accent shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img.url} alt={img.alt_text ?? ""} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab bar */}
            {tabs.length > 1 && (
              <div className="flex gap-1 rounded-2xl bg-secondary/60 p-1 border border-border">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      tab === t.id
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tab: Specs */}
            {tab === "specs" && (
              <div className="surface-card p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                  <SpecBlock icon={<Calendar className="h-4 w-4" />} label="An fabricație" value={String(car.year)} />
                  <SpecBlock icon={<Gauge className="h-4 w-4" />} label="Kilometraj" value={fmtKm(car.mileage)} />
                  <SpecBlock icon={<Fuel className="h-4 w-4" />} label="Combustibil" value={car.fuel_type} />
                  <SpecBlock icon={<Cog className="h-4 w-4" />} label="Transmisie" value={car.transmission} />
                  {car.engine_size ? <SpecBlock icon={<CarIcon className="h-4 w-4" />} label="Capacitate" value={`${fmtNumber(car.engine_size)} cm³`} /> : null}
                  {car.power ? <SpecBlock icon={<Zap className="h-4 w-4" />} label="Putere" value={`${car.power} CP`} /> : null}
                  {car.body_type ? <SpecBlock icon={<CarIcon className="h-4 w-4" />} label="Caroserie" value={car.body_type} /> : null}
                  {car.color ? <SpecBlock icon={<Palette className="h-4 w-4" />} label="Culoare" value={car.color} /> : null}
                </div>
              </div>
            )}

            {/* Tab: Descriere */}
            {tab === "descriere" && car.description && (
              <div className="surface-card p-6">
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {/* Tab: Dotări */}
            {tab === "dotari" && car.equipment && car.equipment.length > 0 && (
              <div className="surface-card p-6">
                <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {car.equipment.map((e) => (
                    <li key={e} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — sticky sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Price card */}
            <div className="surface-card overflow-hidden">
              <div className="bg-secondary/50 px-6 py-4 border-b border-border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preț de vânzare</div>
                <div className="mt-1 font-display text-4xl font-bold tracking-tight">
                  {fmtPrice(car.price, car.currency)}
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <a
                  href={`tel:${SITE.phone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  <Phone className="h-4 w-4" /> Sună acum
                </a>
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${waMsg}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href={SITE.messenger}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <Send className="h-4 w-4" /> Messenger
                </a>
              </div>
            </div>

            {/* Lead form */}
            <LeadForm carId={car.id} carTitle={`${title} ${car.year}`} />

            {/* Quick info card */}
            <div className="surface-card p-5 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Locație</div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <CarIcon className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">{SITE.name}</div>
                  <div className="text-muted-foreground">{SITE.address}</div>
                </div>
              </div>
              <a
                href={SITE.mapsDirections}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-medium text-accent hover:underline"
              >
                Deschide în Google Maps →
              </a>
            </div>
          </aside>
        </div>

        {/* Similar cars */}
        {similar.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-medium text-accent uppercase tracking-wider">Alte opțiuni</div>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Mașini similare</h2>
              </div>
              <Link to="/masini" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                Vezi toate →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md p-3 md:hidden">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground truncate">{title} · {car.year}</div>
            <div className="font-display text-lg font-bold leading-tight">{fmtPrice(car.price, car.currency)}</div>
          </div>
          <a href={`tel:${SITE.phone}`} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background whitespace-nowrap">Sună</a>
          <a href={`https://wa.me/${SITE.whatsapp}?text=${waMsg}`} target="_blank" rel="noreferrer" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground whitespace-nowrap">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80">
      {icon} {label}
    </span>
  );
}

function SpecBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon} {label}</div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}
