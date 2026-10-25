import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  MessageCircle,
  Send,
  Instagram,
  Music2,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { SITE, mapsEmbedUrl, telHref } from "@/lib/site";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { LeadForm } from "@/components/site/LeadForm";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { getSiteSettings } from "@/lib/api/site-settings.functions";
import { JsonLd, seoHead, organizationJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { trackContact } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  loader: () => getSiteSettings(),
  head: () =>
    seoHead({
      title: `Contact · Parc Auto ZOL-OIL ${SITE.city}, ${SITE.county}`,
      description: `Vino la parcul auto din ${SITE.city}, jud. ${SITE.county}, sau contactează-ne prin telefon, WhatsApp sau Messenger. Program, adresă și hartă.`,
      path: "/contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  const srvSettings = Route.useLoaderData();
  const { settings } = useSiteSettings();
  const { company } = useCompanyInfo();
  const socialByKey = new Map(settings.social_links.map((s) => [s.key, s]));
  const socialButtons = [
    { key: "messenger", label: "Messenger", icon: Send, tone: "bg-foreground text-background" },
    { key: "facebook", label: "Facebook", icon: Facebook, tone: "border border-border bg-card" },
    { key: "instagram", label: "Instagram", icon: Instagram, tone: "border border-border bg-card" },
    { key: "tiktok", label: "TikTok", icon: Music2, tone: "border border-border bg-card" },
    { key: "youtube", label: "YouTube", icon: Youtube, tone: "border border-border bg-card" },
    { key: "autovit", label: "Autovit", icon: ExternalLink, tone: "border border-border bg-card" },
    { key: "olx", label: "OLX", icon: ExternalLink, tone: "border border-border bg-card" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <JsonLd
        data={[
          organizationJsonLd(srvSettings, company),
          breadcrumbJsonLd([
            { name: "Acasă", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <div className="mb-4">
        <Breadcrumbs items={[{ name: "Acasă", path: "/" }, { name: "Contact" }]} />
      </div>
      <div className="text-xs font-medium text-accent uppercase tracking-wider">Contact</div>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Vino la noi în {SITE.city}
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Parcul auto fizic este în {SITE.city}, jud. {SITE.county}. Te așteptăm să vezi mașinile pe
        viu.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="surface-card p-6 space-y-4">
            <Item
              icon={<MapPin className="h-5 w-5" />}
              label="Adresă"
              value={settings.address || SITE.address}
            />
            <Item
              icon={<Phone className="h-5 w-5" />}
              label="Telefon"
              value={settings.phone_display}
              href={telHref(settings.phone)}
              onClick={() => trackContact("phone", "contact-page")}
            />
            <Item
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              value={settings.contact_email}
              href={`mailto:${settings.contact_email}`}
              onClick={() => trackContact("email", "contact-page")}
            />
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">Program</h2>
            <div className="mt-3 space-y-2 text-sm">
              {settings.opening_hours.map((h) => (
                <div key={h.day} className="flex justify-between border-b border-border/60 py-1.5">
                  <span className="text-muted-foreground">{h.day}</span>
                  <span className="font-medium">{h.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">Contact rapid</h2>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackContact("whatsapp", "contact-page")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              {socialButtons.map((button) => {
                const item = socialByKey.get(button.key);
                if (!item?.enabled || !item.url) return null;
                const Icon = button.icon;
                return (
                  <a
                    key={button.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={
                      button.key === "messenger"
                        ? () => trackContact("messenger", "contact-page")
                        : undefined
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${button.tone}`}
                  >
                    <Icon className="h-4 w-4" /> {button.label}
                  </a>
                );
              })}
              {(settings.maps_url || SITE.mapsDirections) && (
                <a
                  href={settings.maps_url || SITE.mapsDirections}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackContact("maps", "contact-page")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
                >
                  <MapPin className="h-4 w-4" /> Direcții
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border min-h-[360px]">
            <iframe
              title="Hartă ZOL-OIL Cernat"
              src={mapsEmbedUrl(settings.address)}
              className="h-full min-h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <LeadForm source="contact-page" />
        </div>
      </div>

      {/* Visitor questions answered from the live admin settings — no invented
          promises (financing, warranty, etc. are deliberately not mentioned). */}
      <section className="mt-14 max-w-3xl" aria-labelledby="intrebari">
        <h2 id="intrebari" className="font-display text-2xl font-bold tracking-tight">
          Întrebări frecvente
        </h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          <Faq q="Unde se află parcul auto ZOL-OIL?">
            Parcul auto este în comuna {SITE.city}, județul {SITE.county}, aproape de Târgu
            Secuiesc. Adresa: {settings.address || SITE.address}.{" "}
            {(settings.maps_url || SITE.mapsDirections) && (
              <a
                href={settings.maps_url || SITE.mapsDirections}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackContact("maps", "contact-faq")}
                className="font-medium text-accent underline"
              >
                Deschide traseul în Google Maps
              </a>
            )}
          </Faq>
          <Faq q="Care este programul de vizitare?">
            {settings.opening_hours.map((h) => `${h.day}: ${h.value}`).join(" · ")}.
          </Faq>
          <Faq q="Pot vedea mașina pe viu înainte să o cumpăr?">
            Da, te așteptăm la parc în timpul programului. Sună-ne înainte la{" "}
            <a
              href={telHref(settings.phone)}
              onClick={() => trackContact("phone", "contact-faq")}
              className="font-medium text-accent underline"
            >
              {settings.phone_display}
            </a>{" "}
            ca să confirmăm că mașina care te interesează este la parc.
          </Faq>
          <Faq q="Cum aflu dacă o mașină mai este disponibilă?">
            Fiecare anunț din{" "}
            <Link to="/masini" className="font-medium text-accent underline">
              lista de mașini
            </Link>{" "}
            are un status: Disponibil, Rezervat sau Vândut. Pentru confirmare sună-ne sau scrie-ne
            pe WhatsApp.
          </Faq>
        </div>
      </section>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group px-5 py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium">
        {q}
        <span aria-hidden className="text-muted-foreground transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </details>
  );
}

function Item({
  icon,
  label,
  value,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} onClick={onClick} className="block hover:opacity-80">
      {content}
    </a>
  ) : (
    content
  );
}
