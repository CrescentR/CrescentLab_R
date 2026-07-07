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

-- =========================================================
-- 3. Content, articles
-- =========================================================

CREATE TABLE IF NOT EXISTS post_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (article_count >= 0)
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE,
  owner_id INTEGER,
  category_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_md TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'public',
  source_format TEXT NOT NULL DEFAULT 'markdown',
  allow_comment BOOLEAN NOT NULL DEFAULT true,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pin_sort INTEGER NOT NULL DEFAULT 0,
  home_sort INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
  CHECK (visibility IN ('public', 'private', 'password')),
  CHECK (source_format IN ('markdown', 'tiptap', 'html')),
  CHECK (view_count >= 0),
  CHECK (comment_count >= 0),
  CHECK (word_count >= 0),
  CHECK (reading_time_minutes >= 0)
);
