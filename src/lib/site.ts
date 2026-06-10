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
  mapsDirections: "https://www.google.com/maps/dir/?api=1&destination=Cernat,Covasna,Romania",
  waze: "https://waze.com/ul?q=Cernat%20Covasna",
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
