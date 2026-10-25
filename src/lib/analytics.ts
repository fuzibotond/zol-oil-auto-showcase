// Lightweight dataLayer event helpers for GTM.
//
// These push semantic events to window.dataLayer. GA4 + Meta Pixel tags inside
// GTM listen for them (configure Custom Event triggers with the same names). No
// PII is sent. Tracking respects Consent Mode: GTM tags are gated on consent,
// so pushing an event before consent simply queues it — nothing stores cookies
// until the visitor accepts. Safe to call on the server (no-ops there).

type DL = Record<string, unknown>;

function push(event: string, params: DL = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: DL[] };
  (w.dataLayer ??= []).push({ event, ...params });
}

/** A car detail page was viewed. */
export function trackCarView(car: {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  fuel_type: string;
  transmission: string;
}) {
  push("car_view", {
    car_id: car.id,
    car_name: `${car.brand} ${car.model} ${car.year}`,
    brand: car.brand,
    model: car.model,
    year: car.year,
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    value: car.price,
    currency: car.currency || "EUR",
  });
}

/** A contact action: phone / whatsapp / messenger. `context` = where it happened. */
export function trackContact(
  method: "phone" | "whatsapp" | "messenger" | "email" | "maps" | "waze",
  context: string,
  carId?: string,
) {
  push("contact_click", { contact_method: method, context, ...(carId ? { car_id: carId } : {}) });
}

/** A filter/search was applied on the inventory page. */
export function trackFilter(filters: DL) {
  // Drop empty values to keep the event readable in GA4.
  const active = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v != null),
  );
  push("filter_used", { filters: active });
}

/** A lead form was submitted successfully. */
export function trackLead(source: string, carId?: string | null) {
  push("generate_lead", { source, ...(carId ? { car_id: carId } : {}) });
}
