import { useQuery } from "@tanstack/react-query";
import { rootRouteId, useMatch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/api/site-settings.functions";
import { SITE_SETTINGS_FALLBACK, type SiteSettingsInput } from "@/lib/site";

export function useSiteSettings() {
  const fetchSettings = useServerFn(getSiteSettings);
  // Seed from the root loader so the server-rendered HTML (what crawlers see)
  // already contains the real admin-configured contact data, not the fallback.
  const initial = useMatch({
    from: rootRouteId,
    shouldThrow: false,
    select: (m) => (m.loaderData as { settings?: SiteSettingsInput } | undefined)?.settings,
  });
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 1000 * 60,
    initialData: initial,
  });

  return {
    ...query,
    settings: query.data ?? SITE_SETTINGS_FALLBACK,
  };
}
