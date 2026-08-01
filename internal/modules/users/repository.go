package users

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

const userColumns = `id, group_id, username, email, password_hash, nickname,
avatar_url, website, status, is_system, last_login_at, last_login_ip,
created_at, updated_at, deleted_at`

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

func (r *Repository) Create(ctx context.Context, input CreateInput) (User, error) {
	if r == nil || r.db == nil {
		return User{}, errors.New("users repository database is nil")
	}
	status := input.Status
	if status == "" {
		status = StatusPending
	}
	query := `INSERT INTO users
(group_id, username, username_key, email, email_key, password_hash, nickname, status, is_system)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	args := []any{input.GroupID, input.Username, input.UsernameKey, input.Email, input.EmailKey,
		input.PasswordHash, input.Nickname, status, input.IsSystem}
	if r.driver == "postgres" {
		query += ` RETURNING id`
		query = postgresPlaceholders(query)
		var id int64
		if err := r.db.QueryRowContext(ctx, query, args...).Scan(&id); err != nil {
			return User{}, fmt.Errorf("create user: %w", err)
		}
		return r.GetByID(ctx, id)
	}
	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return User{}, fmt.Errorf("create user: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return User{}, fmt.Errorf("create user id: %w", err)
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) GetByUsernameKey(ctx context.Context, usernameKey string) (User, error) {
	if r == nil || r.db == nil {
		return User{}, errors.New("users repository database is nil")
	}
	query := "SELECT " + userColumns + " FROM users WHERE username_key = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = "SELECT " + userColumns + " FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL"
	}
	return scanUser(r.db.QueryRowContext(ctx, query, usernameKey), "get user by username")
}

func (r *Repository) GetByEmailKey(ctx context.Context, emailKey string) (User, error) {
	if r == nil || r.db == nil {
		return User{}, errors.New("users repository database is nil")
	}
	query := "SELECT " + userColumns + " FROM users WHERE email_key = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = "SELECT " + userColumns + " FROM users WHERE email_key = $1 AND deleted_at IS NULL"
	}
	return scanUser(r.db.QueryRowContext(ctx, query, emailKey), "get user by email")
}

func (r *Repository) GetByID(ctx context.Context, id int64) (User, error) {
	if r == nil || r.db == nil {
		return User{}, errors.New("users repository database is nil")
	}
	return r.getByID(ctx, id, "get user by id")
}

func (r *Repository) UpdatePassword(ctx context.Context, id int64, passwordHash string) error {
	if r == nil || r.db == nil {
		return errors.New("users repository database is nil")
	}
	query := `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`
	if r.driver == "postgres" {
		query = `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL`
	}
	result, err := r.db.ExecContext(ctx, query, passwordHash, id)
	if err != nil {
		return fmt.Errorf("update user password: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update user password rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) UpdateLastLogin(ctx context.Context, id int64, lastLoginAt time.Time, lastLoginIP string) error {
	if r == nil || r.db == nil {
		return errors.New("users repository database is nil")
	}
	query := `UPDATE users SET last_login_at = ?, last_login_ip = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`
	if r.driver == "postgres" {
		query = `UPDATE users SET last_login_at = $1, last_login_ip = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND deleted_at IS NULL`
	}
	result, err := r.db.ExecContext(ctx, query, lastLoginAt, lastLoginIP, id)
	if err != nil {
		return fmt.Errorf("update user last login: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update user last login rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) getByID(ctx context.Context, id int64, operation string) (User, error) {
	query := "SELECT " + userColumns + " FROM users WHERE id = ? AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = "SELECT " + userColumns + " FROM users WHERE id = $1 AND deleted_at IS NULL"
	}
	return scanUser(r.db.QueryRowContext(ctx, query, id), operation)
}

type userScanner interface {
	Scan(dest ...any) error
}

func scanUser(scanner userScanner, operation string) (User, error) {
	var user User
	var status sql.NullString
	var email sql.NullString
	var website sql.NullString
	var avatar sql.NullString
	if err := scanner.Scan(
		&user.ID, &user.GroupID, &user.Username, &email,
		&user.PasswordHash, &user.Nickname, &avatar, &website,
		&status, &user.IsSystem, &user.LastLoginAt, &user.LastLoginIP, &user.CreatedAt,
		&user.UpdatedAt, &user.DeletedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, err
		}
		return User{}, fmt.Errorf("%s: %w", operation, err)
	}

	if status.Valid {
		user.Status = Status(status.String)
	}

	if user.GroupID.Valid && user.GroupID.Int64 == 1 {
		user.IsSystem = true
	}

	user.UsernameKey = strings.ToLower(user.Username)
	user.Email = email
	user.AvatarURL = avatar
	user.Website = website
	return user, nil
}

func postgresPlaceholders(query string) string {
	for index := 1; strings.Contains(query, "?"); index++ {
		query = strings.Replace(query, "?", fmt.Sprintf("$%d", index), 1)
	}
	return query
}
