import { Link } from "@tanstack/react-router";
import { Facebook, MapPin, Phone, Mail } from "lucide-react";
import { SITE, SAL } from "@/lib/site";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useCompanyInfo } from "@/hooks/use-company-info";

export function Footer() {
  const { settings } = useSiteSettings();
  const { company } = useCompanyInfo();
  const facebook = settings.social_links.find((x) => x.key === "facebook");

  // Legal identification — rendered only from admin-configured data; each line is
  // hidden when its value is not set (no placeholders). Phone/email are already in
  // the Contact column above, so they are not repeated here.
  const cuiRegcom = [
    company?.cui && `CUI: ${company.cui}`,
    company?.reg_com && `Reg. Com.: ${company.reg_com}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const hasLegal = Boolean(
    company &&
    (company.legal_name || cuiRegcom || company.registered_address || company.workpoint_address),
  );

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
          {hasLegal && (
            <div className="mt-5 space-y-0.5 text-xs text-muted-foreground">
              {company?.legal_name && (
                <div className="font-medium text-foreground/80">{company.legal_name}</div>
              )}
              {cuiRegcom && <div>{cuiRegcom}</div>}
              {company?.registered_address && <div>Sediu social: {company.registered_address}</div>}
              {company?.workpoint_address && <div>Punct de lucru: {company.workpoint_address}</div>}
            </div>
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-4 text-center md:grid md:grid-cols-3 md:items-center md:text-left">
            {/* Left — legal links */}
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 md:justify-start">
              <Link to="/confidentialitate" className="hover:text-foreground">
                Confidențialitate
              </Link>
              <Link to="/politica-cookie" className="hover:text-foreground">
                Cookie-uri
              </Link>
              <Link to="/termeni" className="hover:text-foreground">
                Termeni și condiții
              </Link>
            </nav>

            {/* Center — copyright */}
            <div className="md:text-center">
              © {new Date().getFullYear()} {SITE.name}. Toate drepturile rezervate.
            </div>

            {/* Right — ANPC SAL badge */}
            <div className="md:justify-self-end">
              {SAL.show && (
                <a href={SAL.url} target="_blank" rel="noreferrer" aria-label={SAL.label}>
                  {SAL.image ? (
                    <img
                      src={SAL.image}
                      alt={SAL.label}
                      width={240}
                      height={60}
                      loading="lazy"
                      className="block h-auto w-[240px] max-w-full"
                    />
                  ) : (
                    <span className="underline hover:text-foreground">SAL</span>
                  )}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
