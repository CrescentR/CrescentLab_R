package projects

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/lib/pq"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

var ErrProjectSlugConflict = errors.New("project slug already exists")

type Repository struct {
	db     *sql.DB
	driver string
}

func NewRepository(db *sql.DB, driver ...string) *Repository {
	d := "sqlite"
	if len(driver) > 0 {
		d = driver[0]
	}
	return &Repository{db: db, driver: d}
}

// EnsureContentSchema keeps existing installations compatible with README/MDX fields.
func (r *Repository) EnsureContentSchema(ctx context.Context) error {
	if r == nil || r.db == nil {
		return errors.New("projects repository database is nil")
	}
	statements := []string{
		"ALTER TABLE projects ADD COLUMN content_md TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE projects ADD COLUMN source_format TEXT NOT NULL DEFAULT 'markdown'",
	}
	if r.driver == "postgres" {
		statements = []string{
			"ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_md TEXT NOT NULL DEFAULT ''",
			"ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_format TEXT NOT NULL DEFAULT 'markdown'",
		}
	}
	for _, statement := range statements {
		if _, err := r.db.ExecContext(ctx, statement); err != nil && !strings.Contains(strings.ToLower(err.Error()), "duplicate column") {
			return fmt.Errorf("ensure project content schema: %w", err)
		}
	}
	return nil
}

