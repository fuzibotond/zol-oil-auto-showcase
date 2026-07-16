// Server-only data-access layer over Cloudflare D1.
// Every query is parameterised. Domain mapping (JSON columns, 0/1 booleans) lives
// here so server functions and routes deal only with the domain types in @/lib/types.
//
// NOTE: import this lazily inside server-function handlers
//   const repo = await import("@/lib/db/repository");
// so it never ends up in the client bundle.

import type { Car, CarImage, CarStatus, Lead } from "@/lib/types";
import type { SiteSettingsInput } from "@/lib/site";
import { getDB, newId, nowIso } from "./env";

// ---------------------------------------------------------------------------
// Row shapes (as stored in D1)
// ---------------------------------------------------------------------------
interface CarRow {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string | null;
  autovit_url: string | null;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  engine_size: number | null;
  power: number | null;
  body_type: string | null;
  color: string | null;
  description: string | null;
  equipment: string; // JSON array
  status: string;
  is_featured: number; // 0/1
  created_at: string;
  updated_at: string;
}

interface CarImageRow {
  id: string;
  car_id: string;
  r2_key: string | null;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

interface LeadRow {
  id: string;
  car_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string | null;
  status: string;
  marketing_consent: number;
  created_at: string;
}

interface SiteSettingsRow {
  contact_email: string;
  phone: string;
  phone_display: string;
  whatsapp: string;
  opening_hours: string; // JSON
  social_links: string; // JSON
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function mapImage(r: CarImageRow): CarImage {
  return {
    id: r.id,
    car_id: r.car_id,
    url: r.url,
    alt_text: r.alt_text,
    sort_order: r.sort_order,
    r2_key: r.r2_key,
  };
}

function mapCar(r: CarRow, images: CarImage[] = []): Car {
  return {
    id: r.id,
    slug: r.slug,
    brand: r.brand,
    model: r.model,
    version: r.version,
    autovit_url: r.autovit_url,
    year: r.year,
    price: r.price,
    currency: r.currency,
    mileage: r.mileage,
    fuel_type: r.fuel_type,
    transmission: r.transmission,
    engine_size: r.engine_size,
    power: r.power,
    body_type: r.body_type,
    color: r.color,
    description: r.description,
    equipment: safeJsonArray<string>(r.equipment),
    status: r.status as CarStatus,
    is_featured: r.is_featured === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
    images,
  };
}

async function imagesForCarIds(carIds: string[]): Promise<Map<string, CarImage[]>> {
  const map = new Map<string, CarImage[]>();
  if (carIds.length === 0) return map;
  const db = getDB();
  const placeholders = carIds.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT id, car_id, r2_key, url, alt_text, sort_order
       FROM car_images WHERE car_id IN (${placeholders})
       ORDER BY car_id, sort_order`,
    )
    .bind(...carIds)
    .all<CarImageRow>();
  for (const row of results) {
    const list = map.get(row.car_id) ?? [];
    list.push(mapImage(row));
    map.set(row.car_id, list);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------
export async function listCars(opts: { featured?: boolean; limit?: number } = {}): Promise<Car[]> {
  const db = getDB();
  const clauses: string[] = [];
  const binds: unknown[] = [];
  if (opts.featured) clauses.push("is_featured = 1");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = opts.limit ? `LIMIT ${Math.max(1, Math.min(200, Math.floor(opts.limit)))}` : "";
  const { results } = await db
    .prepare(
      `SELECT * FROM cars ${where}
       ORDER BY is_featured DESC, created_at DESC ${limit}`,
    )
    .bind(...binds)
    .all<CarRow>();
  const imgMap = await imagesForCarIds(results.map((r) => r.id));
  return results.map((r) => mapCar(r, imgMap.get(r.id) ?? []));
}

export async function getCarBySlug(slug: string): Promise<Car | null> {
  const db = getDB();
  const row = await db.prepare(`SELECT * FROM cars WHERE slug = ?`).bind(slug).first<CarRow>();
  if (!row) return null;
  const imgMap = await imagesForCarIds([row.id]);
  return mapCar(row, imgMap.get(row.id) ?? []);
}

export async function getCarById(id: string): Promise<Car | null> {
  const db = getDB();
  const row = await db.prepare(`SELECT * FROM cars WHERE id = ?`).bind(id).first<CarRow>();
  if (!row) return null;
  const imgMap = await imagesForCarIds([row.id]);
  return mapCar(row, imgMap.get(row.id) ?? []);
}

export async function listCarSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT slug, updated_at FROM cars ORDER BY updated_at DESC`)
    .all<{ slug: string; updated_at: string }>();
  return results;
}

export async function similarCars(excludeId: string, brand: string, limit = 3): Promise<Car[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT * FROM cars WHERE id != ? AND brand = ? ORDER BY created_at DESC LIMIT ?`)
    .bind(excludeId, brand, Math.max(1, Math.min(12, limit)))
    .all<CarRow>();
  const imgMap = await imagesForCarIds(results.map((r) => r.id));
  return results.map((r) => mapCar(r, imgMap.get(r.id) ?? []));
}

// ---------------------------------------------------------------------------
// Admin writes
// ---------------------------------------------------------------------------
export async function uniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  const db = getDB();
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
    const row = excludeId
      ? await db
          .prepare(`SELECT id FROM cars WHERE slug = ? AND id != ?`)
          .bind(slug, excludeId)
          .first<{ id: string }>()
      : await db.prepare(`SELECT id FROM cars WHERE slug = ?`).bind(slug).first<{ id: string }>();
    if (!row) return slug;
  }
  return `${baseSlug}-${Date.now()}`;
}

export interface CarWriteInput {
  slug: string;
  brand: string;
  model: string;
  version?: string | null;
  autovit_url?: string | null;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  engine_size?: number | null;
  power?: number | null;
  body_type?: string | null;
  color?: string | null;
  description?: string | null;
  equipment: string[];
  status: string;
  is_featured: boolean;
}

export interface ImageWriteInput {
  url: string;
  alt_text?: string | null;
  r2_key?: string | null;
}

export async function upsertCar(
  input: CarWriteInput,
  images: ImageWriteInput[],
  id?: string,
): Promise<{ id: string }> {
  const db = getDB();
  const slug = await uniqueSlug(input.slug, id);
  const now = nowIso();
  const carId = id ?? newId();

  if (id) {
    await db
      .prepare(
        `UPDATE cars SET slug=?, brand=?, model=?, version=?, autovit_url=?, year=?, price=?,
           currency=?, mileage=?, fuel_type=?, transmission=?, engine_size=?, power=?, body_type=?,
           color=?, description=?, equipment=?, status=?, is_featured=?, updated_at=?
         WHERE id=?`,
      )
      .bind(
        slug,
        input.brand,
        input.model,
        input.version ?? null,
        input.autovit_url ?? null,
        input.year,
        input.price,
        input.currency,
        input.mileage,
        input.fuel_type,
        input.transmission,
        input.engine_size ?? null,
        input.power ?? null,
        input.body_type ?? null,
        input.color ?? null,
        input.description ?? null,
        JSON.stringify(input.equipment ?? []),
        input.status,
        input.is_featured ? 1 : 0,
        now,
        id,
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO cars (id, slug, brand, model, version, autovit_url, year, price, currency,
           mileage, fuel_type, transmission, engine_size, power, body_type, color, description,
           equipment, status, is_featured, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .bind(
        carId,
        slug,
        input.brand,
        input.model,
        input.version ?? null,
        input.autovit_url ?? null,
        input.year,
        input.price,
        input.currency,
        input.mileage,
        input.fuel_type,
        input.transmission,
        input.engine_size ?? null,
        input.power ?? null,
        input.body_type ?? null,
        input.color ?? null,
        input.description ?? null,
        JSON.stringify(input.equipment ?? []),
        input.status,
        input.is_featured ? 1 : 0,
        now,
        now,
      )
      .run();
  }

  // Replace images (ordering preserved by array index).
  await db.prepare(`DELETE FROM car_images WHERE car_id = ?`).bind(carId).run();
  if (images.length) {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db
        .prepare(
          `INSERT INTO car_images (id, car_id, r2_key, url, alt_text, sort_order, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(newId(), carId, img.r2_key ?? null, img.url, img.alt_text ?? null, i, now, now)
        .run();
    }
  }

