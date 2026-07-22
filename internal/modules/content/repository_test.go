package content

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"reflect"
	"strings"
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

func TestBuildArticleListQueriesPostgresSearchUsesContinuousPlaceholders(t *testing.T) {
	countQuery, countArgs, listQuery, listArgs := buildArticleListQueries("postgres", ListFilter{Search: "post"}, 2, 5)

	wantCountQuery := "SELECT COUNT(*) FROM articles a LEFT JOIN post_categories c ON a.category_id = c.id WHERE a.deleted_at IS NULL AND (a.title LIKE $1 OR a.excerpt LIKE $2)"
	if countQuery != wantCountQuery {
		t.Fatalf("count query = %q, want %q", countQuery, wantCountQuery)
	}
	wantCountArgs := []any{"%post%", "%post%"}
	if !reflect.DeepEqual(countArgs, wantCountArgs) {
		t.Fatalf("count args = %#v, want %#v", countArgs, wantCountArgs)
	}

	wantListQuery := "SELECT a.id, a.public_id, a.title, a.slug, a.excerpt, a.cover_url, a.status, a.is_pinned, a.view_count, a.comment_count, a.reading_time_minutes, a.published_at, a.created_at, a.updated_at FROM articles a LEFT JOIN post_categories c ON a.category_id = c.id WHERE a.deleted_at IS NULL AND (a.title LIKE $1 OR a.excerpt LIKE $2) ORDER BY a.is_pinned DESC, a.pin_sort DESC, COALESCE(a.published_at, a.created_at) DESC LIMIT $3 OFFSET $4"
	if listQuery != wantListQuery {
		t.Fatalf("list query = %q, want %q", listQuery, wantListQuery)
	}
	wantListArgs := []any{"%post%", "%post%", 5, 5}
	if !reflect.DeepEqual(listArgs, wantListArgs) {
		t.Fatalf("list args = %#v, want %#v", listArgs, wantListArgs)
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
		Title:  "Published Post",
		Slug:   "published-post",
		Status: string(StatusPublished),
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
		{"title too long", CreateInput{Title: strings.Repeat("字", 201), Slug: "test"}},
		{"invalid slug", CreateInput{Title: "Test", Slug: "Invalid Slug"}},
		{"excerpt too long", CreateInput{Title: "Test", Slug: "test", Excerpt: strings.Repeat("字", 501)}},
		{"invalid cover URL", CreateInput{Title: "Test", Slug: "test", CoverURL: "not-a-url"}},
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
	if !errors.Is(err, ErrSlugConflict) {
		t.Fatalf("error = %v, want ErrSlugConflict", err)
	}
}

func TestCreateArticleQueryUsesPostgresReturningID(t *testing.T) {
	query, returnsID := createArticleQuery("postgres", StatusPublished)
	if !returnsID {
		t.Fatal("PostgreSQL create query should return the inserted id")
	}
	want := "INSERT INTO articles (title, slug, excerpt, content_md, content_html, cover_url, status, source_format, word_count, reading_time_minutes, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP) RETURNING id"
	if query != want {
		t.Fatalf("PostgreSQL create query = %q, want %q", query, want)
	}
}

func TestCreateArticleQueryKeepsSQLiteLastInsertIDPath(t *testing.T) {
	query, returnsID := createArticleQuery("sqlite", StatusDraft)
	if returnsID {
		t.Fatal("SQLite create query should use LastInsertId")
	}
	want := "INSERT INTO articles (title, slug, excerpt, content_md, content_html, cover_url, status, source_format, word_count, reading_time_minutes, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)"
	if query != want {
		t.Fatalf("SQLite create query = %q, want %q", query, want)
	}
}

func TestRepositoryUpdateReplacesArticle(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedArticle(t, db, "old-slug", "Old Title", "draft")

	article, err := repo.Update(context.Background(), 1, CreateInput{
		Title:        "Updated Title",
		Slug:         "updated-slug",
		Excerpt:      "Updated excerpt",
		ContentMD:    "# Updated",
		CoverURL:     "/updated.webp",
		Status:       string(StatusPublished),
		SourceFormat: "markdown",
	})
	if err != nil {
		t.Fatalf("Update error: %v", err)
	}
	if article.Title != "Updated Title" || article.Slug != "updated-slug" {
		t.Fatalf("updated article = %#v", article)
	}
	if article.Excerpt.String != "Updated excerpt" || article.ContentMD != "# Updated" || article.CoverURL.String != "/updated.webp" {
		t.Fatalf("updated content = %#v", article)
	}
	if article.Status != StatusPublished || !article.PublishedAt.Valid {
		t.Fatalf("status = %q, published_at = %#v", article.Status, article.PublishedAt)
	}
}

func TestRepositoryUpdateMaintainsPublishedAtForStatusChanges(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedArticle(t, db, "post", "Post", "draft")

	published, err := repo.Update(context.Background(), 1, CreateInput{
		Title: "Post", Slug: "post", Status: string(StatusPublished),
	})
	if err != nil {
		t.Fatalf("publish article: %v", err)
	}
	if !published.PublishedAt.Valid {
		t.Fatal("PublishedAt should be set when status changes to published")
	}

	stillPublished, err := repo.Update(context.Background(), 1, CreateInput{
		Title: "Post Updated", Slug: "post", Status: string(StatusPublished),
	})
	if err != nil {
		t.Fatalf("update published article: %v", err)
	}
	if !stillPublished.PublishedAt.Valid || !stillPublished.PublishedAt.Time.Equal(published.PublishedAt.Time) {
		t.Fatalf("PublishedAt = %v, want original %v", stillPublished.PublishedAt, published.PublishedAt)
	}

	draft, err := repo.Update(context.Background(), 1, CreateInput{
		Title: "Post Updated", Slug: "post", Status: string(StatusDraft),
	})
	if err != nil {
		t.Fatalf("unpublish article: %v", err)
	}
	if draft.PublishedAt.Valid {
		t.Fatalf("PublishedAt should be cleared outside published status, got %v", draft.PublishedAt.Time)
	}
}

func TestRepositoryUpdateRejectsInvalidInput(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedArticle(t, db, "post", "Post", "draft")

	_, err := repo.Update(context.Background(), 1, CreateInput{Slug: "post"})
	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
}

func TestRepositoryPersistsRenderedContentMetadata(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)

	article, err := repo.Create(context.Background(), CreateInput{
		Title:              "Rendered",
		Slug:               "rendered",
		ContentMD:          "# Hello",
		ContentHTML:        "<h1>Hello</h1>",
		WordCount:          1,
		ReadingTimeMinutes: 1,
	})
	if err != nil {
		t.Fatalf("Create error: %v", err)
	}
	if article.ContentHTML != "<h1>Hello</h1>" || article.WordCount != 1 || article.ReadingTimeMinutes != 1 {
		t.Fatalf("rendered fields = %#v", article)
	}
}

