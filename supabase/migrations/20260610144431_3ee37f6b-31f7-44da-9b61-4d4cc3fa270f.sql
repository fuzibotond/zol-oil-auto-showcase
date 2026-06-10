
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

DROP POLICY "Anyone can submit lead" ON public.leads;
CREATE POLICY "Public can submit lead" ON public.leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
