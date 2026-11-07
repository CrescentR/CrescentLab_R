package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"CrescentLab_R/internal/platform/config"
	"CrescentLab_R/internal/platform/database"
)

func TestLiveReturnsOK(t *testing.T) {
	rec := serveHealth(t, openTestDB(t), "/healthz/live")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestReadyReportsMissingCoreTables(t *testing.T) {
	rec := serveHealth(t, openTestDB(t), "/healthz/ready")

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"database":"schema_missing"`) {
		t.Fatalf("body = %s", rec.Body.String())
	}
}

func TestReadyReturnsOKWhenCoreTablesExist(t *testing.T) {
	db := openTestDB(t)
	for _, table := range []string{"users", "settings", "articles", "post_categories"} {
		if _, err := db.SQL().Exec("CREATE TABLE " + table + " (id INTEGER PRIMARY KEY)"); err != nil {
			t.Fatalf("create %s: %v", table, err)
		}
	}

	rec := serveHealth(t, db, "/healthz/ready")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"database":"connected"`) {
		t.Fatalf("body = %s", rec.Body.String())
	}
}

func TestReadyReturnsUnavailableWhenDatabaseClosed(t *testing.T) {
	db := openTestDB(t)
	if err := db.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	rec := serveHealth(t, db, "/healthz/ready")

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"database":"disconnected"`) {
		t.Fatalf("body = %s", rec.Body.String())
	}
}

func serveHealth(t *testing.T, db *database.DB, path string) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	NewHealthHandler(db).RegisterRoutes(engine.Group(""))

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

func openTestDB(t *testing.T) *database.DB {
	t.Helper()
	db, err := database.Open(context.Background(), config.DatabaseConfig{
		Driver: "sqlite",
		DSN:    filepath.Join(t.TempDir(), "health.db"),
	})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}
