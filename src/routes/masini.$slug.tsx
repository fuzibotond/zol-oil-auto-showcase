import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Cog,
  Fuel,
  Gauge,
  Palette,
  Zap,
  Leaf,
  Car as CarIcon,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Phone,
  MessageCircle,
  Send,
  ExternalLink,
  ImageOff,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getCarBySlug, similarCars } from "@/lib/api/cars.functions";
import { fmtKm, fmtPrice, fmtNumber, isRecent, priceDrop } from "@/lib/format";
import { SITE, telHref } from "@/lib/site";
import type { Car } from "@/lib/types";
import { StatusBadge } from "@/components/site/StatusBadge";
import { LeadForm } from "@/components/site/LeadForm";
import { CarCard } from "@/components/site/CarCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  JsonLd,
  seoHead,
  vehicleJsonLd,
  breadcrumbJsonLd,
  carMetaDescription,
  carTitle,
} from "@/lib/seo";
import { imgUrl, imgSrcSet, CAR_IMAGE_WIDTHS } from "@/lib/images/responsive";
import { trackCarView, trackContact } from "@/lib/analytics";

export const Route = createFileRoute("/masini/$slug")({
  loader: async ({ params }) => {
    const car = await getCarBySlug({ data: params.slug });
    if (!car) throw notFound();
    // Alternatives are loaded on the server so the links are in the initial
    // HTML (internal linking + a way onward from sold cars). Never fatal.
    let similar: Car[] = [];
    try {
      similar = await similarCars({ data: { excludeId: car.id, brand: car.brand } });
    } catch {
      similar = [];
    }
    return { car, similar };
  },
  head: ({ loaderData, params }) => {
    const car = loaderData?.car;
    if (!car) return { meta: [{ title: "Mașină · ZOL-OIL" }] };
    return seoHead({
      title: carTitle(car),
      description: carMetaDescription(car),
      path: `/masini/${params.slug}`,
      image: car.images?.[0]?.url ?? null,
      type: "product",
      // Sold cars stay reachable (shared links, old results) but drop out of
      // the index; the sitemap omits them too.
      noindex: car.status === "vandut",
    });
  },
  component: CarDetail,
});

type Tab = "specs" | "descriere" | "dotari";

