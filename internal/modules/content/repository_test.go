package content

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"testing"

	"CrescentLab_R/internal/platform/config"
	platformdb "CrescentLab_R/internal/platform/database"
)

func TestRepositoryListPublishedOnly(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	seedArticle(t, db, "draft-one", "Draft One", "draft")
	seedArticle(t, db, "published-one", "Published One", "published")
	seedArticle(t, db, "published-two", "Published Two", "published")

	result, err := repo.List(context.Background(), ListFilter{Status: StatusPublished})
	if err != nil {
		t.Fatalf("List returned error: %v", err)
	}
	if result.Total != 2 {
		t.Fatalf("Total = %d, want 2", result.Total)
	}
	if len(result.Items) != 2 {
		t.Fatalf("Items count = %d, want 2", len(result.Items))
	}
}

func TestRepositoryListWithSearch(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	seedArticle(t, db, "go-basics", "Go Basics Tutorial", "published")
	seedArticle(t, db, "rust-intro", "Rust Introduction", "published")

	result, err := repo.List(context.Background(), ListFilter{Status: StatusPublished, Search: "Go"})
	if err != nil {
		t.Fatalf("List returned error: %v", err)
	}
	if result.Total != 1 {
		t.Fatalf("Total = %d, want 1", result.Total)
	}
	if result.Items[0].Title != "Go Basics Tutorial" {
		t.Fatalf("Title = %q", result.Items[0].Title)
	}
}

func TestRepositoryListPagination(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	for i := 0; i < 5; i++ {
		seedArticle(t, db, "slug-"+string(rune('a'+i)), "Article "+string(rune('A'+i)), "published")
	}

	result, err := repo.List(context.Background(), ListFilter{Status: StatusPublished, Page: 1, PageSize: 2})
	if err != nil {
		t.Fatalf("List page 1 error: %v", err)
	}
	if len(result.Items) != 2 {
		t.Fatalf("Page 1 items = %d, want 2", len(result.Items))
	}
	if result.Total != 5 {
		t.Fatalf("Total = %d, want 5", result.Total)
	}
	if result.TotalPages != 3 {
		t.Fatalf("TotalPages = %d, want 3", result.TotalPages)
	}

	result2, err := repo.List(context.Background(), ListFilter{Status: StatusPublished, Page: 3, PageSize: 2})
	if err != nil {
		t.Fatalf("List page 3 error: %v", err)
	}
	if len(result2.Items) != 1 {
		t.Fatalf("Page 3 items = %d, want 1", len(result2.Items))
	}
}

func TestRepositoryListExcludesDeleted(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	seedArticle(t, db, "active-one", "Active Article", "published")
	seedDeletedArticle(t, db, "deleted-one", "Deleted Article", "published")

	result, err := repo.List(context.Background(), ListFilter{Status: StatusPublished})
	if err != nil {
		t.Fatalf("List error: %v", err)
	}
	if result.Total != 1 {
		t.Fatalf("Total = %d, want 1 (deleted excluded)", result.Total)
	}
}

func TestRepositoryGetBySlug(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	seedArticle(t, db, "my-post", "My Post", "published")
	seedArticle(t, db, "deleted-post", "Deleted Post", "published")

	article, err := repo.GetBySlug(context.Background(), "my-post")
	if err != nil {
		t.Fatalf("GetBySlug error: %v", err)
	}
	if article.Title != "My Post" {
		t.Fatalf("Title = %q, want %q", article.Title, "My Post")
	}
	if article.Status != StatusPublished {
		t.Fatalf("Status = %q, want %q", article.Status, StatusPublished)
	}
}

func TestRepositoryGetBySlugNotFound(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	_, err := repo.GetBySlug(context.Background(), "nonexistent")
	if err == nil {
		t.Fatal("expected error for nonexistent slug, got nil")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

func TestRepositoryGetBySlugExcludesDeleted(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	seedDeletedArticle(t, db, "deleted-one", "Deleted Article", "published")

	_, err := repo.GetBySlug(context.Background(), "deleted-one")
	if err == nil {
		t.Fatal("expected error for deleted slug, got nil")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

func TestRepositoryCreateDefaults(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	article, err := repo.Create(context.Background(), CreateInput{
		Title:     "New Post",
		Slug:      "new-post",
		ContentMD: "# Hello",
	})
	if err != nil {
		t.Fatalf("Create error: %v", err)
	}
	if article.Title != "New Post" {
		t.Fatalf("Title = %q, want %q", article.Title, "New Post")
	}
	if article.Status != StatusDraft {
		t.Fatalf("Status = %q, want %q (default draft)", article.Status, StatusDraft)
	}
	if article.SourceFormat != "markdown" {
		t.Fatalf("SourceFormat = %q, want markdown", article.SourceFormat)
	}
}

func TestRepositoryCreatePublishedSetsPublishedAt(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	article, err := repo.Create(context.Background(), CreateInput{
		Title:   "Published Post",
		Slug:    "published-post",
		Status:  string(StatusPublished),
	})
	if err != nil {
		t.Fatalf("Create error: %v", err)
	}
	if article.Status != StatusPublished {
		t.Fatalf("Status = %q, want %q", article.Status, StatusPublished)
	}
	if !article.PublishedAt.Valid {
		t.Fatal("PublishedAt should be valid for published article")
	}
}

func TestRepositoryCreateValidationFails(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	tests := []struct {
		name  string
		input CreateInput
	}{
		{"empty title", CreateInput{Slug: "test"}},
		{"empty slug", CreateInput{Title: "Test"}},
		{"invalid status", CreateInput{Title: "Test", Slug: "test", Status: "invalid"}},
		{"invalid source_format", CreateInput{Title: "Test", Slug: "test", SourceFormat: "invalid"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := repo.Create(context.Background(), tt.input)
			if err == nil {
				t.Fatalf("expected validation error for %s, got nil", tt.name)
			}
		})
	}
}

func TestRepositoryCreateDuplicateSlug(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	seedArticle(t, db, "duplicate-slug", "First", "published")

	_, err := repo.Create(context.Background(), CreateInput{
		Title: "Second",
		Slug:  "duplicate-slug",
	})
	if err == nil {
		t.Fatal("expected error for duplicate slug, got nil")
	}
}

func seedArticle(t *testing.T, db *sql.DB, slug, title, status string) {
	t.Helper()
	_, err := db.ExecContext(context.Background(),
		"INSERT INTO articles (slug, title, status, content_md, content_html) VALUES (?, ?, ?, '', '')",
		slug, title, status)
	if err != nil {
		t.Fatalf("seed article %q: %v", slug, err)
	}
}

func seedDeletedArticle(t *testing.T, db *sql.DB, slug, title, status string) {
	t.Helper()
	_, err := db.ExecContext(context.Background(),
		"INSERT INTO articles (slug, title, status, content_md, content_html, deleted_at) VALUES (?, ?, ?, '', '', CURRENT_TIMESTAMP)",
		slug, title, status)
	if err != nil {
		t.Fatalf("seed deleted article %q: %v", slug, err)
	}
}

func openContentTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := platformdb.Open(context.Background(), config.DatabaseConfig{
		Driver: "sqlite",
		DSN:    filepath.Join(t.TempDir(), "content.db"),
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
CREATE TABLE post_categories (
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

CREATE TABLE articles (
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
`)
	if err != nil {
		t.Fatalf("create tables: %v", err)
	}

	return sqlDB
}
