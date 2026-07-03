-- CrescentLab SQLite schema
-- Manual import only. The Go process does not run automatic migrations.
--
-- Example:
--   sqlite3 data/crescentlab.db < database/sqlite/schema.sql

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL DEFAULT 'site',
  group_key TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT 'null',
  value_type TEXT NOT NULL DEFAULT 'json',
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (scope, key),
  CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array', 'secret'))
);
