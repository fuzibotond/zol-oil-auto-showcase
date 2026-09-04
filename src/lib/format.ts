export const fmtPrice = (price: number, currency = "EUR") =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    price,
  );

export const fmtKm = (km: number) => `${new Intl.NumberFormat("ro-RO").format(km)} km`;

/**
 * A genuine price drop: an original price that is set and strictly higher than
 * the current price. Returns null otherwise (nothing to show).
 */
export function priceDrop(
  price: number,
  originalPrice: number | null | undefined,
): { original: number; percent: number } | null {
  if (originalPrice == null || originalPrice <= price) return null;
  return { original: originalPrice, percent: Math.round((1 - price / originalPrice) * 100) };
}

export const fmtNumber = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

/** Short Romanian date, e.g. "13 aug. 2026". */
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "short", year: "numeric" }).format(
        d,
      );
};

/** True if the ISO timestamp is within the last `days` days (default 7). */
export const isRecent = (iso: string, days = 7) => {
  const t = new Date(iso).getTime();
  return !isNaN(t) && Date.now() - t < days * 24 * 60 * 60 * 1000;
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
