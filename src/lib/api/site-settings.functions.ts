import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  SITE_SETTINGS_FALLBACK,
  SOCIAL_PLATFORM_META,
  type SiteOpeningHour,
  type SiteSettingsInput,
  type SiteSocialLink,
  type SocialPlatform,
} from "@/lib/site";

const SOCIAL_KEYS = Object.keys(SOCIAL_PLATFORM_META) as SocialPlatform[];

const OpeningHourSchema = z.object({
  day: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(40),
});

const SocialLinkSchema = z.object({
  key: z.enum(SOCIAL_KEYS as [SocialPlatform, ...SocialPlatform[]]),
  label: z.string().trim().min(1).max(30),
  url: z.string().trim().max(500),
  enabled: z.boolean(),
});

const SettingsInputSchema = z.object({
  contact_email: z.string().trim().email().max(120),
  phone: z.string().trim().min(4).max(40),
  phone_display: z.string().trim().min(4).max(40),
  whatsapp: z.string().trim().min(4).max(30),
  opening_hours: z.array(OpeningHourSchema).max(14),
  social_links: z.array(SocialLinkSchema),
});

function normalizeHours(input: unknown): SiteOpeningHour[] {
  if (!Array.isArray(input)) return SITE_SETTINGS_FALLBACK.opening_hours;
  const parsed = input
    .map((x) => OpeningHourSchema.safeParse(x))
    .filter((x) => x.success)
    .map((x) => x.data);
  return parsed.length ? parsed : SITE_SETTINGS_FALLBACK.opening_hours;
}

function normalizeSocial(input: unknown): SiteSocialLink[] {
  const fallbackByKey = new Map(SITE_SETTINGS_FALLBACK.social_links.map((x) => [x.key, x]));
  const parsedList = Array.isArray(input)
    ? input
        .map((x) => SocialLinkSchema.safeParse(x))
        .filter((x) => x.success)
        .map((x) => x.data)
    : [];
  const parsedByKey = new Map(parsedList.map((x) => [x.key, x]));

  return SOCIAL_KEYS.map((key) => {
    const parsed = parsedByKey.get(key);
    const fallback = fallbackByKey.get(key)!;
    return {
      key,
      label: parsed?.label?.trim() || fallback.label,
      url: parsed?.url?.trim() || fallback.url,
      enabled: parsed ? parsed.enabled : fallback.enabled,
    };
  });
}

function normalizeSettings(input?: Partial<SiteSettingsInput> | null): SiteSettingsInput {
  if (!input) return { ...SITE_SETTINGS_FALLBACK };
  return {
    contact_email: input.contact_email?.trim() || SITE_SETTINGS_FALLBACK.contact_email,
    phone: input.phone?.trim() || SITE_SETTINGS_FALLBACK.phone,
    phone_display: input.phone_display?.trim() || SITE_SETTINGS_FALLBACK.phone_display,
    whatsapp: input.whatsapp?.trim() || SITE_SETTINGS_FALLBACK.whatsapp,
    opening_hours: normalizeHours(input.opening_hours),
    social_links: normalizeSocial(input.social_links),
  };
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  // Keep the public site usable even before D1 is provisioned: fall back to local defaults.
  try {
    const repo = await import("@/lib/db/repository");
    const row = await repo.getSiteSettingsRow();
    return normalizeSettings(row);
  } catch {
    return { ...SITE_SETTINGS_FALLBACK };
  }
});

export const adminUpdateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(SettingsInputSchema)
  .handler(async ({ data }) => {
    const sanitized = normalizeSettings(data);
    const repo = await import("@/lib/db/repository");
    await repo.upsertSiteSettings(sanitized);
    return sanitized;
  });
