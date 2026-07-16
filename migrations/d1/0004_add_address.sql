-- Editable public address on site_settings (footer, contact, about, car page,
-- and drives the embedded Google map: ?q=<address>&output=embed).
ALTER TABLE site_settings ADD COLUMN address TEXT NOT NULL DEFAULT '';

UPDATE site_settings
SET address = 'Cernat, jud. Covasna, România'
WHERE id = 'default' AND address = '';
