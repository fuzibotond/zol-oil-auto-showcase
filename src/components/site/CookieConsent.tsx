import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CONSENT_STORAGE_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  applyConsent,
  type ConsentChoice,
} from "@/lib/consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current =
      typeof window !== "undefined" ? localStorage.getItem(CONSENT_STORAGE_KEY) : null;
    setVisible(!current);

    // Re-open when the footer "Setări cookie-uri" link (or any UI) requests it,
    // so visitors can change or withdraw consent as easily as they gave it.
    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  function saveConsent(choice: ConsentChoice) {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `cookie_consent=${choice}; path=/; max-age=${maxAge}; SameSite=Lax`;
    // Tell Google Consent Mode about the choice (loads/holds GA4 + Meta tags in GTM).
    applyConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Folosim cookie-uri necesare pentru funcționarea site-ului și, cu acordul tău, cookie-uri
          de analiză și marketing (Google Analytics, Meta) pentru a înțelege traficul și a-ți arăta
          oferte relevante.{" "}
          <Link to="/politica-cookie" className="underline hover:text-foreground">
            Detalii
          </Link>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveConsent("necessary")}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary sm:text-sm"
          >
            Doar necesare
          </button>
          <button
            type="button"
            onClick={() => saveConsent("all")}
            className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90 sm:text-sm"
          >
            Accept toate
          </button>
        </div>
      </div>
    </div>
  );
}
