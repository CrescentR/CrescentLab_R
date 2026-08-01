package comments

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"CrescentLab_R/internal/platform/config"
	platformdb "CrescentLab_R/internal/platform/database"
)

func TestCommentModerationFlow(t *testing.T) {
	db := openCommentsTestDB(t)
	ctx := context.Background()
	articleResult, err := db.ExecContext(ctx, `INSERT INTO articles (public_id, title, slug, status, allow_comment) VALUES (?, ?, ?, 'published', true)`, "article-1", "文章", "article-1")
	if err != nil {
		t.Fatalf("seed article: %v", err)
	}
	articleID, _ := articleResult.LastInsertId()
	userResult, err := db.ExecContext(ctx, `INSERT INTO users (username, username_key, password_hash, nickname, status) VALUES (?, ?, ?, ?, 'active')`, "reader", "reader", "hash", "读者")
	if err != nil {
		t.Fatalf("seed user: %v", err)
	}
	userID, _ := userResult.LastInsertId()

	repository := NewRepository(db, "sqlite")
	created, err := repository.Create(ctx, articleID, userID, "读者", "第一条评论", "第一条评论")
	if err != nil {
		t.Fatalf("create comment: %v", err)
	}
	if created.Status != "pending" {
		t.Fatalf("created status = %q, want pending", created.Status)
	}
	approved, err := repository.ListApproved(ctx, articleID)
	if err != nil || len(approved) != 0 {
		t.Fatalf("approved before review = %v, error = %v", approved, err)
	}
	if err := repository.Review(ctx, created.ID, "approved"); err != nil {
		t.Fatalf("approve comment: %v", err)
	}
	approved, err = repository.ListApproved(ctx, articleID)
	if err != nil || len(approved) != 1 {
		t.Fatalf("approved after review count = %d, error = %v", len(approved), err)
	}
	var commentCount int
	if err := db.QueryRowContext(ctx, `SELECT comment_count FROM articles WHERE id = ?`, articleID).Scan(&commentCount); err != nil || commentCount != 1 {
		t.Fatalf("article comment_count = %d, error = %v", commentCount, err)
	}
}

func openCommentsTestDB(t *testing.T) *sql.DB {
	t.Helper()
	database, err := platformdb.Open(context.Background(), config.DatabaseConfig{Driver: "sqlite", DSN: filepath.Join(t.TempDir(), "comments.db")})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	schema, err := os.ReadFile(filepath.Join("..", "..", "..", "database", "sqlite", "schema.sql"))
	if err != nil {
		t.Fatalf("read schema: %v", err)
	}
	if _, err := database.SQL().ExecContext(context.Background(), string(schema)); err != nil {
		t.Fatalf("apply schema: %v", err)
	}
	return database.SQL()
}
