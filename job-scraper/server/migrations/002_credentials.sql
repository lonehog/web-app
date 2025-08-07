PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS PortalCredential (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,        -- JSON string with cookie fields and preferences (e.g., recencyHours)
  updated_at TEXT NOT NULL   -- ISO string in Europe/Berlin
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credential_provider ON PortalCredential(provider);

COMMIT;
