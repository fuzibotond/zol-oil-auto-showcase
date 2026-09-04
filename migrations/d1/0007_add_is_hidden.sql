-- Allow the owner to hide a car from the public site without deleting it.
-- Hidden cars are excluded from all public reads (listing, detail page,
-- available counter, sitemap, "similar cars") but remain fully visible and
-- editable in the admin.
ALTER TABLE cars ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0
  CHECK (is_hidden IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_cars_hidden ON cars(is_hidden);
