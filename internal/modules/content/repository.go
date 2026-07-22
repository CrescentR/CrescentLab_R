package content

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/lib/pq"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

var ErrSlugConflict = errors.New("article slug already exists")

type Repository struct {
	db     *sql.DB
	driver string
}

func NewRepository(db *sql.DB, drivers ...string) *Repository {
	driver := "sqlite"
	if len(drivers) > 0 {
		driver = drivers[0]
	}
	return &Repository{db: db, driver: driver}
}

func (r *Repository) List(ctx context.Context, filter ListFilter) (ListResult, error) {
	if r == nil || r.db == nil {
		return ListResult{}, errors.New("content repository database is nil")
	}

	page := filter.normalizedPage()
	pageSize := filter.normalizedPageSize()
	countQuery, countArgs, listQuery, listArgs := buildArticleListQueries(r.driver, filter, page, pageSize)

	// count
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return ListResult{}, fmt.Errorf("count articles: %w", err)
	}

	// list
	rows, err := r.db.QueryContext(ctx, listQuery, listArgs...)
	if err != nil {
		return ListResult{}, fmt.Errorf("list articles: %w", err)
	}
	defer rows.Close()

	items := make([]ArticleListItem, 0)
	for rows.Next() {
		item, err := scanArticleListItem(rows)
		if err != nil {
			return ListResult{}, fmt.Errorf("scan article: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return ListResult{}, fmt.Errorf("iterate articles: %w", err)
	}

	totalPages := 0
	if pageSize > 0 {
		totalPages = int((total + int64(pageSize) - 1) / int64(pageSize))
	}

	return ListResult{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func buildArticleListQueries(driver string, filter ListFilter, page, pageSize int) (string, []any, string, []any) {
	where := []string{"a.deleted_at IS NULL"}
	args := []any{}

	if filter.Status != "" {
		where = append(where, "a.status = ?")
		args = append(args, string(filter.Status))
	}
	if strings.TrimSpace(filter.Category) != "" {
		where = append(where, "c.slug = ?")
		args = append(args, filter.Category)
	}
	if strings.TrimSpace(filter.Search) != "" {
		where = append(where, "(a.title LIKE ? OR a.excerpt LIKE ?)")
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern)
	}

	joinClause := "LEFT JOIN post_categories c ON a.category_id = c.id"
	whereClause := strings.Join(where, " AND ")
	countQuery := "SELECT COUNT(*) FROM articles a " + joinClause + " WHERE " + whereClause
	listQuery := "SELECT a.id, a.public_id, a.title, a.slug, a.excerpt, a.cover_url, a.status, a.is_pinned, a.view_count, a.comment_count, a.reading_time_minutes, a.published_at, a.created_at, a.updated_at FROM articles a " + joinClause + " WHERE " + whereClause + " ORDER BY a.is_pinned DESC, a.pin_sort DESC, COALESCE(a.published_at, a.created_at) DESC LIMIT ? OFFSET ?"

	if driver == "postgres" {
		countQuery = convertPlaceholders(countQuery)
		listQuery = convertPlaceholders(listQuery)
	}
	listArgs := append(append([]any{}, args...), pageSize, (page-1)*pageSize)
	return countQuery, args, listQuery, listArgs
}

func (r *Repository) GetBySlug(ctx context.Context, slug string) (Article, error) {
	if r == nil || r.db == nil {
		return Article{}, errors.New("content repository database is nil")
	}

	query := "SELECT id, public_id, owner_id, category_id, title, slug, excerpt, content_md, content_html, cover_url, status, visibility, source_format, allow_comment, is_pinned, pin_sort, home_sort, view_count, comment_count, word_count, reading_time_minutes, published_at, created_at, updated_at, deleted_at FROM articles WHERE slug = ? AND deleted_at IS NULL"

	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	return scanArticleRow(r.db.QueryRowContext(ctx, query, slug), "get article by slug")
}

func (r *Repository) GetByID(ctx context.Context, id int64) (Article, error) {
	if r == nil || r.db == nil {
		return Article{}, errors.New("content repository database is nil")
	}

	query := "SELECT id, public_id, owner_id, category_id, title, slug, excerpt, content_md, content_html, cover_url, status, visibility, source_format, allow_comment, is_pinned, pin_sort, home_sort, view_count, comment_count, word_count, reading_time_minutes, published_at, created_at, updated_at, deleted_at FROM articles WHERE id = ? AND deleted_at IS NULL"

	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	return scanArticleRow(r.db.QueryRowContext(ctx, query, id), "get article by id")
}

func scanArticleRow(row *sql.Row, op string) (Article, error) {
	var article Article
	var status string
	var publicID sql.NullString
	if err := row.Scan(
		&article.ID, &publicID, &article.OwnerID, &article.CategoryID,
		&article.Title, &article.Slug, &article.Excerpt, &article.ContentMD, &article.ContentHTML,
		&article.CoverURL, &status, &article.Visibility, &article.SourceFormat,
		&article.AllowComment, &article.IsPinned, &article.PinSort, &article.HomeSort,
		&article.ViewCount, &article.CommentCount, &article.WordCount, &article.ReadingTimeMinutes,
		&article.PublishedAt, &article.CreatedAt, &article.UpdatedAt, &article.DeletedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Article{}, err
		}
		return Article{}, fmt.Errorf("%s: %w", op, err)
	}

	article.PublicID = publicID.String
	article.Status = ArticleStatus(status)
	return article, nil
}

func (r *Repository) Create(ctx context.Context, input CreateInput) (Article, error) {
	if r == nil || r.db == nil {
		return Article{}, errors.New("content repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Article{}, err
	}

	status := input.Status
	if status == "" {
		status = string(StatusDraft)
	}
	sourceFormat := input.SourceFormat
	if sourceFormat == "" {
		sourceFormat = "markdown"
	}

	query, returnsID := createArticleQuery(r.driver, ArticleStatus(status))
	args := []any{
		input.Title, input.Slug, input.Excerpt, input.ContentMD, input.ContentHTML,
		input.CoverURL, status, sourceFormat, input.WordCount, input.ReadingTimeMinutes,
	}

	var id int64
	if returnsID {
		if err := r.db.QueryRowContext(ctx, query, args...).Scan(&id); err != nil {
			return Article{}, normalizeArticleWriteError("create article", err)
		}
	} else {
		result, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return Article{}, normalizeArticleWriteError("create article", err)
		}
		id, err = result.LastInsertId()
		if err != nil {
			return Article{}, fmt.Errorf("create article last insert id: %w", err)
		}
	}

	article, err := r.GetByID(ctx, id)
	if err != nil {
		return Article{}, fmt.Errorf("fetch created article: %w", err)
	}

	return article, nil
}

func createArticleQuery(driver string, status ArticleStatus) (string, bool) {
	publishedAtExpr := "NULL"
	if status == StatusPublished {
		publishedAtExpr = "CURRENT_TIMESTAMP"
	}

	query := "INSERT INTO articles (title, slug, excerpt, content_md, content_html, cover_url, status, source_format, word_count, reading_time_minutes, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + publishedAtExpr + ")"
	if driver == "postgres" {
		return convertPlaceholders(query) + " RETURNING id", true
	}
	return query, false
}

