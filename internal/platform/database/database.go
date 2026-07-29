package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"CrescentLab_R/internal/platform/config"

	"github.com/lib/pq"
	_ "modernc.org/sqlite"
)

const databasePingRetryInterval = time.Second

type DB struct {
	sqlDB  *sql.DB
	driver string
}

func Open(ctx context.Context, cfg config.DatabaseConfig) (*DB, error) {
	switch cfg.Driver {
	case "postgres", "sqlite":
	default:
		return nil, fmt.Errorf("unsupported database.driver %q; supported: postgres, sqlite", cfg.Driver)
	}

	sqlDB, err := sql.Open(cfg.Driver, cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	if err := pingDatabase(ctx, cfg.Driver, databasePingRetryInterval, sqlDB.PingContext); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return &DB{sqlDB: sqlDB, driver: cfg.Driver}, nil
}

func pingDatabase(ctx context.Context, driver string, retryInterval time.Duration, ping func(context.Context) error) error {
	for {
		err := ping(ctx)
		if err == nil {
			return nil
		}

		var postgresError *pq.Error
		if driver != "postgres" || !errors.As(err, &postgresError) || postgresError.Code != pq.ErrorCode("57P03") {
			return err
		}

		timer := time.NewTimer(retryInterval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return ctx.Err()
		case <-timer.C:
		}
	}
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
