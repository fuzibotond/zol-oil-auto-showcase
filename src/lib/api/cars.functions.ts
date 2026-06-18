import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Car, CarImage, Lead } from "@/lib/types";

// ---------- Public reads ----------

export const listCars = createServerFn({ method: "GET" })
  .validator((input: { featured?: boolean; limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    let q = supabase
      .from("cars")
      .select("*, images:car_images(id, car_id, url, alt_text, sort_order)")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (data.featured) q = q.eq("is_featured", true);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Car[];
  });

export const getCarBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { data: row, error } = await supabase
      .from("cars")
      .select("*, images:car_images(id, car_id, url, alt_text, sort_order)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const car = row as unknown as Car;
    if (car.images) car.images.sort((a, b) => a.sort_order - b.sort_order);
    return car;
  });

export const similarCars = createServerFn({ method: "GET" })
  .validator((input: { excludeId: string; brand: string }) => input)
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabase
      .from("cars")
      .select("*, images:car_images(id, car_id, url, alt_text, sort_order)")
      .neq("id", data.excludeId)
      .eq("brand", data.brand)
      .limit(3);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Car[];
  });

// ---------- Lead submission (public) ----------

const LeadInput = z.object({
  car_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(80),
  // Basic length guard only; strict format checking would reject too many valid Romanian inputs
  phone: z.string().trim().min(4).max(30),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  // Honeypot — must always be empty; bots fill it, humans don't see it
  honeypot: z.string().max(0).optional(),
});

export const submitLead = createServerFn({ method: "POST" })
  .validator(LeadInput)
  .handler(async ({ data }) => {
    // Honeypot triggered — silently discard without revealing spam detection
    if (data.honeypot) return { ok: true };
    const { error } = await supabase.from("leads").insert({
      car_id: data.car_id ?? null,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message || null,
      source: "website",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin (requires auth + admin role) ----------

/**
 * Returns a slug that is unique in the `cars` table.
 * If `baseSlug` is already taken (by a car other than `excludeId`), appends -2, -3, …
 */
async function uniqueSlug(sb: any, baseSlug: string, excludeId?: string): Promise<string> {
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
    let q = sb.from("cars").select("id").eq("slug", slug);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
  }
  return `${baseSlug}-${Date.now()}`;
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const adminListCars = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("cars")
      .select("*, images:car_images(id, car_id, url, alt_text, sort_order)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Car[];
  });

export const adminGetCar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("cars")
      .select("*, images:car_images(id, car_id, url, alt_text, sort_order)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.images) (data.images as CarImage[]).sort((a, b) => a.sort_order - b.sort_order);
    return data as unknown as Car | null;
  });

const CarInput = z.object({
  slug: z.string().min(2).max(120),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(80),
  version: z.string().max(80).optional().nullable(),
  year: z.number().int().min(1950).max(2100),
  price: z.number().min(0).max(1_000_000),
  currency: z.string().default("EUR"),
  mileage: z.number().int().min(0).max(2_000_000).default(0),
  fuel_type: z.string().min(1).max(20),
  transmission: z.string().min(1).max(20),
  engine_size: z.number().int().min(0).max(10000).optional().nullable(),
  power: z.number().int().min(0).max(2000).optional().nullable(),
  body_type: z.string().max(30).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  equipment: z.array(z.string().max(60)).default([]),
  status: z.string().min(1).max(20),
  is_featured: z.boolean().default(false),
  images: z.array(z.object({ url: z.string().url().max(500), alt_text: z.string().max(120).optional().nullable() })).default([]),
});

export const adminUpsertCar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), data: CarInput }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { images, ...carFields } = data.data;
    // Ensure slug is unique before writing
    carFields.slug = await uniqueSlug(context.supabase, carFields.slug, data.id);
    let carId = data.id;
    if (carId) {
      const { error } = await context.supabase.from("cars").update(carFields).eq("id", carId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await context.supabase
        .from("cars")
        .insert(carFields)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      carId = row.id as string;
    }
    // Replace images
    await context.supabase.from("car_images").delete().eq("car_id", carId);
    if (images.length) {
      const toInsert = images.map((img, i) => ({
        car_id: carId,
        url: img.url,
        alt_text: img.alt_text ?? null,
        sort_order: i,
      }));
      const { error } = await context.supabase.from("car_images").insert(toInsert);
      if (error) throw new Error(error.message);
    }
    return { id: carId };
  });

export const adminDeleteCar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cars").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("leads")
      .select("*, car:cars(id, slug, brand, model, year)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as unknown as (Lead & { car: { id: string; slug: string; brand: string; model: string; year: number } | null })[];
  });

export const adminUpdateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid(), status: z.enum(["nou", "contactat", "inchis"]) }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) return false;
    return Boolean(data);
  });
