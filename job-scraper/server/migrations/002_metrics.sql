-- Metrics persistence
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_requests INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TEXT
);

INSERT INTO metrics (id, total_requests, success_count, failure_count, last_reset_at)
VALUES (1, 0, 0, 0, datetime('now'))
ON CONFLICT(id) DO NOTHING;

-- Cron state persistence
CREATE TABLE IF NOT EXISTS cron_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state TEXT NOT NULL CHECK (state IN ('idle','running','paused')) DEFAULT 'idle',
  last_run_at TEXT,
  next_run_at TEXT,
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  is_running INTEGER NOT NULL DEFAULT 0 -- 0/1
);

INSERT INTO cron_state (id, state, last_run_at, next_run_at, interval_minutes, is_running)
VALUES (1, 'idle', NULL, NULL, 60, 0)
ON CONFLICT(id) DO NOTHING;
