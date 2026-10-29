package builds

import (
	"CrescentLab_R/internal/shared/projectref"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

var ErrSlugConflict = errors.New("build slug already exists")

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

const buildColumns = `id, name, slug, one_liner, stage, round_goal, latest_progress, next_step, detail_url, demo_url, repo_url, status, sort_order, progressed_at, published_at, created_at, updated_at, project_id`

func (r *Repository) List(ctx context.Context, filter ListFilter) (ListResult, error) {
	if r == nil || r.db == nil {
		return ListResult{}, errors.New("builds repository database is nil")
	}

	page := filter.normalizedPage()
	pageSize := filter.normalizedPageSize()
	where, args := buildWhereClause(filter)

	countQuery := "SELECT COUNT(*) FROM builds" + where
	listQuery := "SELECT " + buildColumns + " FROM builds" + where + " ORDER BY sort_order ASC, COALESCE(progressed_at, updated_at) DESC LIMIT ? OFFSET ?"
	if r.driver == "postgres" {
		countQuery = convertPlaceholders(countQuery)
		listQuery = convertPlaceholders(listQuery)
	}

	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return ListResult{}, fmt.Errorf("count builds: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, listQuery, append(append([]any{}, args...), pageSize, (page-1)*pageSize)...)
	if err != nil {
		return ListResult{}, fmt.Errorf("list builds: %w", err)
	}
	defer rows.Close()

	items := make([]BuildListItem, 0)
	for rows.Next() {
		item, err := scanBuild(rows)
		if err != nil {
			return ListResult{}, fmt.Errorf("scan build: %w", err)
		}
		items = append(items, item.ListItem())
	}
	if err := rows.Err(); err != nil {
		return ListResult{}, fmt.Errorf("iterate builds: %w", err)
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

func buildWhereClause(filter ListFilter) (string, []any) {
	where := []string{"deleted_at IS NULL"}
	args := []any{}
	if filter.ProjectID != nil {
		where = append(where, "project_id = ?")
		args = append(args, *filter.ProjectID)
	}
	if filter.Unassigned {
		where = append(where, "project_id IS NULL")
	}
	if filter.Status != "" {
		where = append(where, "status = ?")
		args = append(args, string(filter.Status))
	}
	if strings.TrimSpace(filter.Search) != "" {
		where = append(where, "(name LIKE ? OR one_liner LIKE ? OR latest_progress LIKE ?)")
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	return " WHERE " + strings.Join(where, " AND "), args
}

func (r *Repository) GetByID(ctx context.Context, id int64) (Build, error) {
	if r == nil || r.db == nil {
		return Build{}, errors.New("builds repository database is nil")
	}
	query := "SELECT " + buildColumns + " FROM builds WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}
	return scanBuildRow(r.db.QueryRowContext(ctx, query, id))
}

func (r *Repository) Create(ctx context.Context, input CreateInput) (Build, error) {
	if r == nil || r.db == nil {
		return Build{}, errors.New("builds repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Build{}, err
	}
	if err := projectref.Validate(ctx, r.db, r.driver, input.ProjectID); err != nil {
		return Build{}, err
	}

	now := time.Now().UTC()
	progressedAt := now
	if input.ProgressedAt != nil {
		progressedAt = input.ProgressedAt.UTC()
	}
	var publishedAt any
	if input.Status == string(StatusPublished) {
		publishedAt = now
	}

	query := `INSERT INTO builds (
  name, slug, one_liner, stage, round_goal, latest_progress, next_step,
  detail_url, demo_url, repo_url, status, sort_order, progressed_at, published_at, project_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	if r.driver == "postgres" {
		query = convertPlaceholders(query) + " RETURNING id"
	}

	args := []any{
		input.Name, input.Slug, input.OneLiner, input.Stage, input.RoundGoal, input.LatestProgress, input.NextStep,
		nullString(input.DetailURL), nullString(input.DemoURL), nullString(input.RepoURL),
		input.Status, input.SortOrder, progressedAt, publishedAt, input.ProjectID,
	}

	var id int64
	if r.driver == "postgres" {
		if err := r.db.QueryRowContext(ctx, query, args...).Scan(&id); err != nil {
			return Build{}, normalizeWriteError("create build", err)
		}
	} else {
		result, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return Build{}, normalizeWriteError("create build", err)
		}
		id, err = result.LastInsertId()
		if err != nil {
			return Build{}, fmt.Errorf("create build last insert id: %w", err)
		}
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id int64, input CreateInput) (Build, error) {
	if r == nil || r.db == nil {
		return Build{}, errors.New("builds repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Build{}, err
	}
	if err := projectref.Validate(ctx, r.db, r.driver, input.ProjectID); err != nil {
		return Build{}, err
	}
	current, err := r.GetByID(ctx, id)
	if err != nil {
		return Build{}, err
	}

	now := time.Now().UTC()
	progressedAt := now
	if input.ProgressedAt != nil {
		progressedAt = input.ProgressedAt.UTC()
	} else if current.ProgressedAt != nil {
		progressedAt = *current.ProgressedAt
	}
	publishedAt := current.PublishedAt
	if input.Status == string(StatusPublished) && publishedAt == nil {
		publishedAt = &now
	}
	if input.Status != string(StatusPublished) {
		publishedAt = current.PublishedAt
	}

	query := `UPDATE builds
SET name = ?, slug = ?, one_liner = ?, stage = ?, round_goal = ?, latest_progress = ?, next_step = ?,
    detail_url = ?, demo_url = ?, repo_url = ?, status = ?, sort_order = ?,
    progressed_at = ?, published_at = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND deleted_at IS NULL`
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query,
		input.Name, input.Slug, input.OneLiner, input.Stage, input.RoundGoal, input.LatestProgress, input.NextStep,
		nullString(input.DetailURL), nullString(input.DemoURL), nullString(input.RepoURL),
		input.Status, input.SortOrder, progressedAt, timePointer(publishedAt), input.ProjectID, id)
	if err != nil {
		return Build{}, normalizeWriteError("update build", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return Build{}, fmt.Errorf("update build rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return Build{}, sql.ErrNoRows
	}
	return r.GetByID(ctx, id)
}

// AssignProject links a legacy progress record to a project without touching its other fields.
func (r *Repository) AssignProject(ctx context.Context, id, projectID int64) (Build, error) {
	if r == nil || r.db == nil {
		return Build{}, errors.New("builds repository database is nil")
	}
	if err := projectref.Validate(ctx, r.db, r.driver, &projectID); err != nil {
		return Build{}, err
	}
	query := "UPDATE builds SET project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}
	result, err := r.db.ExecContext(ctx, query, projectID, id)
	if err != nil {
		return Build{}, fmt.Errorf("assign build project: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return Build{}, fmt.Errorf("assign build project rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return Build{}, sql.ErrNoRows
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) SoftDelete(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return errors.New("builds repository database is nil")
	}
	query := "UPDATE builds SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("soft delete build: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("soft delete build rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func scanBuildRow(row *sql.Row) (Build, error) {
	item, err := scanBuild(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Build{}, err
		}
		return Build{}, fmt.Errorf("scan build: %w", err)
	}
	return item, nil
}

func scanBuild(scanner interface{ Scan(dest ...any) error }) (Build, error) {
	var item Build
	var detail, demo, repo sql.NullString
	var stage, status string
	var progressedAt, publishedAt sql.NullTime
	if err := scanner.Scan(
		&item.ID, &item.Name, &item.Slug, &item.OneLiner, &stage, &item.RoundGoal, &item.LatestProgress, &item.NextStep,
		&detail, &demo, &repo, &status, &item.SortOrder, &progressedAt, &publishedAt, &item.CreatedAt, &item.UpdatedAt, &item.ProjectID,
	); err != nil {
		return Build{}, err
	}
	item.Stage = Stage(stage)
	item.Status = Status(status)
	item.DetailURL = detail.String
	item.DemoURL = demo.String
	item.RepoURL = repo.String
	if progressedAt.Valid {
		value := progressedAt.Time
		item.ProgressedAt = &value
	}
	if publishedAt.Valid {
		value := publishedAt.Time
		item.PublishedAt = &value
	}
	return item, nil
}

func nullString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func timePointer(value *time.Time) any {
	if value == nil {
		return nil
	}
	return *value
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

func normalizeWriteError(operation string, err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return ErrSlugConflict
	}
	var sqliteErr *sqlite.Error
	if errors.As(err, &sqliteErr) && sqliteErr.Code() == sqlite3.SQLITE_CONSTRAINT_UNIQUE {
		return ErrSlugConflict
	}
	return fmt.Errorf("%s: %w", operation, err)
}
