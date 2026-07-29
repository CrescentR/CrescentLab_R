package users

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"CrescentLab_R/internal/platform/config"
	platformdb "CrescentLab_R/internal/platform/database"
)

func TestRepositoryCreateAndGet(t *testing.T) {
	db := openUsersTestDB(t)
	repository := NewRepository(db)

	created, err := repository.Create(context.Background(), CreateInput{
		Username:     "Alice",
		UsernameKey:  "alice",
		Email:        sql.NullString{String: "Alice@example.com", Valid: true},
		EmailKey:     sql.NullString{String: "alice@example.com", Valid: true},
		PasswordHash: "stored-password-hash",
		Nickname:     "Alice",
	})
	if err != nil {
		t.Fatalf("Create returned error: %v", err)
	}
	if created.Status != StatusPending {
		t.Fatalf("Status = %q, want %q", created.Status, StatusPending)
	}
	if created.PasswordHash != "stored-password-hash" {
		t.Fatalf("PasswordHash = %q, want stored hash", created.PasswordHash)
	}

	byUsername, err := repository.GetByUsernameKey(context.Background(), "alice")
	if err != nil {
		t.Fatalf("GetByUsernameKey returned error: %v", err)
	}
	byEmail, err := repository.GetByEmailKey(context.Background(), "alice@example.com")
	if err != nil {
		t.Fatalf("GetByEmailKey returned error: %v", err)
	}
	byID, err := repository.GetByID(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("GetByID returned error: %v", err)
	}
	if byUsername.ID != created.ID || byEmail.ID != created.ID || byID.ID != created.ID {
		t.Fatalf("queried IDs = %d, %d, %d; want %d", byUsername.ID, byEmail.ID, byID.ID, created.ID)
	}
}

func TestRepositoryCreateEnforcesUsernameAndEmailKeyUniqueness(t *testing.T) {
	db := openUsersTestDB(t)
	repository := NewRepository(db)
	ctx := context.Background()

	_, err := repository.Create(ctx, CreateInput{
		Username: "Alice", UsernameKey: "alice",
		Email:        sql.NullString{String: "alice@example.com", Valid: true},
		EmailKey:     sql.NullString{String: "alice@example.com", Valid: true},
		PasswordHash: "hash-one", Nickname: "Alice",
	})
	if err != nil {
		t.Fatalf("create first user: %v", err)
	}

	_, err = repository.Create(ctx, CreateInput{
		Username: "Another Alice", UsernameKey: "alice",
		Email:        sql.NullString{String: "other@example.com", Valid: true},
		EmailKey:     sql.NullString{String: "other@example.com", Valid: true},
		PasswordHash: "hash-two", Nickname: "Another Alice",
	})
	if err == nil {
		t.Fatal("expected duplicate username_key to fail")
	}

	_, err = repository.Create(ctx, CreateInput{
		Username: "Bob", UsernameKey: "bob",
		Email:        sql.NullString{String: "Alice@example.com", Valid: true},
		EmailKey:     sql.NullString{String: "alice@example.com", Valid: true},
		PasswordHash: "hash-three", Nickname: "Bob",
	})
	if err == nil {
		t.Fatal("expected duplicate email_key to fail")
	}
}

func TestRepositoryQueriesExcludeSoftDeletedUsers(t *testing.T) {
	db := openUsersTestDB(t)
	repository := NewRepository(db)
	ctx := context.Background()

	result, err := db.ExecContext(ctx, `INSERT INTO users
(username, username_key, email, email_key, password_hash, nickname, deleted_at)
VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
		"Deleted", "deleted", "deleted@example.com", "deleted@example.com", "hash", "Deleted")
	if err != nil {
		t.Fatalf("seed deleted user: %v", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		t.Fatalf("deleted user last insert ID: %v", err)
	}

	queries := []struct {
		name string
		get  func() (User, error)
	}{
		{name: "username_key", get: func() (User, error) { return repository.GetByUsernameKey(ctx, "deleted") }},
		{name: "email_key", get: func() (User, error) { return repository.GetByEmailKey(ctx, "deleted@example.com") }},
		{name: "id", get: func() (User, error) { return repository.GetByID(ctx, id) }},
	}
	for _, query := range queries {
		t.Run(query.name, func(t *testing.T) {
			_, err := query.get()
			if !errors.Is(err, sql.ErrNoRows) {
				t.Fatalf("error = %v, want sql.ErrNoRows", err)
			}
		})
	}
	if err := repository.UpdateLastLogin(ctx, id, time.Now(), "192.0.2.1"); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("UpdateLastLogin error = %v, want sql.ErrNoRows", err)
	}
}

func TestRepositoryUpdateLastLogin(t *testing.T) {
	db := openUsersTestDB(t)
	repository := NewRepository(db)
	ctx := context.Background()

	created, err := repository.Create(ctx, CreateInput{
		Username: "Alice", UsernameKey: "alice", PasswordHash: "hash", Nickname: "Alice",
	})
	if err != nil {
		t.Fatalf("Create returned error: %v", err)
	}
	loginAt := time.Date(2026, 7, 11, 1, 2, 3, 0, time.UTC)
	if err := repository.UpdateLastLogin(ctx, created.ID, loginAt, "192.0.2.1"); err != nil {
		t.Fatalf("UpdateLastLogin returned error: %v", err)
	}

	updated, err := repository.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("GetByID returned error: %v", err)
	}
	if !updated.LastLoginAt.Valid || !updated.LastLoginAt.Time.Equal(loginAt) {
		t.Fatalf("LastLoginAt = %v, want %v", updated.LastLoginAt, loginAt)
	}
	if !updated.LastLoginIP.Valid || updated.LastLoginIP.String != "192.0.2.1" {
		t.Fatalf("LastLoginIP = %v, want 192.0.2.1", updated.LastLoginIP)
	}
}

func openUsersTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := platformdb.Open(context.Background(), config.DatabaseConfig{
		Driver: "sqlite",
		DSN:    filepath.Join(t.TempDir(), "users.db"),
	})
	if err != nil {
		t.Fatalf("Open database: %v", err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Fatalf("Close database: %v", err)
		}
	})

	schemaPath := filepath.Join("..", "..", "..", "database", "sqlite", "schema.sql")
	schema, err := os.ReadFile(schemaPath)
	if err != nil {
		t.Fatalf("read SQLite schema: %v", err)
	}
	if _, err := db.SQL().ExecContext(context.Background(), string(schema)); err != nil {
		t.Fatalf("apply SQLite schema: %v", err)
	}
	return db.SQL()
}
