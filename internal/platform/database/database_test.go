package database

import (
	"context"
	"path/filepath"
	"testing"

	"CrescentLab_R/internal/platform/config"
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
