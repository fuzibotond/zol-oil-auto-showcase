export const fmtPrice = (price: number, currency = "EUR") =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

export const fmtKm = (km: number) =>
  `${new Intl.NumberFormat("ro-RO").format(km)} km`;

export const fmtNumber = (n: number) =>
  new Intl.NumberFormat("ro-RO").format(n);

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
