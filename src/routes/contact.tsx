import { createFileRoute } from "@tanstack/react-router";
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
import { SITE, mapsEmbedUrl } from "@/lib/site";
import { LeadForm } from "@/components/site/LeadForm";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Parc Auto ZOL-OIL Cernat" },
      {
        name: "description",
        content:
          "Vino la parcul auto din Cernat sau contactează-ne prin telefon, WhatsApp sau Messenger.",
      },
      { property: "og:title", content: "Contact · ZOL-OIL" },
      {
        property: "og:description",
        content: "Telefon, WhatsApp, Messenger, adresă și program — Parc Auto ZOL-OIL Cernat.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { settings } = useSiteSettings();
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
              href={`tel:${settings.phone}`}
            />
            <Item
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              value={settings.contact_email}
              href={`mailto:${settings.contact_email}`}
            />
          </div>

          <div className="surface-card p-6">
            <div className="font-display text-lg font-semibold">Program</div>
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
            <div className="font-display text-lg font-semibold">Contact rapid</div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
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
    </div>
  );
}

function Item({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
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
    <a href={href} className="block hover:opacity-80">
      {content}
    </a>
  ) : (
    content
  );
}