func TestRepositoryUpdateDuplicateSlug(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedArticle(t, db, "first", "First", "draft")
	seedArticle(t, db, "second", "Second", "draft")

	_, err := repo.Update(context.Background(), 2, CreateInput{Title: "Second", Slug: "first"})
	if !errors.Is(err, ErrSlugConflict) {
		t.Fatalf("Update error = %v, want ErrSlugConflict", err)
	}
}

func TestRepositoryUpdateNotFound(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedDeletedArticle(t, db, "deleted", "Deleted", "draft")

	for _, id := range []int64{1, 999} {
		_, err := repo.Update(context.Background(), id, CreateInput{Title: "Updated", Slug: "updated"})
		if !errors.Is(err, sql.ErrNoRows) {
			t.Fatalf("Update id %d error = %v, want sql.ErrNoRows", id, err)
		}
	}
}

func TestRepositorySoftDelete(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedArticle(t, db, "post", "Post", "published")

	if err := repo.SoftDelete(context.Background(), 1); err != nil {
		t.Fatalf("SoftDelete error: %v", err)
	}

	var deletedAt sql.NullTime
	if err := db.QueryRow("SELECT deleted_at FROM articles WHERE id = 1").Scan(&deletedAt); err != nil {
		t.Fatalf("query deleted article: %v", err)
	}
	if !deletedAt.Valid {
		t.Fatal("deleted_at should be set")
	}
	if _, err := repo.GetByID(context.Background(), 1); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("GetByID after delete error = %v, want sql.ErrNoRows", err)
	}
}

func TestRepositorySoftDeleteNotFound(t *testing.T) {
	db := openContentTestDB(t)
	repo := NewRepository(db)
	seedDeletedArticle(t, db, "deleted", "Deleted", "draft")

	for _, id := range []int64{1, 999} {
		if err := repo.SoftDelete(context.Background(), id); !errors.Is(err, sql.ErrNoRows) {
			t.Fatalf("SoftDelete id %d error = %v, want sql.ErrNoRows", id, err)
		}
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
