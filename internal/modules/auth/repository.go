package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

// Repository 管理 auth_tokens 表的读写。
type Repository struct {
	db     *sql.DB
	driver string
}

func NewRepository(db *sql.DB, driver string) *Repository {
	return &Repository{db: db, driver: driver}
}

// RevokeToken 将一个 refresh token 标记为已撤销。
// tokenHash 是 token 的 SHA256 哈希，不存储原始 token。
func (r *Repository) RevokeToken(ctx context.Context, userID int64, tokenHash string) error {
	if r == nil || r.db == nil {
		return errors.New("auth repository database is nil")
	}

	query := `INSERT INTO auth_tokens (user_id, token_hash, purpose, revoked_at) VALUES (?, ?, 'refresh', ?)`
	if r.driver == "postgres" {
		query = `INSERT INTO auth_tokens (user_id, token_hash, purpose, revoked_at) VALUES ($1, $2, 'refresh', $3)`
	}

	_, err := r.db.ExecContext(ctx, query, userID, tokenHash, time.Now())
	if err != nil {
		return fmt.Errorf("revoke token: %w", err)
	}
	return nil
}

// IsRevoked 检查一个 refresh token 是否已被撤销。
func (r *Repository) IsRevoked(ctx context.Context, tokenHash string) (bool, error) {
	if r == nil || r.db == nil {
		return false, errors.New("auth repository database is nil")
	}

	query := `SELECT EXISTS (SELECT 1 FROM auth_tokens WHERE token_hash = ?)`
	if r.driver == "postgres" {
		query = `SELECT EXISTS (SELECT 1 FROM auth_tokens WHERE token_hash = $1)`
	}

	var exists bool
	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check revoked token: %w", err)
	}
	return exists, nil
}

// HashToken 计算 token 的 SHA256 哈希。
func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
