import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { AboutPage, AboutSection } from "@/lib/types";

// Section `body` is treated as PLAIN TEXT (rendered with preserved whitespace,
// never as HTML) — the simplest safe content model, no sanitisation needed.

const DEFAULT_ABOUT: AboutPage = {
  hero_title: "Despre ZOL-OIL",
  intro:
    "Parc auto din Cernat, județul Covasna. Autoturisme rulate, verificate și pregătite pentru drum.",
  seo_title: "Despre noi · Parc Auto ZOL-OIL",
  seo_description:
    "Află mai multe despre parcul auto ZOL-OIL din Cernat, Covasna: mașini rulate verificate și consiliere corectă la achiziție.",
};

export const getAbout = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const repo = await import("@/lib/db/repository");
    const [page, sections] = await Promise.all([repo.getAboutPage(), repo.listAboutSections(true)]);
    return { page: page ?? DEFAULT_ABOUT, sections };
  } catch {
    return { page: DEFAULT_ABOUT, sections: [] as AboutSection[] };
  }
});

export const adminGetAbout = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const repo = await import("@/lib/db/repository");
    const [page, sections] = await Promise.all([
      repo.getAboutPage(),
      repo.listAboutSections(false),
    ]);
    return { page: page ?? DEFAULT_ABOUT, sections };
  });

const AboutPageSchema = z.object({
  hero_title: z.string().trim().max(160),
  intro: z.string().trim().max(4000),
  seo_title: z.string().trim().max(200),
  seo_description: z.string().trim().max(320),
});

export const adminSaveAboutPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(AboutPageSchema)
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    await repo.upsertAboutPage(data);
    return { ok: true };
  });

const SectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(6000).optional().nullable(),
  image_url: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .refine((v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v), "URL invalid"),
  image_r2_key: z.string().max(300).optional().nullable(),
  image_alt: z.string().max(200).optional().nullable(),
  image_position: z.enum(["left", "right", "top", "none"]),
  sort_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

export const adminSaveAboutSection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(SectionSchema)
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    const { id, ...input } = data;
    const res = await repo.upsertAboutSection(input, id);
    // If the image was replaced, remove the now-orphaned R2 object.
    if (res.previousR2Key) {
      try {
        const { deleteR2Objects } = await import("@/lib/images/r2");
        await deleteR2Objects([res.previousR2Key]);
      } catch {
        // reported by the R2 audit; don't fail the save
      }
    }
    return { id: res.id };
  });

export const adminDeleteAboutSection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const repo = await import("@/lib/db/repository");
    const key = await repo.getAboutSectionR2Key(id);
    await repo.deleteAboutSection(id);
    if (key) {
      try {
        const { deleteR2Objects } = await import("@/lib/images/r2");
        await deleteR2Objects([key]);
      } catch {
        // ignore
      }
    }
    return { ok: true };
  });
