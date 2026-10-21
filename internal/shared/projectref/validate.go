package projectref

import (
	platformhttp "CrescentLab_R/internal/platform/http"
	"context"
	"database/sql"
)

func Validate(ctx context.Context, db *sql.DB, driver string, id *int64) error {
	if id == nil {
		return nil
	}
	if *id < 1 {
		return platformhttp.ValidationError("invalid project_id")
	}
	placeholder := "?"
	if driver == "postgres" {
		placeholder = "$1"
	}
	var count int
	if err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM projects WHERE id = "+placeholder+" AND deleted_at IS NULL", *id).Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		return platformhttp.ValidationError("关联项目不存在或已删除")
	}
	return nil
}