  return { id: carId };
}

/** Returns the R2 keys that were attached to a car, so the caller can clean R2 up. */
export async function getCarImageR2Keys(carId: string): Promise<string[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT r2_key FROM car_images WHERE car_id = ? AND r2_key IS NOT NULL`)
    .bind(carId)
    .all<{ r2_key: string }>();
  return results.map((r) => r.r2_key);
}

export async function deleteCar(id: string): Promise<void> {
  const db = getDB();
  await db.prepare(`DELETE FROM cars WHERE id = ?`).bind(id).run();
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export interface LeadWriteInput {
  car_id?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  marketing_consent?: boolean;
}

export async function insertLead(input: LeadWriteInput): Promise<void> {
  const db = getDB();
  await db
    .prepare(
      `INSERT INTO leads (id, car_id, name, phone, email, message, source, status, marketing_consent, created_at)
       VALUES (?,?,?,?,?,?,?, 'nou', ?, ?)`,
    )
    .bind(
      newId(),
      input.car_id ?? null,
      input.name,
      input.phone,
      input.email ?? null,
      input.message ?? null,
      input.source ?? "website",
      input.marketing_consent ? 1 : 0,
      nowIso(),
    )
    .run();
}

export type LeadWithCar = Lead & {
  car: { id: string; slug: string; brand: string; model: string; year: number } | null;
};

export async function listLeads(): Promise<LeadWithCar[]> {
  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT l.*, c.slug AS c_slug, c.brand AS c_brand, c.model AS c_model, c.year AS c_year
       FROM leads l LEFT JOIN cars c ON c.id = l.car_id
       ORDER BY l.created_at DESC`,
    )
    .all<
      LeadRow & {
        c_slug: string | null;
        c_brand: string | null;
        c_model: string | null;
        c_year: number | null;
      }
    >();
  return results.map((r) => ({
    id: r.id,
    car_id: r.car_id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    message: r.message,
    source: r.source,
    status: r.status as Lead["status"],
    created_at: r.created_at,
    car:
      r.car_id && r.c_slug
        ? {
            id: r.car_id,
            slug: r.c_slug,
            brand: r.c_brand ?? "",
            model: r.c_model ?? "",
            year: r.c_year ?? 0,
          }
        : null,
  }));
}

