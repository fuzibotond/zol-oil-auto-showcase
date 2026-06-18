CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  contact_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_display TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  opening_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings public read" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id, contact_email, phone, phone_display, whatsapp, opening_hours, social_links)
VALUES (
  'default',
  'contact@zol-oil.ro',
  '+40 700 000 000',
  '0700 000 000',
  '40700000000',
  '[{"day":"Luni – Vineri","value":"09:00 – 18:00"},{"day":"Sâmbătă","value":"10:00 – 14:00"},{"day":"Duminică","value":"Închis"}]'::jsonb,
  '[{"key":"facebook","label":"Facebook","url":"https://facebook.com/parcautozoloil","enabled":true},{"key":"messenger","label":"Messenger","url":"https://m.me/parcautozoloil","enabled":true},{"key":"instagram","label":"Instagram","url":"","enabled":false},{"key":"tiktok","label":"TikTok","url":"","enabled":false},{"key":"youtube","label":"YouTube","url":"","enabled":false}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
