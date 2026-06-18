import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-settings";

const navLinks = [
  { to: "/" as const, label: "Acasă" },
  { to: "/masini" as const, label: "Mașini" },
  { to: "/contact" as const, label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { settings } = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
            <img src="/favicon-96x96.png" alt="ZOL-OIL logo" className="h-9 w-9 object-contain" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold tracking-tight">ZOL-OIL</div>
            <div className="text-[11px] text-muted-foreground">Parc Auto · {SITE.city}</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm bg-secondary text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary">
            <Phone className="h-4 w-4" /> {settings.phone_display}
          </a>
          <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>

        <button className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border" onClick={() => setOpen(!open)} aria-label="Meniu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base hover:bg-secondary">
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a href={`tel:${settings.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm">
                <Phone className="h-4 w-4" /> Sună
              </a>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm text-accent-foreground">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <a href={SITE.mapsDirections} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {SITE.city}, {SITE.county}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
