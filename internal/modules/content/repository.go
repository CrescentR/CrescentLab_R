package content

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

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
	offset := (page - 1) * pageSize

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

	whereClause := strings.Join(where, " AND ")
	joinClause := "LEFT JOIN post_categories c ON a.category_id = c.id"
	orderBy := "a.is_pinned DESC, a.pin_sort DESC, COALESCE(a.published_at, a.created_at) DESC"

	if r.driver == "postgres" {
		whereClause = convertPlaceholders(whereClause)
	}

	// count
	countQuery := "SELECT COUNT(*) FROM articles a " + joinClause + " WHERE " + whereClause
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return ListResult{}, fmt.Errorf("count articles: %w", err)
	}

	// list
	listQuery := "SELECT a.id, a.public_id, a.title, a.slug, a.excerpt, a.cover_url, a.status, a.is_pinned, a.view_count, a.comment_count, a.reading_time_minutes, a.published_at, a.created_at, a.updated_at FROM articles a " + joinClause + " WHERE " + whereClause + " ORDER BY " + orderBy + " LIMIT ? OFFSET ?"

	if r.driver == "postgres" {
		listQuery = convertPlaceholders(listQuery)
	}

	listArgs := append(args, pageSize, offset)
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

	var publishedAtExpr string
	if ArticleStatus(status) == StatusPublished {
		publishedAtExpr = "CURRENT_TIMESTAMP"
	} else {
		publishedAtExpr = "NULL"
	}

	query := "INSERT INTO articles (title, slug, excerpt, content_md, cover_url, status, source_format, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, " + publishedAtExpr + ")"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query,
		input.Title, input.Slug, input.Excerpt, input.ContentMD,
		input.CoverURL, status, sourceFormat)
	if err != nil {
		return Article{}, fmt.Errorf("create article: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return Article{}, fmt.Errorf("create article last insert id: %w", err)
	}

	article, err := r.GetByID(ctx, id)
	if err != nil {
		return Article{}, fmt.Errorf("fetch created article: %w", err)
	}

	return article, nil
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
