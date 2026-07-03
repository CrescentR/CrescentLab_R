package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"CrescentLab_R/internal/platform/config"

	_ "modernc.org/sqlite"
)

type DB struct {
	sqlDB  *sql.DB
	driver string
}

func Open(ctx context.Context, cfg config.DatabaseConfig) (*DB, error) {
	if cfg.Driver != "sqlite" {
		return nil, fmt.Errorf("unsupported database.driver %q; supported: sqlite", cfg.Driver)
	}

	sqlDB, err := sql.Open(cfg.Driver, cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return &DB{sqlDB: sqlDB, driver: cfg.Driver}, nil
}

func (db *DB) SQL() *sql.DB {
	if db == nil {
		return nil
	}
	return db.sqlDB
}

func (db *DB) Driver() string {
	if db == nil {
		return ""
	}
	return db.driver
}

func (db *DB) Ping(ctx context.Context) error {
	if db == nil || db.sqlDB == nil {
		return errors.New("database is not open")
	}
	return db.sqlDB.PingContext(ctx)
}

func (db *DB) Close() error {
	if db == nil || db.sqlDB == nil {
		return nil
	}
	return db.sqlDB.Close()
}
