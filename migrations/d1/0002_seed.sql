-- ZOL-OIL — D1 seed (default singleton rows).
-- These are PLACEHOLDER values. Real legal company data (legal name, CUI/CIF,
-- Trade Register number, registered office) MUST be entered by the business owner
-- via the admin panel. verified_fields is intentionally empty so every legal field
-- shows as "needs verification" until confirmed.

INSERT INTO site_settings (id, contact_email, phone, phone_display, whatsapp, opening_hours, social_links)
VALUES (
  'default',
  'contact@zol-oil.ro',
  '+40 700 000 000',
  '0700 000 000',
  '40700000000',
  json('[{"day":"Luni – Vineri","value":"09:00 – 18:00"},{"day":"Sâmbătă","value":"10:00 – 14:00"},{"day":"Duminică","value":"Închis"}]'),
  json('[{"key":"facebook","label":"Facebook","url":"https://facebook.com/parcautozoloil","enabled":true},{"key":"messenger","label":"Messenger","url":"https://m.me/parcautozoloil","enabled":true},{"key":"instagram","label":"Instagram","url":"","enabled":false},{"key":"tiktok","label":"TikTok","url":"","enabled":false},{"key":"youtube","label":"YouTube","url":"","enabled":false},{"key":"autovit","label":"Autovit","url":"","enabled":false},{"key":"olx","label":"OLX","url":"","enabled":false}]')
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO company_info (id, trading_name, country, verified_fields)
VALUES ('default', 'Parc Auto ZOL-OIL', 'România', '[]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO about_page (id, hero_title, intro, seo_title, seo_description)
VALUES (
  'default',
  'Despre ZOL-OIL',
  'Parc auto din Cernat, județul Covasna. Autoturisme rulate, verificate și pregătite pentru drum.',
  'Despre noi · Parc Auto ZOL-OIL',
  'Află mai multe despre parcul auto ZOL-OIL din Cernat, Covasna: mașini rulate verificate și consiliere corectă la achiziție.'
)
ON CONFLICT (id) DO NOTHING;
