import { Link } from "@tanstack/react-router";
import { Facebook, MapPin, Phone, Mail } from "lucide-react";
import { SITE } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useCompanyInfo } from "@/hooks/use-company-info";

export function Footer() {
  const { settings } = useSiteSettings();
  const { company } = useCompanyInfo();
  const facebook = settings.social_links.find((x) => x.key === "facebook");

  // Legal identification line — rendered only from real, filled-in data.
  const legalLine = company
    ? [
        company.legal_name,
        company.cui && `CUI ${company.cui}`,
        company.reg_com && `Reg. Com. ${company.reg_com}`,
        company.registered_address && `Sediu: ${company.registered_address}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-xl font-semibold tracking-tight">{SITE.name}</div>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">{SITE.tagline}</p>
          {facebook?.enabled && facebook.url && (
            <a
              href={facebook.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm hover:underline"
            >
              <Facebook className="h-4 w-4" /> Urmărește-ne pe Facebook
            </a>
          )}
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Navigație</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground">
                Acasă
              </Link>
            </li>
            <li>
              <Link to="/masini" className="hover:text-foreground">
                Mașini disponibile
              </Link>
            </li>
            <li>
              <Link to="/despre-noi" className="hover:text-foreground">
                Despre noi
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {settings.address || SITE.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />{" "}
              <a href={`tel:${settings.phone}`}>{settings.phone_display}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />{" "}
              <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 text-xs text-muted-foreground space-y-1.5">
          {legalLine && <div>{legalLine}</div>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              © {new Date().getFullYear()} {SITE.name}. Toate drepturile rezervate.
            </div>
            <Link to="/admin" className="hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