function CarDetail() {
  const { car, similar } = Route.useLoaderData();
  const { settings } = useSiteSettings();
  const messenger = settings.social_links.find((x) => x.key === "messenger");

  const images = car.images ?? [];
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("specs");
  const title = `${car.brand} ${car.model}`;
  const heading = `${car.brand} ${car.model} ${car.year}`;
  const path = `/masini/${car.slug}`;
  const drop = priceDrop(car.price, car.original_price);
  const sold = car.status === "vandut";
  const reserved = car.status === "rezervat";

  // Fire a car_view event for GA4/GTM once per car detail view.
  useEffect(() => {
    trackCarView(car);
  }, [car.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const structuredData = [
    vehicleJsonLd(car, path),
    breadcrumbJsonLd([
      { name: "Acasă", path: "/" },
      { name: "Mașini", path: "/masini" },
      { name: heading, path },
    ]),
  ];
  // Pre-fill WhatsApp with the car's details so the customer only has to extend it.
  const carBase = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
  const carUrl = carBase ? `${carBase}/masini/${car.slug}` : "";
  const waMsg = encodeURIComponent(
    (sold
      ? [
          `Bună ziua! Am văzut că ${title}${car.version ? " " + car.version : ""} (${car.year}) s-a vândut.`,
          `Aveți o mașină asemănătoare disponibilă?`,
          carUrl ? `Link: ${carUrl}` : "",
        ]
      : [
          `Bună ziua! Sunt interesat de ${title}${car.version ? " " + car.version : ""} (${car.year}).`,
          ``,
          `Preț: ${fmtPrice(car.price, car.currency)}`,
          `Kilometraj: ${fmtKm(car.mileage)}`,
          `Combustibil: ${car.fuel_type} · ${car.transmission}`,
          carUrl ? `Link: ${carUrl}` : "",
          ``,
          `Aș dori mai multe detalii.`,
        ]
    )
      .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
      .join("\n"),
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "specs", label: "Specificații" },
    ...(car.description ? [{ id: "descriere" as Tab, label: "Descriere" }] : []),
    ...(car.equipment?.length
      ? [{ id: "dotari" as Tab, label: `Dotări (${car.equipment.length})` }]
      : []),
  ];

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: heading, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiat");
    } catch {
      toast.error("Nu am putut copia linkul.");
    }
  }

  const current = images[idx];
  // The admin pre-fills every photo's alt with just "Brand Model"; treat that
  // default as empty so each photo gets a distinct, descriptive alt.
  const genericAlt = `${car.brand} ${car.model}`.trim().toLowerCase();
  const mainAlt = (i: number) => {
    const custom = images[i]?.alt_text?.trim();
    const generated = `${heading} ${car.fuel_type} ${car.transmission} — fotografia ${i + 1} din ${images.length}`;
    return custom && custom.toLowerCase() !== genericAlt ? custom : generated;
  };

  return (
    <div className="pb-28 md:pb-0">
      <JsonLd data={structuredData} />
      {/* ── Hero band ── */}
      <div className="bg-secondary/60 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <Breadcrumbs
            items={[
              { name: "Acasă", path: "/" },
              { name: "Mașini", path: "/masini" },
              { name: heading },
            ]}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 flex items-center justify-between gap-4">
          <Link
            to="/masini"
            className="inline-flex items-center gap-1.5 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Înapoi la mașini
          </Link>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> Distribuie
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {sold && (
          <div
            role="status"
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-secondary/60 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <div className="font-semibold">Această mașină a fost vândută.</div>
                <p className="text-sm text-muted-foreground">
                  Păstrăm pagina pentru referință. Vezi mai jos mașini disponibile acum sau
                  întreabă-ne de un model asemănător.
                </p>
              </div>
            </div>
            <Link
              to="/masini"
              className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
            >
              Vezi mașinile disponibile
            </Link>
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT COLUMN */}
          {/* min-w-0 lets this flexible column shrink below its content's
              intrinsic width. Without it, a large gallery image (e.g. a 2000px
              upload) forces the `1fr` track's automatic minimum wide enough to
              push the sidebar off-screen and cause horizontal overflow. */}
          <div className="min-w-0 space-y-6">
            {/* Title block */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={car.status} />
                {isRecent(car.created_at) && !sold && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    Nou
                  </span>
                )}
                {car.is_featured && !sold && (
                  <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background">
                    Recomandat
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {heading}
              </h1>
              {car.version && <p className="mt-1 text-base text-muted-foreground">{car.version}</p>}

              {/* Quick-glance chips */}
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Pe scurt">
                <Chip icon={<Calendar className="h-3.5 w-3.5" />} label={String(car.year)} />
                <Chip icon={<Gauge className="h-3.5 w-3.5" />} label={fmtKm(car.mileage)} />
                <Chip icon={<Fuel className="h-3.5 w-3.5" />} label={car.fuel_type} />
                <Chip icon={<Cog className="h-3.5 w-3.5" />} label={car.transmission} />
                {car.power ? (
                  <Chip icon={<Zap className="h-3.5 w-3.5" />} label={`${car.power} CP`} />
                ) : null}
                {car.body_type ? (
                  <Chip icon={<CarIcon className="h-3.5 w-3.5" />} label={car.body_type} />
                ) : null}
              </ul>
            </div>

            {/* Gallery */}
            <div className="surface-card overflow-hidden">
              <div className="relative bg-secondary/40" style={{ aspectRatio: "16/9" }}>
                {current ? (
                  <img
                    src={imgUrl(current.url, 1280)}
                    srcSet={imgSrcSet(current.url, CAR_IMAGE_WIDTHS)}
                    sizes="(min-width: 1280px) 860px, (min-width: 1024px) 60vw, 100vw"
                    alt={mainAlt(idx)}
                    className="h-full w-full object-cover"
                    width={1280}
                    height={720}
                    // The first photo is the LCP element of this page.
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageOff className="h-8 w-8" aria-hidden />
                    <span className="text-sm">Fotografiile vor fi adăugate în curând</span>
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Fotografia anterioară"
                      onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center rounded-full bg-background/90 backdrop-blur shadow-md hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Fotografia următoare"
                      onClick={() => setIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center rounded-full bg-background/90 backdrop-blur shadow-md hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div
                      className="absolute bottom-3 right-3 rounded-full bg-foreground/75 text-background px-2.5 py-1 text-xs font-medium backdrop-blur"
                      aria-live="polite"
                    >
                      {idx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((img, i) => (
                    <button
                      type="button"
                      key={img.id}
                      onClick={() => setIdx(i)}
                      aria-label={`Arată fotografia ${i + 1}`}
                      aria-current={i === idx ? "true" : undefined}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        i === idx
                          ? "border-accent shadow-sm"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl(img.url, 192)}
                        alt=""
                        width={96}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs — every panel is in the server HTML (inactive ones `hidden`),
                so description + equipment are crawlable without a click. */}
            {tabs.length > 1 && (
              <div
                role="tablist"
                aria-label="Detalii mașină"
                className="flex gap-1 rounded-2xl bg-secondary/60 p-1 border border-border"
              >
                {tabs.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={tab === t.id}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={tab === t.id ? 0 : -1}
                    onClick={() => setTab(t.id)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                      const pos = tabs.findIndex((x) => x.id === tab);
                      const next =
                        tabs[(pos + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                      setTab(next.id);
                      document.getElementById(`tab-${next.id}`)?.focus();
                    }}
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

            {/* Panel: Specs */}
            <div
              role={tabs.length > 1 ? "tabpanel" : undefined}
              id="panel-specs"
              aria-labelledby={tabs.length > 1 ? "tab-specs" : undefined}
              hidden={tab !== "specs"}
              className="surface-card p-6"
            >
              <h2 className="sr-only">Specificații</h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                <SpecBlock
                  icon={<Calendar className="h-4 w-4" />}
                  label="An fabricație"
                  value={String(car.year)}
                />
                <SpecBlock
                  icon={<Gauge className="h-4 w-4" />}
                  label="Kilometraj"
                  value={fmtKm(car.mileage)}
                />
                <SpecBlock
                  icon={<Fuel className="h-4 w-4" />}
                  label="Combustibil"
                  value={car.fuel_type}
                />
                <SpecBlock
                  icon={<Cog className="h-4 w-4" />}
                  label="Transmisie"
                  value={car.transmission}
                />
                {car.engine_size ? (
                  <SpecBlock
                    icon={<CarIcon className="h-4 w-4" />}
                    label="Capacitate"
                    value={`${fmtNumber(car.engine_size)} cm³`}
                  />
                ) : null}
                {car.power ? (
                  <SpecBlock
                    icon={<Zap className="h-4 w-4" />}
                    label="Putere"
                    value={`${car.power} CP`}
                  />
                ) : null}
                {car.body_type ? (
                  <SpecBlock
                    icon={<CarIcon className="h-4 w-4" />}
                    label="Caroserie"
                    value={car.body_type}
                  />
                ) : null}
                {car.color ? (
                  <SpecBlock
                    icon={<Palette className="h-4 w-4" />}
                    label="Culoare"
                    value={car.color}
                  />
                ) : null}
                {car.emission_norm ? (
                  <SpecBlock
                    icon={<Leaf className="h-4 w-4" />}
                    label="Norma de poluare"
                    value={car.emission_norm}
                  />
                ) : null}
              </dl>
            </div>

            {/* Panel: Descriere */}
            {car.description && (
              <div
                role="tabpanel"
                id="panel-descriere"
                aria-labelledby="tab-descriere"
                hidden={tab !== "descriere"}
                className="surface-card p-6"
              >
                <h2 className="sr-only">Descriere</h2>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {car.description}
                </p>
              </div>
            )}

            {/* Panel: Dotări */}
            {car.equipment && car.equipment.length > 0 && (
              <div
                role="tabpanel"
                id="panel-dotari"
                aria-labelledby="tab-dotari"
                hidden={tab !== "dotari"}
                className="surface-card p-6"
              >
                <h2 className="sr-only">Dotări</h2>
                <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {car.equipment.map((e) => (
                    <li key={e} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden />
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
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {sold ? "Preț la vânzare" : "Preț de vânzare"}
                  </div>
                  {drop && !sold && (
                    <span className="inline-flex items-center rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                      Reducere −{drop.percent}%
                    </span>
                  )}
                </div>
                {drop && !sold && (
                  <div className="mt-1 text-base font-medium text-muted-foreground line-through">
                    <span className="sr-only">Preț inițial: </span>
                    {fmtPrice(drop.original, car.currency)}
                  </div>
                )}
                <div
                  className={`mt-0.5 font-display text-4xl font-bold tracking-tight ${
                    sold ? "text-muted-foreground line-through" : drop ? "text-destructive" : ""
                  }`}
                >
                  {fmtPrice(car.price, car.currency)}
                </div>
                {sold && <div className="mt-1 text-sm font-medium">Vândut</div>}
                {reserved && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Mașina este rezervată. Sună-ne ca să afli dacă rezervarea mai este activă.
                  </p>
                )}
              </div>
              <div className="px-6 py-5 space-y-3">
                {sold && (
                  <p className="text-sm text-muted-foreground">
                    Cauți ceva asemănător? Spune-ne ce te interesează.
                  </p>
                )}
                <a
                  href={telHref(settings.phone)}
                  onClick={() => trackContact("phone", "car-detail", car.id)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  <Phone className="h-4 w-4" /> Sună acum
                </a>
                <a
                  href={`https://wa.me/${settings.whatsapp}?text=${waMsg}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackContact("whatsapp", "car-detail", car.id)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4" /> {sold ? "Întreabă pe WhatsApp" : "WhatsApp"}
                </a>
                {messenger?.enabled && messenger.url && (
                  <a
                    href={messenger.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackContact("messenger", "car-detail", car.id)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <Send className="h-4 w-4" /> Messenger
                  </a>
                )}
                {car.autovit_url && !sold && (
                  <a
                    href={car.autovit_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Vezi pe Autovit
                  </a>
                )}
              </div>
            </div>

            {/* Lead form */}
            <LeadForm
              carId={car.id}
              carTitle={`${title} ${car.year}`}
              source="car-detail"
              heading={sold ? "Caută o mașină similară" : "Cere detalii despre mașină"}
              defaultMessage={
                sold
                  ? `Caut o mașină asemănătoare cu ${title} ${car.year}.`
                  : `Sunt interesat de ${title} ${car.year}.`
              }
            />

            {/* Quick info card */}
            <div className="surface-card p-5 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Unde poți vedea mașina
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <CarIcon className="h-4 w-4" aria-hidden />
                </div>
                <div className="text-sm">
                  <div className="font-medium">{SITE.name}</div>
                  <address className="not-italic text-muted-foreground">
                    {settings.address || SITE.address}
                  </address>
                  {settings.opening_hours[0] && (
                    <div className="text-muted-foreground">
                      {settings.opening_hours[0].day}: {settings.opening_hours[0].value}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(settings.maps_url || SITE.mapsDirections) && (
                  <a
                    href={settings.maps_url || SITE.mapsDirections}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackContact("maps", "car-detail", car.id)}
                    className="inline-flex py-1 text-xs font-medium text-accent hover:underline"
                  >
                    Deschide în Google Maps →
                  </a>
                )}
                {settings.waze_url && (
                  <a
                    href={settings.waze_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackContact("waze", "car-detail", car.id)}
                    className="inline-flex py-1 text-xs font-medium text-accent hover:underline"
                  >
                    Deschide în Waze →
                  </a>
                )}
                <Link
                  to="/contact"
                  className="inline-flex py-1 text-xs font-medium text-accent hover:underline"
                >
                  Program și contact →
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Alternatives — server-rendered internal links */}
        {similar.length > 0 && (
          <section className="mt-16" aria-labelledby="alternative">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-medium text-accent uppercase tracking-wider">
                  {sold ? "Disponibile acum" : "Alte opțiuni"}
                </div>
                <h2
                  id="alternative"
                  className="mt-1 font-display text-2xl font-bold tracking-tight"
                >
                  {sold ? "Mașini disponibile similare" : "Mașini similare"}
                </h2>
              </div>
              <Link
                to="/masini"
                className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Vezi toate →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md p-3 md:hidden">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground truncate">
              {title} · {car.year}
            </div>
            <div className="flex items-baseline gap-2">
              {sold ? (
                <div className="font-display text-lg font-bold leading-tight">Vândut</div>
              ) : (
                <>
                  <div
                    className={`font-display text-lg font-bold leading-tight ${
                      drop ? "text-destructive" : ""
                    }`}
                  >
                    {fmtPrice(car.price, car.currency)}
                  </div>
                  {drop && (
                    <div className="text-xs font-medium text-muted-foreground line-through">
                      {fmtPrice(drop.original, car.currency)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {sold ? (
            <Link
              to="/masini"
              className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background whitespace-nowrap"
            >
              Vezi stocul
            </Link>
          ) : (
            <a
              href={telHref(settings.phone)}
              onClick={() => trackContact("phone", "car-detail-mobile", car.id)}
              className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background whitespace-nowrap"
            >
              Sună
            </a>
          )}
          <a
            href={`https://wa.me/${settings.whatsapp}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackContact("whatsapp", "car-detail-mobile", car.id)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground whitespace-nowrap"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80">
      <span aria-hidden>{icon}</span> {label}
    </li>
  );
}

function SpecBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <span aria-hidden>{icon}</span> {label}
      </dt>
      <dd className="font-semibold text-sm">{value}</dd>
    </div>
  );
}
