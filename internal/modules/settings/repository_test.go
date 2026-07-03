package settings

import (
	"context"
	"database/sql"
	"encoding/json"
	"path/filepath"
	"testing"

	"CrescentLab_R/internal/platform/config"
	platformdb "CrescentLab_R/internal/platform/database"
)

func TestRepositoryUpsertAndGet(t *testing.T) {
	sqlDB := openSettingsTestDB(t)
	repo := NewRepository(sqlDB)

	created, err := repo.Upsert(context.Background(), Setting{
		Scope:       "site",
		GroupKey:    "site",
		Key:         "site.title",
		Value:       json.RawMessage(`"CrescentLab"`),
		ValueType:   "string",
		IsPublic:    true,
		Description: sql.NullString{String: "站点标题", Valid: true},
	})
	if err != nil {
		t.Fatalf("Upsert returned error: %v", err)
	}
	if created.ID == 0 {
		t.Fatal("Upsert returned zero ID")
	}
	if string(created.Value) != `"CrescentLab"` {
		t.Fatalf("Value = %s", string(created.Value))
	}

	updated, err := repo.Upsert(context.Background(), Setting{
		Scope:       "site",
		GroupKey:    "site",
		Key:         "site.title",
		Value:       json.RawMessage(`"CrescentLab Updated"`),
		ValueType:   "string",
		IsPublic:    true,
		Description: sql.NullString{String: "站点标题", Valid: true},
	})
	if err != nil {
		t.Fatalf("second Upsert returned error: %v", err)
	}
	if updated.ID != created.ID {
		t.Fatalf("updated ID = %d, created ID = %d", updated.ID, created.ID)
	}
	if string(updated.Value) != `"CrescentLab Updated"` {
		t.Fatalf("updated Value = %s", string(updated.Value))
	}

	got, err := repo.Get(context.Background(), "site", "site.title")
	if err != nil {
		t.Fatalf("Get returned error: %v", err)
	}
	if got.GroupKey != "site" {
		t.Fatalf("GroupKey = %q", got.GroupKey)
	}
}

func TestRepositoryListPublic(t *testing.T) {
	sqlDB := openSettingsTestDB(t)
	repo := NewRepository(sqlDB)

	_, err := repo.Upsert(context.Background(), Setting{
		Scope:     "site",
		GroupKey:  "site",
		Key:       "site.title",
		Value:     json.RawMessage(`"CrescentLab"`),
		ValueType: "string",
		IsPublic:  true,
	})
	if err != nil {
		t.Fatalf("Upsert public setting: %v", err)
	}
	_, err = repo.Upsert(context.Background(), Setting{
		Scope:     "site",
		GroupKey:  "security",
		Key:       "secret.token",
		Value:     json.RawMessage(`"hidden"`),
		ValueType: "secret",
		IsPublic:  false,
	})
	if err != nil {
		t.Fatalf("Upsert private setting: %v", err)
	}

	settings, err := repo.ListPublic(context.Background())
	if err != nil {
		t.Fatalf("ListPublic returned error: %v", err)
	}
	if len(settings) != 1 {
		t.Fatalf("len(settings) = %d", len(settings))
	}
	if settings[0].Key != "site.title" {
		t.Fatalf("settings[0].Key = %q", settings[0].Key)
	}
}

func TestRepositoryUpsertMany(t *testing.T) {
	sqlDB := openSettingsTestDB(t)
	repo := NewRepository(sqlDB)

	updated, err := repo.UpsertMany(context.Background(), []Setting{
		{
			Scope:     "site",
			GroupKey:  "branding",
			Key:       "siteLogoUrl",
			Value:     json.RawMessage(`"https://example.com/logo.svg"`),
			ValueType: "string",
			IsPublic:  true,
		},
		{
			Scope:     "site",
			GroupKey:  "branding",
			Key:       "adminLogoUrl",
			Value:     json.RawMessage(`"https://example.com/admin.svg"`),
			ValueType: "string",
			IsPublic:  true,
		},
	})
	if err != nil {
		t.Fatalf("UpsertMany returned error: %v", err)
	}
	if len(updated) != 2 {
		t.Fatalf("len(updated) = %d", len(updated))
	}

	listed, err := repo.List(context.Background(), ListFilter{Scope: "site", GroupKey: "branding"})
	if err != nil {
		t.Fatalf("List returned error: %v", err)
	}
	if len(listed) != 2 {
		t.Fatalf("len(listed) = %d", len(listed))
	}
}

func TestSettingValidateRejectsInvalidJSON(t *testing.T) {
	setting := Setting{
		Scope:     "site",
		GroupKey:  "site",
		Key:       "site.title",
		Value:     json.RawMessage(`{`),
		ValueType: "json",
	}

	if err := setting.Validate(); err == nil {
		t.Fatal("Validate returned nil error")
	}
}

func openSettingsTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := platformdb.Open(context.Background(), config.DatabaseConfig{
		Driver: "sqlite",
		DSN:    filepath.Join(t.TempDir(), "settings.db"),
	})
	if err != nil {
		t.Fatalf("Open database: %v", err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Fatalf("Close database: %v", err)
		}
	})

	sqlDB := db.SQL()
	_, err = sqlDB.ExecContext(context.Background(), `
CREATE TABLE settings (
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
)
`)
	if err != nil {
		t.Fatalf("create settings table: %v", err)
	}

	return sqlDB
}
