-- CrescentLab SQLite schema
-- Manual import only. The Go process does not run automatic migrations.
--
-- Example:
--   sqlite3 data/crescentlab.db < database/sqlite/schema.sql

-- =========================================================
-- 1. Users, groups, permissions, auth
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER,
  username TEXT NOT NULL,
  username_key TEXT NOT NULL UNIQUE,
  email TEXT,
  email_key TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_file_id INTEGER,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_system BOOLEAN NOT NULL DEFAULT false,
  email_verified_at DATETIME,
  activated_at DATETIME,
  last_login_at DATETIME,
  last_login_ip TEXT,
  password_changed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  CHECK (status IN ('pending', 'active', 'disabled', 'locked', 'deleted'))
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'refresh',
  revoked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments (article_id, created_at DESC);

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
-- 2. Storage and uploaded files
-- =========================================================

CREATE TABLE IF NOT EXISTS storage_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT '',
  endpoint TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'us-east-1',
  base_url TEXT,
  root_prefix TEXT NOT NULL DEFAULT '',
  public_read BOOLEAN NOT NULL DEFAULT true,
  force_path_style BOOLEAN NOT NULL DEFAULT false,
  access_key_id TEXT NOT NULL,
  secret_access_key TEXT NOT NULL,
  auth_mode TEXT NOT NULL DEFAULT '',
  tenant_id TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  client_secret TEXT NOT NULL DEFAULT '',
  drive_id TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  oauth_state TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (type IN ('aws_s3', 'cloudflare_r2', 's3_compatible', 'aliyun_oss', 'tencent_cos', 'qiniu', 'onedrive')),
  CHECK (status IN ('active', 'disabled', 'deleted'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_storage_policies_default
  ON storage_policies (is_default) WHERE is_default = true;

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_policy_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  object_key TEXT NOT NULL,
  uri TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (storage_policy_id, object_key)
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

-- =========================================================
-- 4. Projects (独立 SaaS / 产品介绍站)
-- =========================================================

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE,
  owner_id INTEGER,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  repo_url TEXT,
  demo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  tech_stack TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  CHECK (status IN ('draft', 'published', 'archived')),
  CHECK (view_count >= 0)
);

CREATE TABLE IF NOT EXISTS project_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL,
  entry_path TEXT NOT NULL DEFAULT 'index.html',
  storage_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, version),
  CHECK (source_type IN ('html', 'zip'))
);

-- =========================================================
-- 5. Observatory notes (实验观测台碎片笔记)
-- =========================================================

CREATE TABLE IF NOT EXISTS observatory_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  note_type TEXT NOT NULL DEFAULT 'fragment',
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  CHECK (note_type IN ('fragment', 'failure', 'idea', 'tool_idea', 'tech_debt')),
  CHECK (status IN ('active', 'resolved', 'abandoned'))
);
