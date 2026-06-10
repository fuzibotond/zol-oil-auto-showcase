import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Calendar, Cog, Fuel, Gauge, Palette, Zap, Car as CarIcon, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { getCarBySlug, similarCars } from "@/lib/api/cars.functions";
import { fmtKm, fmtPrice, fmtNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ContactButtons } from "@/components/site/ContactButtons";
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

function CarDetail() {
  const { car } = Route.useLoaderData() as { car: import("@/lib/types").Car };
  const fetchSimilar = useServerFn(similarCars);
  const { data: similar = [] } = useQuery({
    queryKey: ["similar", car.id],
    queryFn: () => fetchSimilar({ data: { excludeId: car.id, brand: car.brand } }),
  });

  const images = car.images && car.images.length ? car.images : [{ id: "p", url: PLACEHOLDER, alt_text: null, sort_order: 0, car_id: car.id }];
  const [idx, setIdx] = useState(0);
  const title = `${car.brand} ${car.model}`;
  const subtitle = [car.year, car.fuel_type, car.transmission].join(" • ");

  function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, text: subtitle, url: window.location.href }).catch(() => {});
    } else if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-32 md:pb-12">
      <Link to="/masini" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Înapoi la mașini
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left */}
        <div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge status={car.status} />
                {car.is_featured && <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background">Recomandat</span>}
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
              <p className="text-muted-foreground">{car.version ? `${car.version} • ` : ""}{subtitle}</p>
            </div>
            <button onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Share2 className="h-4 w-4" /> Distribuie
            </button>
          </div>

          {/* Gallery */}
          <div className="mt-6 surface-card overflow-hidden">
            <div className="relative aspect-[16/10] bg-muted">
              <img src={images[idx].url} alt={images[idx].alt_text ?? title} className="h-full w-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur shadow"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => setIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur shadow"><ChevronRight className="h-5 w-5" /></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/80 text-background px-3 py-1 text-xs">{idx + 1} / {images.length}</div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setIdx(i)} className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === idx ? "border-accent" : "border-transparent"}`}>
                    <img src={img.url} alt={img.alt_text ?? ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key specs */}
          <div className="mt-6 surface-card p-6">
            <div className="font-display text-lg font-semibold">Specificații</div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Spec icon={<Calendar className="h-4 w-4" />} label="An" value={String(car.year)} />
              <Spec icon={<Gauge className="h-4 w-4" />} label="Kilometraj" value={fmtKm(car.mileage)} />
              <Spec icon={<Fuel className="h-4 w-4" />} label="Combustibil" value={car.fuel_type} />
              <Spec icon={<Cog className="h-4 w-4" />} label="Transmisie" value={car.transmission} />
              {car.engine_size ? <Spec icon={<CarIcon className="h-4 w-4" />} label="Capacitate" value={`${fmtNumber(car.engine_size)} cm³`} /> : null}
              {car.power ? <Spec icon={<Zap className="h-4 w-4" />} label="Putere" value={`${car.power} CP`} /> : null}
              {car.body_type ? <Spec icon={<CarIcon className="h-4 w-4" />} label="Caroserie" value={car.body_type} /> : null}
              {car.color ? <Spec icon={<Palette className="h-4 w-4" />} label="Culoare" value={car.color} /> : null}
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div className="mt-6 surface-card p-6">
              <div className="font-display text-lg font-semibold">Descriere</div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{car.description}</p>
            </div>
          )}

          {/* Equipment */}
          {car.equipment && car.equipment.length > 0 && (
            <div className="mt-6 surface-card p-6">
              <div className="font-display text-lg font-semibold">Dotări</div>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                {car.equipment.map((e) => (
                  <li key={e} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="surface-card p-6">
            <div className="text-xs text-muted-foreground">Preț</div>
            <div className="mt-1 font-display text-4xl font-bold tracking-tight">{fmtPrice(car.price, car.currency)}</div>
            <div className="mt-4">
              <ContactButtons message={`Bună ziua, sunt interesat de ${title} (${car.year}) — ${SITE.city}`} />
            </div>
          </div>

          <LeadForm carId={car.id} carTitle={`${title} ${car.year}`} />
        </aside>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur p-3 md:hidden">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground">{title}</div>
            <div className="font-display text-lg font-bold leading-tight">{fmtPrice(car.price, car.currency)}</div>
          </div>
          <a href={`tel:${SITE.phone}`} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background">Sună</a>
          <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground">WhatsApp</a>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16">
          <div className="font-display text-2xl font-bold tracking-tight">Mașini similare</div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
