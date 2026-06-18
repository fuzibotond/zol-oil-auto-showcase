import { useEffect, useState } from "react";

type ConsentChoice = "all" | "necessary";

const STORAGE_KEY = "zol_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setVisible(!current);
  }, []);

  function saveConsent(choice: ConsentChoice) {
    localStorage.setItem(STORAGE_KEY, choice);
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `cookie_consent=${choice}; path=/; max-age=${maxAge}; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Folosim cookie-uri pentru funcționare, analiză trafic și îmbunătățirea experienței. Poți accepta toate cookie-urile sau doar cele necesare.
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
