import { Link } from "@tanstack/react-router";
import { Facebook, MapPin, Phone, Mail } from "lucide-react";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-xl font-semibold tracking-tight">{SITE.name}</div>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">{SITE.tagline}</p>
          <a href={SITE.facebook} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm hover:underline">
            <Facebook className="h-4 w-4" /> Urmărește-ne pe Facebook
          </a>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Navigație</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Acasă</Link></li>
            <li><Link to="/masini" className="hover:text-foreground">Mașini disponibile</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {SITE.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> <a href={`tel:${SITE.phone}`}>{SITE.phoneDisplay}</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} {SITE.name}. Toate drepturile rezervate.</div>
          <Link to="/admin" className="hover:text-foreground">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
