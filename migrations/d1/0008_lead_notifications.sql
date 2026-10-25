-- One row per new-lead email notification attempt (sent / failed / skipped),
-- so a missing email can be diagnosed without digging through Worker logs.
-- Notifications are best-effort and never affect the lead submission itself.
CREATE TABLE IF NOT EXISTS lead_notifications (
  id          TEXT PRIMARY KEY,
  lead_id     TEXT REFERENCES leads(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL DEFAULT 'email',
  status      TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
  recipients  TEXT,                 -- comma-separated
  message_id  TEXT,                 -- provider message id when sent
  error       TEXT,                 -- failure / skip reason
  duration_ms INTEGER,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_lead    ON lead_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_created ON lead_notifications(created_at DESC);
