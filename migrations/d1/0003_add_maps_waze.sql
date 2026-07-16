-- Editable location links (Google Maps + Waze) on site_settings.
ALTER TABLE site_settings ADD COLUMN maps_url TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN waze_url TEXT NOT NULL DEFAULT '';

-- Seed the default row with the current known links (admin can edit/clear later).
UPDATE site_settings
SET maps_url = 'https://share.google/9gfGgLgT7AKrY7Ngt',
    waze_url = 'https://waze.com/ul?q=Cernat%20Covasna'
WHERE id = 'default' AND maps_url = '';
