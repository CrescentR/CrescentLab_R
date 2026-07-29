package database

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
	"time"

	"CrescentLab_R/internal/platform/config"

	"github.com/lib/pq"
)

func TestOpenSQLite(t *testing.T) {
	db, err := Open(context.Background(), config.DatabaseConfig{
		Driver: "sqlite",
		DSN:    filepath.Join(t.TempDir(), "crescentlab.db"),
	})
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			t.Fatalf("Close returned error: %v", err)
		}
	}()

	if db.Driver() != "sqlite" {
		t.Fatalf("Driver = %q", db.Driver())
	}
	if err := db.Ping(context.Background()); err != nil {
		t.Fatalf("Ping returned error: %v", err)
	}
}

func TestOpenRejectsUnsupportedDriver(t *testing.T) {
	_, err := Open(context.Background(), config.DatabaseConfig{
		Driver: "mysql",
		DSN:    "host=localhost dbname=crescentlab",
	})
	if err == nil {
		t.Fatal("Open returned nil error")
	}
}

func TestPingDatabaseRetriesWhilePostgresStarts(t *testing.T) {
	attempts := 0
	err := pingDatabase(context.Background(), "postgres", time.Millisecond, func(context.Context) error {
		attempts++
		if attempts == 1 {
			return &pq.Error{Code: pq.ErrorCode("57P03")}
		}
		return nil
	})

	if err != nil {
		t.Fatalf("pingDatabase returned error: %v", err)
	}
	if attempts != 2 {
		t.Fatalf("attempts = %d, want 2", attempts)
	}
}

func TestPingDatabaseDoesNotRetryOtherErrors(t *testing.T) {
	attempts := 0
	wantErr := &pq.Error{Code: pq.ErrorCode("28P01")}
	err := pingDatabase(context.Background(), "postgres", time.Millisecond, func(context.Context) error {
		attempts++
		return wantErr
	})

	if !errors.Is(err, wantErr) {
		t.Fatalf("pingDatabase error = %v, want %v", err, wantErr)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1", attempts)
	}
}

func TestPingDatabaseStopsWhenContextEnds(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	attempts := 0
	err := pingDatabase(ctx, "postgres", time.Hour, func(context.Context) error {
		attempts++
		cancel()
		return &pq.Error{Code: pq.ErrorCode("57P03")}
	})

	if !errors.Is(err, context.Canceled) {
		t.Fatalf("pingDatabase error = %v, want context canceled", err)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1", attempts)
	}
}
