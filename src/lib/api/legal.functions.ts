import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { LegalPageDoc } from "@/lib/types";

export const LEGAL_SLUGS = ["confidentialitate", "politica-cookie", "termeni"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_META: Record<LegalSlug, { title: string; nav: string }> = {
  confidentialitate: { title: "Politica de confidențialitate", nav: "Confidențialitate" },
  "politica-cookie": { title: "Politica de cookie-uri", nav: "Cookie-uri" },
  termeni: { title: "Termeni și condiții", nav: "Termeni și condiții" },
};

export const getLegalPage = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    try {
      const repo = await import("@/lib/db/repository");
      return await repo.getLegalPage(slug);
    } catch {
      return null as LegalPageDoc | null;
    }
  });

export const adminListLegalPages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const repo = await import("@/lib/db/repository");
    return repo.listLegalPages();
  });

const LegalInput = z.object({
  slug: z.enum(LEGAL_SLUGS),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(40000),
  needs_review: z.boolean(),
});

export const adminSaveLegalPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(LegalInput)
  .handler(async ({ data }) => {
    const repo = await import("@/lib/db/repository");
    await repo.upsertLegalPage(data.slug, data.title, data.body, data.needs_review);
    return { ok: true };
  });