func (r *Repository) Update(ctx context.Context, id int64, input CreateInput) (Article, error) {
	if r == nil || r.db == nil {
		return Article{}, errors.New("content repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Article{}, err
	}

	status := input.Status
	if status == "" {
		status = string(StatusDraft)
	}
	sourceFormat := input.SourceFormat
	if sourceFormat == "" {
		sourceFormat = "markdown"
	}

	query := `UPDATE articles
SET title = ?, slug = ?, excerpt = ?, content_md = ?, cover_url = ?, status = ?, source_format = ?,
	content_html = ?, word_count = ?, reading_time_minutes = ?,
    published_at = CASE
        WHEN ? = 'published' THEN COALESCE(published_at, CURRENT_TIMESTAMP)
        ELSE NULL
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND deleted_at IS NULL`
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query,
		input.Title, input.Slug, input.Excerpt, input.ContentMD,
		input.CoverURL, status, sourceFormat,
		input.ContentHTML, input.WordCount, input.ReadingTimeMinutes,
		status, id)
	if err != nil {
		return Article{}, normalizeArticleWriteError("update article", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return Article{}, fmt.Errorf("update article rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return Article{}, sql.ErrNoRows
	}

	article, err := r.GetByID(ctx, id)
	if err != nil {
		return Article{}, fmt.Errorf("fetch updated article: %w", err)
	}
	return article, nil
}

func normalizeArticleWriteError(operation string, err error) error {
	var postgresError *pq.Error
	if errors.As(err, &postgresError) && postgresError.Code == "23505" {
		return fmt.Errorf("%s: %w", operation, ErrSlugConflict)
	}

	var sqliteError *sqlite.Error
	if errors.As(err, &sqliteError) && sqliteError.Code() == sqlite3.SQLITE_CONSTRAINT_UNIQUE {
		return fmt.Errorf("%s: %w", operation, ErrSlugConflict)
	}

	return fmt.Errorf("%s: %w", operation, err)
}

func (r *Repository) SoftDelete(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return errors.New("content repository database is nil")
	}

	query := "UPDATE articles SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("soft delete article: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("soft delete article rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

type articleScanner interface {
	Scan(dest ...any) error
}

func scanArticleListItem(scanner articleScanner) (ArticleListItem, error) {
	var item ArticleListItem
	var publicID sql.NullString
	var excerpt sql.NullString
	var coverURL sql.NullString
	var publishedAt sql.NullTime

	if err := scanner.Scan(
		&item.ID, &publicID, &item.Title, &item.Slug,
		&excerpt, &coverURL, &item.Status, &item.IsPinned,
		&item.ViewCount, &item.CommentCount, &item.ReadingTimeMinutes,
		&publishedAt, &item.CreatedAt, &item.UpdatedAt,
	); err != nil {
		return ArticleListItem{}, err
	}

	item.PublicID = publicID.String
	item.Excerpt = excerpt.String
	item.CoverURL = coverURL.String
	if publishedAt.Valid {
		t := publishedAt.Time
		item.PublishedAt = &t
	}

	return item, nil
}

func convertPlaceholders(query string) string {
	idx := 0
	var b strings.Builder
	for i := 0; i < len(query); i++ {
		if query[i] == '?' {
			idx++
			b.WriteString(fmt.Sprintf("$%d", idx))
		} else {
			b.WriteByte(query[i])
		}
	}
	return b.String()
}
