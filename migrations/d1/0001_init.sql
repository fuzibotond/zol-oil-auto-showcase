-- ZOL-OIL — Cloudflare D1 schema (initial)
-- SQLite dialect. Timestamps are ISO-8601 UTC TEXT. Booleans are 0/1 INTEGER.
-- JSON-typed columns (equipment, opening_hours, social_links, verified_fields)
-- hold JSON text; the repository layer parses/serialises them.
--
-- IDs are application-generated (crypto.randomUUID()) — SQLite has no gen_random_uuid().
-- Foreign-key enforcement is ON by default for the D1 binding.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Admin allowlist (defense-in-depth alongside Cloudflare Access).
-- Cloudflare Access gates /admin* at the edge; server functions ALSO verify the
-- authenticated Access email is present here before any mutation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  email      TEXT PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cars (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  version      TEXT,
  autovit_url  TEXT,
  year         INTEGER NOT NULL,
  price        INTEGER NOT NULL,               -- whole currency units (no cents in use)
  currency     TEXT NOT NULL DEFAULT 'EUR',
  mileage      INTEGER NOT NULL DEFAULT 0,
  fuel_type    TEXT NOT NULL,
  transmission TEXT NOT NULL,
  engine_size  INTEGER,
  power        INTEGER,
  body_type    TEXT,
  color        TEXT,
  description  TEXT,
  equipment    TEXT NOT NULL DEFAULT '[]',     -- JSON array of strings
  status       TEXT NOT NULL DEFAULT 'disponibil'
               CHECK (status IN ('disponibil','rezervat','vandut','nou-sosit','in-curand')),
  is_featured  INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_cars_status   ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_featured ON cars(is_featured);
CREATE INDEX IF NOT EXISTS idx_cars_brand    ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_created  ON cars(created_at DESC);

-- ---------------------------------------------------------------------------
-- Vehicle images. r2_key is NULL for externally-hosted URLs (e.g. autovit).
-- url is the delivery URL used by the site (R2 custom domain or external).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_images (
  id                TEXT PRIMARY KEY,
  car_id            TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  r2_key            TEXT,
  url               TEXT NOT NULL,
  original_filename TEXT,
  mime_type         TEXT,
  file_size         INTEGER,
  width             INTEGER,
  height            INTEGER,
  alt_text          TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_car_images_car ON car_images(car_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_car_images_r2  ON car_images(r2_key);

-- ---------------------------------------------------------------------------
-- Leads (enquiries). marketing_consent is separate & optional (GDPR).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id                TEXT PRIMARY KEY,
  car_id            TEXT REFERENCES cars(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,
  message           TEXT,
  source            TEXT DEFAULT 'website',
  status            TEXT NOT NULL DEFAULT 'nou' CHECK (status IN ('nou','contactat','inchis')),
  marketing_consent INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0,1)),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- ---------------------------------------------------------------------------
-- Site settings (single row 'default') — contact/hours/social.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  id            TEXT PRIMARY KEY DEFAULT 'default',
  contact_email TEXT NOT NULL,
  phone         TEXT NOT NULL,
  phone_display TEXT NOT NULL,
  whatsapp      TEXT NOT NULL,
  opening_hours TEXT NOT NULL DEFAULT '[]',    -- JSON
  social_links  TEXT NOT NULL DEFAULT '[]',    -- JSON
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- Official company / legal information (single row 'default').
-- verified_fields = JSON array of field names the owner has CONFIRMED as correct.
-- Any field not listed there is treated as "needs verification" by the UI.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_info (
  id                    TEXT PRIMARY KEY DEFAULT 'default',
  trading_name          TEXT,
  legal_name            TEXT,
  entity_type           TEXT,                  -- SRL, PFA, II, ...
  cui                   TEXT,                  -- CUI/CIF
  reg_com               TEXT,                  -- Nr. Registrul Comerțului
  registered_address    TEXT,
  workpoint_address     TEXT,
  county                TEXT,
  country               TEXT DEFAULT 'România',
  phone                 TEXT,
  email                 TEXT,
  business_hours        TEXT,
  website               TEXT,
  maps_url              TEXT,
  facebook_url          TEXT,
  vat_status            TEXT,                  -- 'platitor_tva' | 'neplatitor_tva' | ...
  authorization_details TEXT,
  dpo_email             TEXT,                  -- data-protection contact
  complaints_info       TEXT,
  verified_fields       TEXT NOT NULL DEFAULT '[]',  -- JSON array
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- About-page hero/meta (single row 'default') + repeatable content sections.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS about_page (
  id            TEXT PRIMARY KEY DEFAULT 'default',
  hero_title    TEXT,
  intro         TEXT,
  seo_title     TEXT,
  seo_description TEXT,
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS about_sections (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  body           TEXT,                          -- sanitised HTML/text
  image_url      TEXT,
  image_r2_key   TEXT,
  image_alt      TEXT,
  image_position TEXT NOT NULL DEFAULT 'left' CHECK (image_position IN ('left','right','top','none')),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_published   INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0,1)),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_about_sections_order ON about_sections(sort_order);

-- ---------------------------------------------------------------------------
-- Editable legal pages (privacy, cookie policy, terms). needs_review flags
-- text that has not yet been confirmed by the business / a Romanian lawyer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_pages (
  slug         TEXT PRIMARY KEY,               -- 'confidentialitate' | 'cookie' | 'termeni'
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,                  -- sanitised HTML
  version      INTEGER NOT NULL DEFAULT 1,
  needs_review INTEGER NOT NULL DEFAULT 1 CHECK (needs_review IN (0,1)),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
