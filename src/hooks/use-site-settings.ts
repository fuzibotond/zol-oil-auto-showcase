import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/api/site-settings.functions";
import { SITE_SETTINGS_FALLBACK } from "@/lib/site";

export function useSiteSettings() {
  const fetchSettings = useServerFn(getSiteSettings);
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 1000 * 60,
  });

  return {
    ...query,
    settings: query.data ?? SITE_SETTINGS_FALLBACK,
  };
}
