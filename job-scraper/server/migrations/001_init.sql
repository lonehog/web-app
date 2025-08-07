PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS PortalConfig (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Keyword (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portalConfigId INTEGER NOT NULL,
  term TEXT NOT NULL,
  FOREIGN KEY (portalConfigId) REFERENCES PortalConfig(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Job (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal TEXT NOT NULL,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description_snippet TEXT,
  posting_time TEXT NOT NULL, -- ISO string in Europe/Berlin
  scrape_time TEXT NOT NULL,  -- ISO string in Europe/Berlin
  is_repeat INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_posting_time ON Job(posting_time);
CREATE INDEX IF NOT EXISTS idx_job_scrape_time ON Job(scrape_time);
CREATE INDEX IF NOT EXISTS idx_job_dedupe ON Job(title, company, location, posting_time);
CREATE INDEX IF NOT EXISTS idx_keyword_portal ON Keyword(portalConfigId);

COMMIT;
