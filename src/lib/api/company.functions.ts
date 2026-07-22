import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { CompanyInfo } from "@/lib/types";

// Official company/legal information. Public pages only render fields that are
// actually filled in — nothing is invented or defaulted. The owner marks the
// core legal fields as verified in the admin panel (verified_fields).

const EMPTY_COMPANY: CompanyInfo = {
  trading_name: "",
  legal_name: "",
  entity_type: "",
  cui: "",
  reg_com: "",
  registered_address: "",
  workpoint_address: "",
  county: "",
  country: "",
  phone: "",
  email: "",
  website: "",
  vat_status: "",
  dpo_email: "",
  complaints_info: "",
  verified_fields: [],
};

export const getCompanyInfo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const repo = await import("@/lib/db/repository");
    return (await repo.getCompanyInfo()) ?? EMPTY_COMPANY;
  } catch {
    return EMPTY_COMPANY;
  }
});

/** Field names that may appear in verified_fields (the core legal identity). */
export const VERIFIABLE_FIELDS = ["legal_name", "cui", "reg_com", "registered_address"] as const;

const CompanySchema = z.object({
  trading_name: z.string().trim().max(120),
  legal_name: z.string().trim().max(160),
  entity_type: z.string().trim().max(40),
  cui: z.string().trim().max(20),
  reg_com: z.string().trim().max(30),
  registered_address: z.string().trim().max(240),
  workpoint_address: z.string().trim().max(240),
  county: z.string().trim().max(60),
  country: z.string().trim().max(60),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(120).email().or(z.literal("")),
  website: z.string().trim().max(200),
  vat_status: z.string().trim().max(40),
  dpo_email: z.string().trim().max(120).email().or(z.literal("")),
  complaints_info: z.string().trim().max(1000),
  verified_fields: z.array(z.enum(VERIFIABLE_FIELDS)).max(VERIFIABLE_FIELDS.length),
});

export const adminSaveCompanyInfo = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(CompanySchema)
  .handler(async ({ data }) => {
    // A field can only be "verified" if it actually has a value.
    const verified = data.verified_fields.filter((f) => (data[f] ?? "").trim().length > 0);
    const repo = await import("@/lib/db/repository");
    await repo.upsertCompanyInfo({ ...data, verified_fields: verified });
    return { ok: true };
  });
