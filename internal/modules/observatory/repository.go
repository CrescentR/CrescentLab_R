package observatory

import (
	"CrescentLab_R/internal/shared/projectref"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/lib/pq"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

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

const noteListColumns = `id, title, question, observation, conclusion, next_step, tags, note_type, status, visibility, is_featured, created_at, updated_at, project_id`
const noteDetailColumns = `id, public_id, title, content_md, content_html, question, observation, conclusion, next_step, tags, note_type, status, visibility, is_featured, created_at, updated_at, project_id`

func (r *Repository) List(ctx context.Context, filter ListFilter) (ListResult, error) {
	if r == nil || r.db == nil {
		return ListResult{}, errors.New("observatory repository database is nil")
	}

	page := filter.normalizedPage()
	pageSize := filter.normalizedPageSize()
	where, args := buildWhereClause(filter)
	order := " ORDER BY updated_at DESC"
	if filter.Visibility == NoteVisibilityPublic {
		order = " ORDER BY is_featured DESC, updated_at DESC"
	}

	countQuery := "SELECT COUNT(*) FROM observatory_notes" + where
	listQuery := "SELECT " + noteListColumns + " FROM observatory_notes" + where + order + " LIMIT ? OFFSET ?"

	if r.driver == "postgres" {
		countQuery = convertPlaceholders(countQuery)
		listQuery = convertPlaceholders(listQuery)
	}

	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return ListResult{}, fmt.Errorf("count observatory notes: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, listQuery, append(append([]any{}, args...), pageSize, (page-1)*pageSize)...)
	if err != nil {
		return ListResult{}, fmt.Errorf("list observatory notes: %w", err)
	}
	defer rows.Close()

	items := make([]NoteListItem, 0)
	for rows.Next() {
		item, err := scanNoteListItem(rows)
		if err != nil {
			return ListResult{}, fmt.Errorf("scan observatory note: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return ListResult{}, fmt.Errorf("iterate observatory notes: %w", err)
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

	if filter.Status != "" {
		where = append(where, "status = ?")
		args = append(args, string(filter.Status))
	}
	if filter.NoteType != "" {
		where = append(where, "note_type = ?")
		args = append(args, string(filter.NoteType))
	}
	if filter.Visibility != "" {
		where = append(where, "visibility = ?")
		args = append(args, string(filter.Visibility))
	}
	if strings.TrimSpace(filter.Search) != "" {
		where = append(where, "(title LIKE ? OR question LIKE ? OR observation LIKE ? OR content_md LIKE ?)")
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}

	return " WHERE " + strings.Join(where, " AND "), args
}

func (r *Repository) GetByID(ctx context.Context, id int64) (Note, error) {
	if r == nil || r.db == nil {
		return Note{}, errors.New("observatory repository database is nil")
	}

	query := "SELECT " + noteDetailColumns + " FROM observatory_notes WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	return scanNoteRow(r.db.QueryRowContext(ctx, query, id))
}

func (r *Repository) Create(ctx context.Context, input CreateInput, renderedHTML string) (Note, error) {
	if r == nil || r.db == nil {
		return Note{}, errors.New("observatory repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Note{}, err
	}
	if err := projectref.Validate(ctx, r.db, r.driver, input.ProjectID); err != nil {
		return Note{}, err
	}

	tagsJSON, err := json.Marshal(input.Tags)
	if err != nil {
		return Note{}, fmt.Errorf("marshal tags: %w", err)
	}

	query := createNoteQuery(r.driver)
	args := []any{
		input.Title, input.ContentMD, renderedHTML,
		input.Question, input.Observation, input.Conclusion, input.NextStep,
		string(tagsJSON), input.NoteType, input.Status, input.Visibility, input.IsFeatured, input.ProjectID,
	}

	var id int64
	if r.driver == "postgres" {
		if err := r.db.QueryRowContext(ctx, query, args...).Scan(&id); err != nil {
			return Note{}, normalizeNoteWriteError("create observatory note", err)
		}
	} else {
		result, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return Note{}, normalizeNoteWriteError("create observatory note", err)
		}
		id, err = result.LastInsertId()
		if err != nil {
			return Note{}, fmt.Errorf("create observatory note last insert id: %w", err)
		}
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id int64, input CreateInput, renderedHTML string) (Note, error) {
	if r == nil || r.db == nil {
		return Note{}, errors.New("observatory repository database is nil")
	}
	if err := input.Validate(); err != nil {
		return Note{}, err
	}
	if err := projectref.Validate(ctx, r.db, r.driver, input.ProjectID); err != nil {
		return Note{}, err
	}

	tagsJSON, err := json.Marshal(input.Tags)
	if err != nil {
		return Note{}, fmt.Errorf("marshal tags: %w", err)
	}

	query := `UPDATE observatory_notes
SET title = ?, content_md = ?, content_html = ?,
    question = ?, observation = ?, conclusion = ?, next_step = ?,
    tags = ?, note_type = ?, status = ?, visibility = ?, is_featured = ?, project_id = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND deleted_at IS NULL`
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query,
		input.Title, input.ContentMD, renderedHTML,
		input.Question, input.Observation, input.Conclusion, input.NextStep,
		string(tagsJSON), input.NoteType, input.Status, input.Visibility, input.IsFeatured, input.ProjectID, id)
	if err != nil {
		return Note{}, normalizeNoteWriteError("update observatory note", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return Note{}, fmt.Errorf("update observatory note rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return Note{}, sql.ErrNoRows
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) SoftDelete(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return errors.New("observatory repository database is nil")
	}

	query := "UPDATE observatory_notes SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("soft delete observatory note: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("soft delete observatory note rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func createNoteQuery(driver string) string {
	query := `INSERT INTO observatory_notes (
  title, content_md, content_html, question, observation, conclusion, next_step,
  tags, note_type, status, visibility, is_featured, project_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	if driver == "postgres" {
		return convertPlaceholders(query) + " RETURNING id"
	}
	return query
}

func scanNoteRow(row *sql.Row) (Note, error) {
	var note Note
	var tagsRaw string
	var noteType, status, visibility string
	var publicID sql.NullString
	var featured bool

	if err := row.Scan(
		&note.ID, &publicID, &note.Title,
		&note.ContentMD, &note.ContentHTML,
		&note.Question, &note.Observation, &note.Conclusion, &note.NextStep,
		&tagsRaw, &noteType, &status, &visibility, &featured,
		&note.CreatedAt, &note.UpdatedAt, &note.ProjectID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Note{}, err
		}
		return Note{}, fmt.Errorf("scan observatory note: %w", err)
	}

	note.PublicID = publicID.String
	note.NoteType = NoteType(noteType)
	note.Status = NoteStatus(status)
	note.Visibility = NoteVisibility(visibility)
	note.IsFeatured = featured
	if tagsRaw != "" {
		_ = json.Unmarshal([]byte(tagsRaw), &note.Tags)
	}
	if note.Tags == nil {
		note.Tags = []string{}
	}

	return note, nil
}

func scanNoteListItem(scanner interface{ Scan(dest ...any) error }) (NoteListItem, error) {
	var item NoteListItem
	var tagsRaw string
	var featured bool

	if err := scanner.Scan(
		&item.ID, &item.Title,
		&item.Question, &item.Observation, &item.Conclusion, &item.NextStep,
		&tagsRaw, &item.NoteType, &item.Status, &item.Visibility, &featured,
		&item.CreatedAt, &item.UpdatedAt, &item.ProjectID,
	); err != nil {
		return NoteListItem{}, err
	}

	item.IsFeatured = featured
	if tagsRaw != "" {
		_ = json.Unmarshal([]byte(tagsRaw), &item.Tags)
	}
	if item.Tags == nil {
		item.Tags = []string{}
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

func normalizeNoteWriteError(operation string, err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return fmt.Errorf("%s: %w", operation, errors.New("duplicate entry"))
	}
	var sqliteErr *sqlite.Error
	if errors.As(err, &sqliteErr) && sqliteErr.Code() == sqlite3.SQLITE_CONSTRAINT_UNIQUE {
		return fmt.Errorf("%s: %w", operation, errors.New("duplicate entry"))
	}
	return fmt.Errorf("%s: %w", operation, err)
}
