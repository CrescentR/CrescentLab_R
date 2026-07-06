package settings

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

type Setting struct {
	ID          int64
	Scope       string
	GroupKey    string
	Key         string
	Value       json.RawMessage
	ValueType   string
	IsPublic    bool
	IsEncrypted bool
	Description sql.NullString
}

type Repository struct {
	db     *sql.DB
	driver string
}

type ListFilter struct {
	Scope    string
	GroupKey string
}

func NewRepository(db *sql.DB, drivers ...string) *Repository {
	driver := "sqlite"
	if len(drivers) > 0 {
		driver = drivers[0]
	}

	return &Repository{db: db, driver: driver}
}

func (r *Repository) Get(ctx context.Context, scope string, key string) (Setting, error) {
	if r == nil || r.db == nil {
		return Setting{}, errors.New("settings repository database is nil")
	}

	query := `
SELECT id, scope, group_key, key, value, value_type, is_public, is_encrypted, description
FROM settings
WHERE scope = ? AND key = ?
`
	if r.driver == "postgres" {
		query = `
SELECT id, scope, group_key, key, value, value_type, is_public, is_encrypted, description
FROM settings
WHERE scope = $1 AND key = $2
`
	}

	row := r.db.QueryRowContext(ctx, query, scope, key)

	setting, err := scanSetting(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Setting{}, err
		}
		return Setting{}, fmt.Errorf("get setting: %w", err)
	}

	return setting, nil
}

func (r *Repository) ListPublic(ctx context.Context) ([]Setting, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("settings repository database is nil")
	}

	rows, err := r.db.QueryContext(ctx, `
SELECT id, scope, group_key, key, value, value_type, is_public, is_encrypted, description
FROM settings
WHERE is_public = true
ORDER BY group_key ASC, key ASC
`)
	if err != nil {
		return nil, fmt.Errorf("list public settings: %w", err)
	}
	defer rows.Close()

	settings := make([]Setting, 0)
	for rows.Next() {
		setting, err := scanSetting(rows)
		if err != nil {
			return nil, fmt.Errorf("scan public setting: %w", err)
		}
		settings = append(settings, setting)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate public settings: %w", err)
	}

	return settings, nil
}

func (r *Repository) List(ctx context.Context, filter ListFilter) ([]Setting, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("settings repository database is nil")
	}

	query := `
SELECT id, scope, group_key, key, value, value_type, is_public, is_encrypted, description
FROM settings
WHERE (? = '' OR scope = ?) AND (? = '' OR group_key = ?)
ORDER BY group_key ASC, key ASC
`
	if r.driver == "postgres" {
		query = `
SELECT id, scope, group_key, key, value, value_type, is_public, is_encrypted, description
FROM settings
WHERE ($1 = '' OR scope = $2) AND ($3 = '' OR group_key = $4)
ORDER BY group_key ASC, key ASC
`
	}

	rows, err := r.db.QueryContext(ctx, query, filter.Scope, filter.Scope, filter.GroupKey, filter.GroupKey)
	if err != nil {
		return nil, fmt.Errorf("list settings: %w", err)
	}
	defer rows.Close()

	settings := make([]Setting, 0)
	for rows.Next() {
		setting, err := scanSetting(rows)
		if err != nil {
			return nil, fmt.Errorf("scan setting: %w", err)
		}
		settings = append(settings, setting)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate settings: %w", err)
	}

	return settings, nil
}

func (r *Repository) Upsert(ctx context.Context, setting Setting) (Setting, error) {
	if r == nil || r.db == nil {
		return Setting{}, errors.New("settings repository database is nil")
	}
	if err := setting.Validate(); err != nil {
		return Setting{}, err
	}

	if err := execUpsertSetting(ctx, r.db, r.driver, setting); err != nil {
		return Setting{}, fmt.Errorf("upsert setting: %w", err)
	}

	return r.Get(ctx, setting.Scope, setting.Key)
}

func (r *Repository) UpsertMany(ctx context.Context, settings []Setting) ([]Setting, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("settings repository database is nil")
	}
	if len(settings) == 0 {
		return nil, errors.New("settings is required")
	}
	for _, setting := range settings {
		if err := setting.Validate(); err != nil {
			return nil, err
		}
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin settings transaction: %w", err)
	}
	defer tx.Rollback()

	for _, setting := range settings {
		if err := execUpsertSetting(ctx, tx, r.driver, setting); err != nil {
			return nil, fmt.Errorf("upsert setting: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit settings transaction: %w", err)
	}

	updated := make([]Setting, 0, len(settings))
	for _, setting := range settings {
		got, err := r.Get(ctx, setting.Scope, setting.Key)
		if err != nil {
			return nil, fmt.Errorf("get updated setting: %w", err)
		}
		updated = append(updated, got)
	}

	return updated, nil
}

type settingExecer interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

func execUpsertSetting(ctx context.Context, execer settingExecer, driver string, setting Setting) error {
	query := `
INSERT INTO settings (scope, group_key, key, value, value_type, is_public, is_encrypted, description)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (scope, key) DO UPDATE SET
  group_key = excluded.group_key,
  value = excluded.value,
  value_type = excluded.value_type,
  is_public = excluded.is_public,
  is_encrypted = excluded.is_encrypted,
  description = excluded.description,
  updated_at = CURRENT_TIMESTAMP
`
	if driver == "postgres" {
		query = `
INSERT INTO settings (scope, group_key, key, value, value_type, is_public, is_encrypted, description)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (scope, key) DO UPDATE SET
  group_key = excluded.group_key,
  value = excluded.value,
  value_type = excluded.value_type,
  is_public = excluded.is_public,
  is_encrypted = excluded.is_encrypted,
  description = excluded.description,
  updated_at = CURRENT_TIMESTAMP
`
	}

	_, err := execer.ExecContext(ctx, query, setting.Scope, setting.GroupKey, setting.Key, string(setting.Value), setting.ValueType, setting.IsPublic, setting.IsEncrypted, setting.Description)
	return err
}

func (s Setting) Validate() error {
	if s.Scope == "" {
		return errors.New("settings.scope is required")
	}
	if s.GroupKey == "" {
		return errors.New("settings.group_key is required")
	}
	if s.Key == "" {
		return errors.New("settings.key is required")
	}
	if len(s.Value) == 0 {
		return errors.New("settings.value is required")
	}
	if !json.Valid(s.Value) {
		return errors.New("settings.value must be valid JSON")
	}
	switch s.ValueType {
	case "string", "number", "boolean", "json", "array", "secret":
		return nil
	default:
		return fmt.Errorf("settings.value_type %q is not allowed", s.ValueType)
	}
}

type settingScanner interface {
	Scan(dest ...any) error
}

func scanSetting(scanner settingScanner) (Setting, error) {
	var setting Setting
	var value []byte

	if err := scanner.Scan(
		&setting.ID,
		&setting.Scope,
		&setting.GroupKey,
		&setting.Key,
		&value,
		&setting.ValueType,
		&setting.IsPublic,
		&setting.IsEncrypted,
		&setting.Description,
	); err != nil {
		return Setting{}, err
	}

	setting.Value = append(setting.Value[:0], value...)
	return setting, nil
}
