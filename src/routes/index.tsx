import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck, MapPin, Phone, Facebook, Sparkles, Clock } from "lucide-react";
import { listCars } from "@/lib/api/cars.functions";
import { CarCard } from "@/components/site/CarCard";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZOL-OIL · Parc Auto în Cernat — mașini second-hand verificate" },
      { name: "description", content: "Parc Auto ZOL-OIL în Cernat, Covasna. Autoturisme rulate, verificate și pregătite pentru drum. Vezi mașinile disponibile sau contactează-ne pe WhatsApp." },
      { property: "og:title", content: "Parc Auto ZOL-OIL · Cernat" },
      { property: "og:description", content: "Autoturisme rulate, verificate și pregătite pentru drum." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const fetchCars = useServerFn(listCars);
  const { data: featured = [] } = useQuery({
    queryKey: ["cars", "featured"],
    queryFn: () => fetchCars({ data: { featured: true, limit: 6 } }),
  });
  const { data: latest = [] } = useQuery({
    queryKey: ["cars", "latest"],
    queryFn: () => fetchCars({ data: { limit: 6 } }),
  });

  const shown = featured.length ? featured : latest;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Parc Auto · {SITE.city}, {SITE.county}
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-6xl text-balance">
                Parc Auto <span className="text-accent">ZOL-OIL</span>.
                <br />Mașini pregătite de drum.
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
                Autoturisme rulate, verificate tehnic și gata pentru următorul proprietar. Vino la parcul auto din Cernat sau scrie-ne pe WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/masini" className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3.5 text-sm font-medium text-background hover:opacity-90">
                  Vezi mașinile disponibile <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-medium text-accent-foreground hover:opacity-90">
                  Contactează-ne pe WhatsApp
                </a>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
                <Stat value="50+" label="Mașini în parc" />
                <Stat value="10+" label="Ani experiență" />
                <Stat value="100%" label="Verificate" />
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1400&q=80&auto=format&fit=crop"
                  alt="Mașini disponibile la Parc Auto ZOL-OIL Cernat"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Floating location card */}
              <div className="glass-card absolute -left-4 -bottom-6 w-64 p-4 sm:-left-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Locație
                </div>
                <div className="mt-1 font-display text-base font-semibold">{SITE.city}, {SITE.county}</div>
                <a href={SITE.mapsDirections} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-accent hover:underline">
                  Deschide în Google Maps →
                </a>
              </div>

              {/* Floating hours card */}
              <div className="glass-card absolute -right-2 -top-4 w-56 p-4 hidden sm:block">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Program
                </div>
                <div className="mt-1 text-sm">
                  <div className="flex justify-between"><span>L–V</span><span className="font-medium">9–18</span></div>
                  <div className="flex justify-between"><span>Sâm</span><span className="font-medium">10–14</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / latest cars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-accent uppercase tracking-wider">Mașini disponibile</div>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {featured.length ? "Recomandările noastre" : "Cele mai noi mașini"}
            </h2>
          </div>
          <Link to="/masini" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            Vezi toate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {shown.length === 0 ? (
          <div className="mt-8 surface-card p-10 text-center">
            <p className="text-muted-foreground">În curând adăugăm mașinile disponibile. Contactează-ne direct pentru oferte actuale.</p>
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground">
              Scrie pe WhatsApp
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        )}
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Why icon={<ShieldCheck className="h-5 w-5" />} title="Verificate tehnic" text="Fiecare mașină este verificată înainte de a fi expusă spre vânzare." />
          <Why icon={<MapPin className="h-5 w-5" />} title="Parc auto fizic" text="Vino în Cernat să vezi mașina și să faci proba pe drum." />
          <Why icon={<Phone className="h-5 w-5" />} title="Contact rapid" text="Telefon, WhatsApp sau Messenger — îți răspundem repede." />
        </div>
      </section>

      {/* Facebook CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="surface-card flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-2xl font-semibold">Urmărește-ne pe Facebook</div>
            <p className="mt-1 text-sm text-muted-foreground">Postăm constant mașini noi pe Facebook Marketplace și pe pagina noastră.</p>
          </div>
          <a href={SITE.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background">
            <Facebook className="h-4 w-4" /> Vezi pagina
          </a>
        </div>
      </section>

      {/* Location */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
          <div className="surface-card p-8">
            <div className="text-xs font-medium text-accent uppercase tracking-wider">Locație</div>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">Parcul auto din {SITE.city}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{SITE.address}. Te așteptăm să vezi mașinile pe viu și să faci proba pe drum.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={SITE.mapsDirections} target="_blank" rel="noreferrer" className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background">Direcții Google Maps</a>
              <a href={SITE.waze} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium">Deschide în Waze</a>
            </div>
            <div className="mt-6 space-y-2 text-sm">
              {SITE.hours.map((h) => (
                <div key={h.day} className="flex justify-between border-b border-border/60 py-1.5">
                  <span className="text-muted-foreground">{h.day}</span>
                  <span className="font-medium">{h.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border min-h-[320px]">
            <iframe title="Hartă" src={SITE.mapsEmbed} className="h-full min-h-[320px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Why({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="surface-card p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</div>
      <div className="mt-4 font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
