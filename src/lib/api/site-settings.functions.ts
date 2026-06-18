import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

function isMissingSiteSettingsTableError(error: any): boolean {
  const msg = String(error?.message ?? "");
  return error?.code === "PGRST205" || msg.includes("public.site_settings");
}

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

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("contact_email, phone, phone_display, whatsapp, opening_hours, social_links")
    .eq("id", "default")
    .maybeSingle();

  // Until the DB migration is applied, keep the site usable with local fallback values.
  if (error) {
    if (isMissingSiteSettingsTableError(error)) return { ...SITE_SETTINGS_FALLBACK };
    throw new Error(error.message);
  }

  return normalizeSettings((data as Partial<SiteSettingsInput> | null) ?? null);
});

export const adminUpdateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(SettingsInputSchema)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);

    const sanitized = normalizeSettings(data);
    const { data: row, error } = await context.supabase
      .from("site_settings")
      .upsert({ id: "default", ...sanitized }, { onConflict: "id" })
      .select("contact_email, phone, phone_display, whatsapp, opening_hours, social_links")
      .single();

    if (error) {
      if (isMissingSiteSettingsTableError(error)) {
        throw new Error("Lipsește tabela public.site_settings. Rulează migrarea Supabase și încearcă din nou.");
      }
      throw new Error(error.message);
    }
    return normalizeSettings(row as Partial<SiteSettingsInput>);
  });
