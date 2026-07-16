import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Car, Lead } from "@/lib/types";

// All data access goes through the Cloudflare D1 repository (lazy-imported inside
// handlers so it never reaches the client bundle). Authorization for admin
// functions is enforced by `requireAdmin` (Cloudflare Access JWT + allowlist).

// ---------- Public reads ----------

export const listCars = createServerFn({ method: "GET" })
  .validator((input: { featured?: boolean; limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    return repo.listCars(data);
  });

export const getCarBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const repo = await import("@/lib/db/repository");
    return repo.getCarBySlug(slug);
  });

export const similarCars = createServerFn({ method: "GET" })
  .validator((input: { excludeId: string; brand: string }) => input)
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    return repo.similarCars(data.excludeId, data.brand, 3);
  });

// ---------- Lead submission (public) ----------

const LeadInput = z.object({
  car_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(80),
  // Basic length guard only; strict format checking would reject too many valid Romanian inputs
  phone: z.string().trim().min(4).max(30),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.string().trim().min(2).max(40).optional(),
  // Optional, explicit, unchecked-by-default marketing consent (GDPR).
  marketing_consent: z.boolean().optional(),
  // Honeypot — keep permissive here because extensions/autofill may inject values.
  // We still enforce anti-spam in the handler by silently discarding non-empty values.
  honeypot: z.string().max(500).optional().or(z.literal("")),
});

export const submitLead = createServerFn({ method: "POST" })
  .validator(LeadInput)
  .handler(async ({ data }) => {
    const honeypotFilled = (data.honeypot ?? "").trim().length > 0;
    const repo = await import("@/lib/db/repository");

    await repo.insertLead({
      car_id: data.car_id ?? null,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message || null,
      source: honeypotFilled ? `${data.source || "website"}-honeypot` : data.source || "website",
      marketing_consent: Boolean(data.marketing_consent),
    });

    // Best-effort email notification; never fails the lead submission.
    if (!honeypotFilled) {
      try {
        const { notifyNewLead } = await import("@/lib/notify");
        await notifyNewLead({
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          message: data.message || null,
        });
      } catch {
        // ignore notification errors
      }
    }

    return { ok: true };
  });

// ---------- Admin (behind Cloudflare Access + ADMIN_EMAILS allowlist) ----------

const ImageInput = z.object({
  url: z.string().url().max(1000),
  alt_text: z.string().max(160).optional().nullable(),
  r2_key: z.string().max(300).optional().nullable(),
});

const CarInput = z.object({
  slug: z.string().min(2).max(120),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(80),
  autovit_url: z.string().trim().max(500).optional().nullable(),
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
  images: z.array(ImageInput).default([]),
});

export const adminListCars = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const repo = await import("@/lib/db/repository");
    return repo.listCars({});
  });

export const adminGetCar = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const repo = await import("@/lib/db/repository");
    return repo.getCarById(id);
  });

export const adminUpsertCar = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.string().uuid().optional(), data: CarInput }))
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    const { images, ...carFields } = data.data;
    return repo.upsertCar(
      carFields,
      images.map((img) => ({
        url: img.url,
        alt_text: img.alt_text ?? null,
        r2_key: img.r2_key ?? null,
      })),
      data.id,
    );
  });

export const adminDeleteCar = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const repo = await import("@/lib/db/repository");
    // Remove backing R2 objects (best-effort) before deleting the car row.
    const keys = await repo.getCarImageR2Keys(id);
    if (keys.length) {
      try {
        const { deleteR2Objects } = await import("@/lib/images/r2");
        await deleteR2Objects(keys);
      } catch {
        // orphaned objects are reported by the R2 audit script; don't block deletion
      }
    }
    await repo.deleteCar(id);
    return { ok: true };
  });

export const adminListLeads = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const repo = await import("@/lib/db/repository");
    return repo.listLeads() as unknown as Promise<
      (Lead & {
        car: { id: string; slug: string; brand: string; model: string; year: number } | null;
      })[]
    >;
  });

export const adminUpdateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.string().uuid(), status: z.enum(["nou", "contactat", "inchis"]) }))
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    await repo.updateLeadStatus(data.id, data.status);
    return { ok: true };
  });

export const adminDeleteLead = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const repo = await import("@/lib/db/repository");
    await repo.deleteLead(id);
    return { ok: true };
  });

// With `requireAdmin` attached, reaching the handler means the Cloudflare Access
// JWT is valid and the email is allowlisted. If not, the middleware throws and
// the client treats it as "not admin".
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    return Boolean(context.adminEmail);
  });

// Re-export the domain type for callers that imported it from here previously.
export type { Car };
