package comments

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

type Repository struct {
	db     *sql.DB
	driver string
}

func NewRepository(db *sql.DB, driver string) *Repository {
	return &Repository{db: db, driver: driver}
}

func (r *Repository) ListApproved(ctx context.Context, articleID int64) ([]Comment, error) {
	return r.list(ctx, articleID, "approved")
}

func (r *Repository) ListPending(ctx context.Context, articleID int64) ([]Comment, error) {
	return r.list(ctx, articleID, "pending")
}

func (r *Repository) list(ctx context.Context, articleID int64, status string) ([]Comment, error) {
	query := `SELECT id, article_id, user_id, nickname, content, content_html, status, created_at
FROM comments WHERE status = ? AND deleted_at IS NULL ORDER BY created_at ASC`
	args := []any{status}
	if articleID > 0 {
		query = `SELECT id, article_id, user_id, nickname, content, content_html, status, created_at
FROM comments WHERE article_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at ASC`
		args = []any{articleID, status}
	}
	if r.driver == "postgres" {
		if articleID > 0 {
			query = `SELECT id, article_id, user_id, nickname, content, content_html, status, created_at
FROM comments WHERE article_id = $1 AND status = $2 AND deleted_at IS NULL ORDER BY created_at ASC`
		} else {
			query = `SELECT id, article_id, user_id, nickname, content, content_html, status, created_at
FROM comments WHERE status = $1 AND deleted_at IS NULL ORDER BY created_at ASC`
		}
	}
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list comments: %w", err)
	}
	defer rows.Close()
	items := make([]Comment, 0)
	for rows.Next() {
		var item Comment
		if err := rows.Scan(&item.ID, &item.ArticleID, &item.UserID, &item.Nickname, &item.Content,
			&item.ContentHTML, &item.Status, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan comment: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Create(ctx context.Context, articleID, userID int64, nickname, content, contentHTML string) (Comment, error) {
	var allowed bool
	query := `SELECT EXISTS (SELECT 1 FROM articles WHERE id = ? AND status = 'published' AND allow_comment = true AND deleted_at IS NULL)`
	if r.driver == "postgres" {
		query = `SELECT EXISTS (SELECT 1 FROM articles WHERE id = $1 AND status = 'published' AND allow_comment = true AND deleted_at IS NULL)`
	}
	if err := r.db.QueryRowContext(ctx, query, articleID).Scan(&allowed); err != nil {
		return Comment{}, fmt.Errorf("check article comments: %w", err)
	}
	if !allowed {
		return Comment{}, sql.ErrNoRows
	}
	insert := `INSERT INTO comments (article_id, user_id, nickname, content, content_html, status)
VALUES (?, ?, ?, ?, ?, 'pending')`
	if r.driver == "postgres" {
		insert = `INSERT INTO comments (article_id, user_id, nickname, content, content_html, status)
VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`
		var id int64
		if err := r.db.QueryRowContext(ctx, insert, articleID, userID, nickname, content, contentHTML).Scan(&id); err != nil {
			return Comment{}, fmt.Errorf("create comment: %w", err)
		}
		return r.get(ctx, id)
	}
	result, err := r.db.ExecContext(ctx, insert, articleID, userID, nickname, content, contentHTML)
	if err != nil {
		return Comment{}, fmt.Errorf("create comment: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return Comment{}, fmt.Errorf("create comment id: %w", err)
	}
	return r.get(ctx, id)
}

func (r *Repository) Review(ctx context.Context, id int64, status string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin comment review: %w", err)
	}
	defer func() { _ = tx.Rollback() }()
	var articleID int64
	selectQuery := `SELECT article_id FROM comments WHERE id = ? AND status = 'pending' AND deleted_at IS NULL`
	if r.driver == "postgres" {
		selectQuery = `SELECT article_id FROM comments WHERE id = $1 AND status = 'pending' AND deleted_at IS NULL`
	}
	if err := tx.QueryRowContext(ctx, selectQuery, id).Scan(&articleID); err != nil {
		return err
	}
	query := `UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending' AND deleted_at IS NULL`
	if r.driver == "postgres" {
		query = `UPDATE comments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'pending' AND deleted_at IS NULL`
	}
	result, err := tx.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("review comment: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("review comment rows: %w", err)
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	if status == "approved" {
		countQuery := `UPDATE articles SET comment_count = comment_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
		if r.driver == "postgres" {
			countQuery = `UPDATE articles SET comment_count = comment_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`
		}
		if _, err := tx.ExecContext(ctx, countQuery, articleID); err != nil {
			return fmt.Errorf("update article comment count: %w", err)
		}
	}
	return tx.Commit()
}

func (r *Repository) get(ctx context.Context, id int64) (Comment, error) {
	if r == nil || r.db == nil {
		return Comment{}, errors.New("comments repository database is nil")
	}
	query := `SELECT id, article_id, user_id, nickname, content, content_html, status, created_at FROM comments WHERE id = ?`
	if r.driver == "postgres" {
		query = `SELECT id, article_id, user_id, nickname, content, content_html, status, created_at FROM comments WHERE id = $1`
	}
	var item Comment
	err := r.db.QueryRowContext(ctx, query, id).Scan(&item.ID, &item.ArticleID, &item.UserID, &item.Nickname,
		&item.Content, &item.ContentHTML, &item.Status, &item.CreatedAt)
	return item, err
}
