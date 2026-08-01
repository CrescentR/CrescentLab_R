package storage

import (
	"context"
	"fmt"
)

func (r *Repository) EnsureSchema(ctx context.Context) error {
	if r.driver == "postgres" {
		_, err := r.db.ExecContext(ctx, `
ALTER TABLE storage_policies ADD COLUMN IF NOT EXISTS force_path_style BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE storage_policies ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE storage_policies DROP CONSTRAINT IF EXISTS storage_policies_type_check;
ALTER TABLE storage_policies ADD CONSTRAINT storage_policies_type_check
  CHECK (type IN ('local', 'onedrive', 'aliyun_oss', 'aws_s3', 'cloudflare_r2', 's3_compatible', 'tencent_cos', 'qiniu', 'custom'));
CREATE UNIQUE INDEX IF NOT EXISTS ux_storage_policies_default
  ON storage_policies (is_default) WHERE is_default = true AND deleted_at IS NULL;`)
		if err != nil {
			return fmt.Errorf("ensure postgres storage schema: %w", err)
		}
		return nil
	}
	if r.driver != "sqlite" {
		return fmt.Errorf("unsupported storage database driver %q", r.driver)
	}
	_, err := r.db.ExecContext(ctx, `
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
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_storage_policies_default ON storage_policies (is_default) WHERE is_default = true;
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
);`)
	if err != nil {
		return fmt.Errorf("ensure storage schema: %w", err)
	}
	return nil
}
