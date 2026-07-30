package users

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// Hexo 博客表结构适配
// Hexo users 表字段: id, deleted_at, created_at, updated_at, username, password_hash,
// nickname, avatar_url, email, website, last_login_at, status(text), group_id
const userColumns = `id, group_id, username, email, password_hash, nickname,
avatar_url, website, status, last_login_at, created_at, updated_at, deleted_at`

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
	return User{}, errors.New("create user not supported for Hexo schema")
}

func (r *Repository) GetByUsernameKey(ctx context.Context, usernameKey string) (User, error) {
	if r == nil || r.db == nil {
		return User{}, errors.New("users repository database is nil")
	}
	// Hexo 表用 username 字段，不区分大小写匹配
	query := "SELECT " + userColumns + " FROM users WHERE LOWER(username) = LOWER(?) AND deleted_at IS NULL"
	if r.driver == "postgres" {
		query = "SELECT " + userColumns + " FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL"
	}
	return scanUser(r.db.QueryRowContext(ctx, query, usernameKey), "get user by username")
}

func (r *Repository) GetByEmailKey(ctx context.Context, emailKey string) (User, error) {
	if r == nil || r.db == nil {
		return User{}, errors.New("users repository database is nil")
	}
	return User{}, errors.New("get by email not supported for Hexo schema")
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
	query := `UPDATE users SET last_login_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, lastLoginAt, id)
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
	query := "SELECT " + userColumns + " FROM users WHERE id = $1 AND deleted_at IS NULL"
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
		&status, &user.LastLoginAt, &user.CreatedAt,
		&user.UpdatedAt, &user.DeletedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, err
		}
		return User{}, fmt.Errorf("%s: %w", operation, err)
	}

	if status.Valid && status.String == "active" {
		user.Status = StatusActive
	} else {
		user.Status = StatusDisabled
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
