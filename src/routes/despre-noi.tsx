import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MessageCircle, MapPin, Mail } from "lucide-react";
import { getAbout } from "@/lib/api/about.functions";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SITE } from "@/lib/site";
import type { AboutSection } from "@/lib/types";

export const Route = createFileRoute("/despre-noi")({
  loader: async () => await getAbout(),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = page?.seo_title || "Despre noi · Parc Auto ZOL-OIL";
    const desc = page?.seo_description || "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/despre-noi" },
      ],
      links: [{ rel: "canonical", href: "/despre-noi" }],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { page, sections } = Route.useLoaderData();
  const { settings } = useSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: SITE.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.county,
      addressCountry: "RO",
    },
    telephone: settings.phone,
    email: settings.contact_email,
    url: "/despre-noi",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 md:py-16">
      <script
        type="application/ld+json"
        // JSON.stringify + escape "<" so a value can never break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <header className="max-w-3xl">
        <div className="text-xs font-medium uppercase tracking-wider text-accent">
          Parc Auto · {SITE.city}
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {page.hero_title}
        </h1>
        {page.intro && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
            {page.intro}
          </p>
        )}
      </header>

      {/* Sections */}
      {sections.length > 0 && (
        <div className="mt-12 space-y-12">
          {sections.map((s) => (
            <Section key={s.id} section={s} />
          ))}
        </div>
      )}

      {/* Contact CTA */}
      <section className="mt-16 surface-card p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">Vino la o vizionare</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Te așteptăm în {SITE.city}, {SITE.county}. Sună-ne sau scrie-ne pe WhatsApp pentru
          programare.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`tel:${settings.phone}`}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            <Phone className="h-4 w-4" /> {settings.phone_display}
          </a>
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href={`mailto:${settings.contact_email}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary"
          >
            <Mail className="h-4 w-4" /> {settings.contact_email}
          </a>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {SITE.address}
          </span>
          {(settings.maps_url || SITE.mapsDirections) && (
            <a
              href={settings.maps_url || SITE.mapsDirections}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Google Maps →
            </a>
          )}
          {settings.waze_url && (
            <a
              href={settings.waze_url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Waze →
            </a>
          )}
        </div>
        <div className="mt-6">
          <Link to="/masini" className="text-sm font-medium text-accent hover:underline">
            Vezi mașinile disponibile →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({ section: s }: { section: AboutSection }) {
  const hasImage = Boolean(s.image_url) && s.image_position !== "none";
  const text = (
    <div className={hasImage && s.image_position !== "top" ? "flex-1" : ""}>
      <h2 className="font-display text-2xl font-bold tracking-tight">{s.title}</h2>
      {s.body && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
          {s.body}
        </p>
      )}
    </div>
  );
  const image = hasImage ? (
    <div className={s.image_position === "top" ? "mb-5" : "w-full sm:w-[42%] flex-shrink-0"}>
      <img
        src={s.image_url as string}
        alt={s.image_alt ?? s.title}
        loading="lazy"
        className="w-full rounded-2xl border border-border object-cover"
      />
    </div>
  ) : null;

  if (!hasImage) return <section>{text}</section>;
  if (s.image_position === "top") {
    return (
      <section>
        {image}
        {text}
      </section>
    );
  }
  return (
    <section
      className={`flex flex-col gap-6 sm:items-center ${s.image_position === "right" ? "sm:flex-row-reverse" : "sm:flex-row"}`}
    >
      {image}
      {text}
    </section>
  );
}
