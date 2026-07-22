import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCompanyInfo } from "@/lib/api/company.functions";

export function useCompanyInfo() {
  const fetchCompany = useServerFn(getCompanyInfo);
  const query = useQuery({
    queryKey: ["company-info"],
    queryFn: () => fetchCompany(),
    staleTime: 1000 * 60,
  });
  return { ...query, company: query.data ?? null };
}
