import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Facebook, MessageCircle, Send } from "lucide-react";
import { SITE } from "@/lib/site";
import { LeadForm } from "@/components/site/LeadForm";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Parc Auto ZOL-OIL Cernat" },
      { name: "description", content: "Vino la parcul auto din Cernat sau contactează-ne prin telefon, WhatsApp sau Messenger." },
      { property: "og:title", content: "Contact · ZOL-OIL" },
      { property: "og:description", content: "Telefon, WhatsApp, Messenger, adresă și program — Parc Auto ZOL-OIL Cernat." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="text-xs font-medium text-accent uppercase tracking-wider">Contact</div>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">Vino la noi în {SITE.city}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Parcul auto fizic este în {SITE.city}, jud. {SITE.county}. Te așteptăm să vezi mașinile pe viu.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="surface-card p-6 space-y-4">
            <Item icon={<MapPin className="h-5 w-5" />} label="Adresă" value={SITE.address} />
            <Item icon={<Phone className="h-5 w-5" />} label="Telefon" value={SITE.phoneDisplay} href={`tel:${SITE.phone}`} />
            <Item icon={<Mail className="h-5 w-5" />} label="Email" value={SITE.email} href={`mailto:${SITE.email}`} />
          </div>

          <div className="surface-card p-6">
            <div className="font-display text-lg font-semibold">Program</div>
            <div className="mt-3 space-y-2 text-sm">
              {SITE.hours.map((h) => (
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
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              <a href={SITE.messenger} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background"><Send className="h-4 w-4" /> Messenger</a>
              <a href={SITE.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"><Facebook className="h-4 w-4" /> Facebook</a>
              <a href={SITE.mapsDirections} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"><MapPin className="h-4 w-4" /> Direcții</a>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border min-h-[360px]">
            <iframe title="Hartă ZOL-OIL Cernat" src={SITE.mapsEmbed} className="h-full min-h-[360px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <LeadForm />
        </div>
      </div>
    </div>
  );
}

function Item({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block hover:opacity-80">{content}</a> : content;
}
