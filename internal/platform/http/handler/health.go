package handler

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"CrescentLab_R/internal/platform/database"
	platformhttp "CrescentLab_R/internal/platform/http"
)

// HealthHandler 处理存活和就绪健康检查。
type HealthHandler struct {
	db *database.DB
}

// NewHealthHandler 创建健康检查 handler。
func NewHealthHandler(db *database.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// RegisterRoutes 注册健康检查路由。
func (h *HealthHandler) RegisterRoutes(group *gin.RouterGroup) {
	group.GET("/healthz/live", h.live)
	group.GET("/healthz/ready", h.ready)
}

// live 检查进程存活，不查询数据库。
func (h *HealthHandler) live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ready 检查数据库连接和核心表是否存在。
func (h *HealthHandler) ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	if h.db == nil {
		platformhttp.WriteErrorCode(c, platformhttp.CodeServiceUnavailable, http.StatusServiceUnavailable, "数据库未初始化")
		return
	}

	if err := h.db.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "degraded",
			"database":  "disconnected",
			"checks":    gin.H{},
			"request_id": c.GetString("request_id"),
		})
		return
	}

	checks := h.checkCoreTables(ctx)
	allOk := true
	for _, ok := range checks {
		if !ok {
			allOk = false
			break
		}
	}

	if !allOk {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "degraded",
			"database":  "schema_missing",
			"checks":    checks,
			"request_id": c.GetString("request_id"),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"database":  "connected",
		"checks":    checks,
		"request_id": c.GetString("request_id"),
	})
}

// checkCoreTables 检查当前已实现模块依赖的核心表是否存在。
func (h *HealthHandler) checkCoreTables(ctx context.Context) map[string]bool {
	tables := []string{"users", "settings", "articles", "post_categories"}
	checks := make(map[string]bool, len(tables))

	sqlDB := h.db.SQL()
	if sqlDB == nil {
		for _, t := range tables {
			checks[t] = false
		}
		return checks
	}

	driver := h.db.Driver()
	for _, table := range tables {
		checks[table] = tableExists(ctx, sqlDB, driver, table)
	}
	return checks
}

func tableExists(ctx context.Context, db *sql.DB, driver, table string) bool {
	var query string
	var args []any
	if driver == "postgres" {
		query = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`
		args = []any{table}
	} else {
		query = `SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?)`
		args = []any{table}
	}

	var exists bool
	err := db.QueryRowContext(ctx, query, args...).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}
