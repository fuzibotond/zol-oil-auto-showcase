import { useQuery } from "@tanstack/react-query";
import { rootRouteId, useMatch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getCompanyInfo } from "@/lib/api/company.functions";
import type { CompanyInfo } from "@/lib/types";

export function useCompanyInfo() {
  const fetchCompany = useServerFn(getCompanyInfo);
  // Seeded from the root loader so legal identification is in the SSR HTML.
  const initial = useMatch({
    from: rootRouteId,
    shouldThrow: false,
    select: (m) => (m.loaderData as { company?: CompanyInfo } | undefined)?.company,
  });
  const query = useQuery({
    queryKey: ["company-info"],
    queryFn: () => fetchCompany(),
    staleTime: 1000 * 60,
    initialData: initial,
  });
  return { ...query, company: query.data ?? null };
}
