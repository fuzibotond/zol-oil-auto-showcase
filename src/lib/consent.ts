// Consent + Google Consent Mode v2 wiring.
//
// The site uses Google Tag Manager (GTM) as the single tag container. Google
// Analytics 4 and the Meta/Facebook Pixel are configured INSIDE GTM as tags,
// each set to require the matching consent type — so nothing that stores
// analytics/marketing cookies fires until the visitor clicks "Accept toate" in
// the cookie banner. The GTM container itself loads with Consent Mode defaults
// set to "denied", which is the Google-recommended, GDPR-compliant pattern for
// EU traffic.
//
// Only the GTM container id lives in code (VITE_GTM_ID). The GA4 measurement id
// and the Meta Pixel id are entered in the GTM web UI, never here.

export const CONSENT_STORAGE_KEY = "zol_cookie_consent_v1";
export type ConsentChoice = "all" | "necessary";

/** Public GTM container id, e.g. "GTM-XXXXXXX". Empty string disables tracking. */
export const GTM_ID = (import.meta.env.VITE_GTM_ID ?? "").trim();

/** Custom event any UI element can dispatch to re-open the cookie banner. */
export const OPEN_COOKIE_SETTINGS_EVENT = "zol:open-cookie-settings";

/** Re-open the cookie banner so a visitor can change/withdraw consent. */
export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  }
}

type ConsentState = "granted" | "denied";

function consentPayload(choice: ConsentChoice): Record<string, ConsentState> {
  const g: ConsentState = choice === "all" ? "granted" : "denied";
  return {
    ad_storage: g,
    ad_user_data: g,
    ad_personalization: g,
    analytics_storage: g,
  };
}

/** Push a Consent Mode update to gtag after the visitor makes a choice, and
 *  emit a dataLayer event so GTM triggers waiting on consent can proceed. */
export function applyConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  w.gtag?.("consent", "update", consentPayload(choice));
  (w.dataLayer ??= []).push({
    event: choice === "all" ? "consent_accepted" : "consent_rejected",
  });
}

/**
 * Inline script: define dataLayer/gtag and set Consent Mode v2 defaults to
 * "denied" BEFORE GTM loads. On repeat visits it re-applies a stored "all"
 * choice immediately, so returning visitors are not re-throttled.
 * Rendered verbatim into <head> — must run before the GTM loader.
 */
export function consentDefaultScript(): string {
  return `(function(){window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);try{if(localStorage.getItem('${CONSENT_STORAGE_KEY}')==='all'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});}}catch(e){}})();`;
}

/** Inline script: the standard Google Tag Manager loader for `id`. */
export function gtmLoaderScript(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
}
