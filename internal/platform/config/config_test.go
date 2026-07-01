package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadReadsDefaultFile(t *testing.T) {
	cfg, err := Load(filepath.Join("..", "..", "..", "default_files", "conf.ini"))
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	if cfg.Server.Name != "CrescentLab" {
		t.Fatalf("Server.Name = %q", cfg.Server.Name)
	}
	if cfg.Server.Address() != "0.0.0.0:8091" {
		t.Fatalf("Server.Address() = %q", cfg.Server.Address())
	}
	if cfg.Frontend.DevURL != "http://localhost:3000" {
		t.Fatalf("Frontend.DevURL = %q", cfg.Frontend.DevURL)
	}
	if cfg.Database.Driver != "sqlite" {
		t.Fatalf("Database.Driver = %q", cfg.Database.Driver)
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "conf.ini")
	body := []byte("[server]\nname = \"CrescentLab\"\nhost = \"127.0.0.1\"\nport = 70000\n\n[database]\ndriver = \"sqlite\"\ndsn = \"data/crescentlab.db\"\n")
	if err := os.WriteFile(path, body, 0o600); err != nil {
		t.Fatalf("write config: %v", err)
	}

	if _, err := Load(path); err == nil {
		t.Fatal("Load returned nil error")
	}
}
