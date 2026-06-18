// Centralized business info — keeps translation/structure easy later.
export const SITE = {
  name: "Parc Auto ZOL-OIL",
  shortName: "ZOL-OIL",
  tagline: "Autoturisme rulate, verificate și pregătite pentru drum.",
  city: "Cernat",
  county: "Covasna",
  country: "România",
  address: "Cernat, jud. Covasna, România",
  phone: "+40 700 000 000",
  phoneDisplay: "0700 000 000",
  whatsapp: "40700000000",
  messenger: "https://m.me/parcautozoloil",
  facebook: "https://facebook.com/parcautozoloil",
  email: "contact@zol-oil.ro",
  hours: [
    { day: "Luni – Vineri", value: "09:00 – 18:00" },
    { day: "Sâmbătă", value: "10:00 – 14:00" },
    { day: "Duminică", value: "Închis" },
  ],
  mapsEmbed:
    "https://www.google.com/maps?q=Cernat,+Covasna,+Romania&output=embed",
  mapsDirections: "https://share.google/9gfGgLgT7AKrY7Ngt",
  waze: "https://waze.com/ul?q=Cernat%20Covasna",
};

export type SocialPlatform = "facebook" | "messenger" | "instagram" | "tiktok" | "youtube" | "autovit" | "olx";

export interface SiteOpeningHour {
  day: string;
  value: string;
}

export interface SiteSocialLink {
  key: SocialPlatform;
  label: string;
  url: string;
  enabled: boolean;
}

export interface SiteSettingsInput {
  contact_email: string;
  phone: string;
  phone_display: string;
  whatsapp: string;
  opening_hours: SiteOpeningHour[];
  social_links: SiteSocialLink[];
}

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, { label: string }> = {
  facebook: { label: "Facebook" },
  messenger: { label: "Messenger" },
  instagram: { label: "Instagram" },
  tiktok: { label: "TikTok" },
  youtube: { label: "YouTube" },
  autovit: { label: "Autovit" },
  olx: { label: "OLX" },
};

export const SITE_SETTINGS_FALLBACK: SiteSettingsInput = {
  contact_email: SITE.email,
  phone: SITE.phone,
  phone_display: SITE.phoneDisplay,
  whatsapp: SITE.whatsapp,
  opening_hours: SITE.hours,
  social_links: [
    { key: "facebook", label: "Facebook", url: SITE.facebook, enabled: true },
    { key: "messenger", label: "Messenger", url: SITE.messenger, enabled: true },
    { key: "instagram", label: "Instagram", url: "", enabled: false },
    { key: "tiktok", label: "TikTok", url: "", enabled: false },
    { key: "youtube", label: "YouTube", url: "", enabled: false },
    { key: "autovit", label: "Autovit", url: "", enabled: false },
    { key: "olx", label: "OLX", url: "", enabled: false },
  ],
};

export const FUEL_TYPES = ["Benzină", "Diesel", "Hibrid", "Electric", "GPL"] as const;
export const TRANSMISSIONS = ["Manuală", "Automată"] as const;
export const BODY_TYPES = ["Berlină", "Break", "SUV", "Hatchback", "Coupe", "Cabrio", "Monovolum"] as const;
export const STATUSES = ["disponibil", "rezervat", "vandut", "nou-sosit", "in-curand"] as const;

export const STATUS_LABEL: Record<string, string> = {
  disponibil: "Disponibil",
  rezervat: "Rezervat",
  vandut: "Vândut",
  "nou-sosit": "Nou sosit",
  "in-curand": "În curând",
};
