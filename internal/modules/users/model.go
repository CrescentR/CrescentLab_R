package users

import (
	"database/sql"
	"time"
)

type Status string

const (
	StatusPending  Status = "pending"
	StatusActive   Status = "active"
	StatusDisabled Status = "disabled"
	StatusLocked   Status = "locked"
	StatusDeleted  Status = "deleted"
)

type User struct {
	ID                int64
	GroupID           sql.NullInt64
	Username          string
	UsernameKey       string
	Email             sql.NullString
	EmailKey          sql.NullString
	PasswordHash      string
	Nickname          string
	AvatarFileID      sql.NullInt64
	AvatarURL         sql.NullString
	Website           sql.NullString
	Bio               sql.NullString
	Status            Status
	IsSystem          bool
	EmailVerifiedAt   sql.NullTime
	ActivatedAt       sql.NullTime
	LastLoginAt       sql.NullTime
	LastLoginIP       sql.NullString
	PasswordChangedAt sql.NullTime
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         sql.NullTime
}

type CreateInput struct {
	GroupID      sql.NullInt64
	Username     string
	UsernameKey  string
	Email        sql.NullString
	EmailKey     sql.NullString
	PasswordHash string
	Nickname     string
	Status       Status
	IsSystem     bool
}
