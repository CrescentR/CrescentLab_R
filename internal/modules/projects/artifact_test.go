package projects

import (
	"archive/zip"
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

func TestExtractArtifactZIP(t *testing.T) {
	source := filepath.Join(t.TempDir(), "site.zip")
	file, err := os.Create(source)
	if err != nil {
		t.Fatal(err)
	}
	writer := zip.NewWriter(file)
	entry, err := writer.Create("index.html")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := entry.Write([]byte("<h1>demo</h1>")); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}

	target := t.TempDir()
	if err := extractArtifactZIP(source, target); err != nil {
		t.Fatalf("extract valid artifact: %v", err)
	}
	if _, err := os.Stat(filepath.Join(target, "index.html")); err != nil {
		t.Fatalf("expected index.html: %v", err)
	}
}

func TestExtractArtifactZIPRejectsTraversal(t *testing.T) {
	source := filepath.Join(t.TempDir(), "unsafe.zip")
	file, err := os.Create(source)
	if err != nil {
		t.Fatal(err)
	}
	writer := zip.NewWriter(file)
	if _, err := writer.Create("../outside.html"); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}

	if err := extractArtifactZIP(source, t.TempDir()); err == nil {
		t.Fatal("expected traversal ZIP to be rejected")
	}
}

func TestArtifactVersionsPublishAndRollback(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if _, err := db.Exec(`CREATE TABLE projects (
  phase TEXT NOT NULL DEFAULT '' CHECK (phase IN ('', 'research', 'building', 'live', 'waning')),
  goal TEXT NOT NULL DEFAULT '',
  boundary TEXT NOT NULL DEFAULT '',
  current_work TEXT NOT NULL DEFAULT '',
  progress_percent INTEGER CHECK (progress_percent BETWEEN 0 AND 100),
  closure_kind TEXT NOT NULL DEFAULT '' CHECK (closure_kind IN ('', 'archived', 'abandoned')),
  closure_reason TEXT NOT NULL DEFAULT '',
		id INTEGER PRIMARY KEY, public_id TEXT, owner_id INTEGER, name TEXT NOT NULL, slug TEXT NOT NULL,
		tagline TEXT, description TEXT NOT NULL DEFAULT '', content_md TEXT NOT NULL DEFAULT '', content_html TEXT NOT NULL DEFAULT '', source_format TEXT NOT NULL DEFAULT 'markdown',
		cover_url TEXT, repo_url TEXT, demo_url TEXT, status TEXT NOT NULL DEFAULT 'draft',
		tech_stack TEXT NOT NULL DEFAULT '[]', sort_order INTEGER NOT NULL DEFAULT 0,
		view_count INTEGER NOT NULL DEFAULT 0, published_at DATETIME, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at DATETIME
	)`); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec("INSERT INTO projects (id, name, slug) VALUES (1, 'Demo', 'demo')"); err != nil {
		t.Fatal(err)
	}

	repository := NewRepository(db, "sqlite")
	if err := repository.EnsureArtifactSchema(context.Background()); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	first, err := repository.CreateArtifact(context.Background(), 1, "first", "index.html", strings.NewReader("<h1>first</h1>"), root)
	if err != nil {
		t.Fatal(err)
	}
	second, err := repository.CreateArtifact(context.Background(), 1, "second", "index.html", strings.NewReader("<h1>second</h1>"), root)
	if err != nil {
		t.Fatal(err)
	}
	if first.Version != 1 || second.Version != 2 {
		t.Fatalf("versions = %d, %d; want 1, 2", first.Version, second.Version)
	}
	if _, err := repository.PublishArtifact(context.Background(), 1, second.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.PublishArtifact(context.Background(), 1, first.ID); err != nil {
		t.Fatal(err)
	}
	path, err := repository.PublishedArtifactFile(context.Background(), "demo", "index.html")
	if err != nil {
		t.Fatal(err)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "<h1>first</h1>" {
		t.Fatalf("published content = %q, want first version", content)
	}
}