export async function updateLeadStatus(id: string, status: Lead["status"]): Promise<void> {
  const db = getDB();
  await db.prepare(`UPDATE leads SET status = ? WHERE id = ?`).bind(status, id).run();
}

export async function deleteLead(id: string): Promise<void> {
  const db = getDB();
  await db.prepare(`DELETE FROM leads WHERE id = ?`).bind(id).run();
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------
export async function getSiteSettingsRow(): Promise<SiteSettingsInput | null> {
  const db = getDB();
  const row = await db
    .prepare(
      `SELECT contact_email, phone, phone_display, whatsapp, opening_hours, social_links
       FROM site_settings WHERE id = 'default'`,
    )
    .first<SiteSettingsRow>();
  if (!row) return null;
  return {
    contact_email: row.contact_email,
    phone: row.phone,
    phone_display: row.phone_display,
    whatsapp: row.whatsapp,
    opening_hours: safeJsonArray(row.opening_hours),
    social_links: safeJsonArray(row.social_links),
  };
}

export async function upsertSiteSettings(input: SiteSettingsInput): Promise<void> {
  const db = getDB();
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO site_settings (id, contact_email, phone, phone_display, whatsapp, opening_hours, social_links, created_at, updated_at)
       VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         contact_email=excluded.contact_email, phone=excluded.phone, phone_display=excluded.phone_display,
         whatsapp=excluded.whatsapp, opening_hours=excluded.opening_hours, social_links=excluded.social_links,
         updated_at=excluded.updated_at`,
    )
    .bind(
      input.contact_email,
      input.phone,
      input.phone_display,
      input.whatsapp,
      JSON.stringify(input.opening_hours ?? []),
      JSON.stringify(input.social_links ?? []),
      now,
      now,
    )
    .run();
}

// ---------------------------------------------------------------------------
// Admin allowlist (used with Cloudflare Access)
// ---------------------------------------------------------------------------
export async function isAdminEmail(email: string): Promise<boolean> {
  const db = getDB();
  const row = await db
    .prepare(`SELECT email FROM admin_users WHERE email = ? COLLATE NOCASE`)
    .bind(email)
    .first<{ email: string }>();
  return Boolean(row);
}