func (r *Repository) List(ctx context.Context, filter ListFilter) (ListResult, error) {
	if r == nil || r.db == nil {
		return ListResult{}, errors.New("projects repository database is nil")
	}

	page := filter.normalizedPage()
	pageSize := filter.normalizedPageSize()
	where, args := buildProjectWhereClause(filter)

	countQuery := "SELECT COUNT(*) FROM projects" + where
	listQuery := "SELECT id, name, slug, tagline, status, cover_url, repo_url, demo_url, tech_stack, view_count, published_at, created_at, updated_at, phase, goal, boundary, current_work, progress_percent, closure_kind, closure_reason FROM projects" + where + " ORDER BY sort_order DESC, COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?"

	if r.driver == "postgres" {
		countQuery = convertPlaceholders(countQuery)
		listQuery = convertPlaceholders(listQuery)
	}

	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return ListResult{}, fmt.Errorf("count projects: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, listQuery, append(append([]any{}, args...), pageSize, (page-1)*pageSize)...)
	if err != nil {
		return ListResult{}, fmt.Errorf("list projects: %w", err)
	}
	defer rows.Close()

	items := make([]ProjectListItem, 0)
	for rows.Next() {
		item, err := scanProjectListItem(rows)
		if err != nil {
			return ListResult{}, fmt.Errorf("scan project: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return ListResult{}, fmt.Errorf("iterate projects: %w", err)
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

func buildProjectWhereClause(filter ListFilter) (string, []any) {
	where := []string{"deleted_at IS NULL"}
	args := []any{}

	if filter.Public {
		where = append(where, "status = 'published'")
	} else if filter.Status != "" {
		where = append(where, "status = ?")
		args = append(args, string(filter.Status))
	}
	if strings.TrimSpace(filter.Search) != "" {
		where = append(where, "(name LIKE ? OR tagline LIKE ?)")
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern)
	}

	return " WHERE " + strings.Join(where, " AND "), args
}

// Related lists every article and note linked to a project, including drafts and private items.
func (r *Repository) Related(ctx context.Context, projectID int64) (RelatedRecords, error) {
	if r == nil || r.db == nil {
		return RelatedRecords{}, errors.New("projects repository database is nil")
	}
	articles, err := r.relatedRecords(ctx, "SELECT id, title, slug, status, visibility, published_at, created_at FROM articles WHERE project_id = ? AND deleted_at IS NULL", projectID)
	if err != nil {
		return RelatedRecords{}, fmt.Errorf("list related articles: %w", err)
	}
	notes, err := r.relatedRecords(ctx, "SELECT id, title, '', status, visibility, NULL, created_at FROM observatory_notes WHERE project_id = ? AND deleted_at IS NULL", projectID)
	if err != nil {
		return RelatedRecords{}, fmt.Errorf("list related notes: %w", err)
	}
	return RelatedRecords{Articles: articles, Notes: notes}, nil
}

func (r *Repository) relatedRecords(ctx context.Context, query string, projectID int64) ([]RelatedRecord, error) {
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}
	rows, err := r.db.QueryContext(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	records := make([]RelatedRecord, 0)
	for rows.Next() {
		var record RelatedRecord
		var publishedAt sql.NullTime
		if err := rows.Scan(&record.ID, &record.Title, &record.Slug, &record.Status, &record.Visibility, &publishedAt, &record.Date); err != nil {
			return nil, err
		}
		if publishedAt.Valid {
			record.Date = publishedAt.Time
		}
		records = append(records, record)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	sort.Slice(records, func(a, b int) bool { return records[a].Date.After(records[b].Date) })
	return records, nil
}

func (r *Repository) GetBySlug(ctx context.Context, slug string) (Project, error) {
	if r == nil || r.db == nil {
		return Project{}, errors.New("projects repository database is nil")
	}

	query := "SELECT id, public_id, owner_id, name, slug, tagline, description, content_md, content_html, source_format, cover_url, repo_url, demo_url, status, tech_stack, sort_order, view_count, published_at, created_at, updated_at, phase, goal, boundary, current_work, progress_percent, closure_kind, closure_reason FROM projects WHERE slug = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	return scanProjectRow(r.db.QueryRowContext(ctx, query, slug))
}

func (r *Repository) GetByID(ctx context.Context, id int64) (Project, error) {
	if r == nil || r.db == nil {
		return Project{}, errors.New("projects repository database is nil")
	}

	query := "SELECT id, public_id, owner_id, name, slug, tagline, description, content_md, content_html, source_format, cover_url, repo_url, demo_url, status, tech_stack, sort_order, view_count, published_at, created_at, updated_at, phase, goal, boundary, current_work, progress_percent, closure_kind, closure_reason FROM projects WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	return scanProjectRow(r.db.QueryRowContext(ctx, query, id))
}

func (r *Repository) Create(ctx context.Context, input CreateInput, renderedHTML string) (Project, error) {
	if r == nil || r.db == nil {
		return Project{}, errors.New("projects repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Project{}, err
	}

	status := input.Status
	if status == "" {
		status = string(ProjectStatusDraft)
	}
	sourceFormat := input.SourceFormat
	if sourceFormat == "" {
		sourceFormat = "markdown"
	}

	techJSON, err := json.Marshal(input.TechStack)
	if err != nil {
		return Project{}, fmt.Errorf("marshal tech_stack: %w", err)
	}

	query := createProjectQuery(r.driver, status)
	args := []any{
		input.Name, input.Slug, input.Tagline, input.Description,
		input.ContentMD, renderedHTML, sourceFormat, input.CoverURL, input.RepoURL, input.DemoURL,
		status, string(techJSON), input.Phase, input.Goal, input.Boundary, input.CurrentWork, input.ProgressPercent, input.ClosureKind, input.ClosureReason,
	}

	var id int64
	if r.driver == "postgres" {
		if err := r.db.QueryRowContext(ctx, query, args...).Scan(&id); err != nil {
			return Project{}, normalizeProjectWriteError("create project", err)
		}
	} else {
		result, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return Project{}, normalizeProjectWriteError("create project", err)
		}
		id, err = result.LastInsertId()
		if err != nil {
			return Project{}, fmt.Errorf("create project last insert id: %w", err)
		}
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id int64, input CreateInput, renderedHTML string) (Project, error) {
	if r == nil || r.db == nil {
		return Project{}, errors.New("projects repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Project{}, err
	}

	status := input.Status
	if status == "" {
		status = string(ProjectStatusDraft)
	}
	sourceFormat := input.SourceFormat
	if sourceFormat == "" {
		sourceFormat = "markdown"
	}

	techJSON, err := json.Marshal(input.TechStack)
	if err != nil {
		return Project{}, fmt.Errorf("marshal tech_stack: %w", err)
	}

	query := `UPDATE projects
SET name = ?, slug = ?, tagline = ?, description = ?, content_md = ?, content_html = ?, source_format = ?,
    cover_url = ?, repo_url = ?, demo_url = ?, status = ?, tech_stack = ?, phase = ?, goal = ?, boundary = ?, current_work = ?, progress_percent = ?, closure_kind = ?, closure_reason = ?,
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
		input.Name, input.Slug, input.Tagline, input.Description,
		input.ContentMD, renderedHTML, sourceFormat, input.CoverURL, input.RepoURL, input.DemoURL,
		status, string(techJSON), input.Phase, input.Goal, input.Boundary, input.CurrentWork, input.ProgressPercent, input.ClosureKind, input.ClosureReason, status, id)
	if err != nil {
		return Project{}, normalizeProjectWriteError("update project", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return Project{}, fmt.Errorf("update project rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return Project{}, sql.ErrNoRows
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) SoftDelete(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return errors.New("projects repository database is nil")
	}

	query := "UPDATE projects SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("soft delete project: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("soft delete project rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func createProjectQuery(driver, status string) string {
	publishedAtExpr := "NULL"
	if status == string(ProjectStatusPublished) {
		publishedAtExpr = "CURRENT_TIMESTAMP"
	}
	query := "INSERT INTO projects (name, slug, tagline, description, content_md, content_html, source_format, cover_url, repo_url, demo_url, status, tech_stack, phase, goal, boundary, current_work, progress_percent, closure_kind, closure_reason, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + publishedAtExpr + ")"
	if driver == "postgres" {
		return convertPlaceholders(query) + " RETURNING id"
	}
	return query
}

func scanProjectRow(row *sql.Row) (Project, error) {
	var project Project
	var status string
	var tagline, coverURL, repoURL, demoURL, sourceFormat sql.NullString
	var techStackRaw string
	var publishedAt sql.NullTime

	if err := row.Scan(
		&project.ID, &project.PublicID, &project.OwnerID,
		&project.Name, &project.Slug, &tagline,
		&project.Description, &project.ContentMD, &project.ContentHTML, &sourceFormat,
		&coverURL, &repoURL, &demoURL,
		&status, &techStackRaw,
		&project.SortOrder, &project.ViewCount,
		&publishedAt, &project.CreatedAt, &project.UpdatedAt,
		&project.Phase, &project.Goal, &project.Boundary, &project.CurrentWork, &project.ProgressPercent, &project.ClosureKind, &project.ClosureReason,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Project{}, err
		}
		return Project{}, fmt.Errorf("scan project: %w", err)
	}

	project.Status = ProjectStatus(status)
	project.Tagline = tagline
	project.CoverURL = coverURL
	project.RepoURL = repoURL
	project.DemoURL = demoURL
	project.SourceFormat = sourceFormat.String
	if project.SourceFormat == "" {
		project.SourceFormat = "markdown"
	}
	if publishedAt.Valid {
		project.PublishedAt = publishedAt
	}
	if techStackRaw != "" {
		_ = json.Unmarshal([]byte(techStackRaw), &project.TechStack)
	}

	return project, nil
}

func scanProjectListItem(scanner interface{ Scan(dest ...any) error }) (ProjectListItem, error) {
	var item ProjectListItem
	var tagline, coverURL, repoURL, demoURL sql.NullString
	var techStackRaw string
	var publishedAt sql.NullTime

	if err := scanner.Scan(
		&item.ID, &item.Name, &item.Slug,
		&tagline, &item.Status, &coverURL,
		&repoURL, &demoURL, &techStackRaw,
		&item.ViewCount, &publishedAt,
		&item.CreatedAt, &item.UpdatedAt,
		&item.Phase, &item.Goal, &item.Boundary, &item.CurrentWork, &item.ProgressPercent, &item.ClosureKind, &item.ClosureReason,
	); err != nil {
		return ProjectListItem{}, err
	}

	item.Tagline = tagline.String
	item.CoverURL = coverURL.String
	item.RepoURL = repoURL.String
	item.DemoURL = demoURL.String
	if publishedAt.Valid {
		t := publishedAt.Time
		item.PublishedAt = &t
	}
	if techStackRaw != "" {
		_ = json.Unmarshal([]byte(techStackRaw), &item.TechStack)
	}

	return item, nil
}

func normalizeProjectWriteError(operation string, err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return fmt.Errorf("%s: %w", operation, ErrProjectSlugConflict)
	}
	var sqliteErr *sqlite.Error
	if errors.As(err, &sqliteErr) && sqliteErr.Code() == sqlite3.SQLITE_CONSTRAINT_UNIQUE {
		return fmt.Errorf("%s: %w", operation, ErrProjectSlugConflict)
	}
	return fmt.Errorf("%s: %w", operation, err)
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
