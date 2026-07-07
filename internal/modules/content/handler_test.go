package content

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandlerListReturnsPublishedArticles(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "published-one", "Published One", "published")
	seedArticle(t, db, "draft-one", "Draft One", "draft")

	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/articles", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "Published One") {
		t.Fatalf("body should contain published article: %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "Draft One") {
		t.Fatalf("body should not contain draft article: %s", rec.Body.String())
	}
}

func TestHandlerListWithSearch(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "go-post", "Go Programming Guide", "published")
	seedArticle(t, db, "rust-post", "Rust Programming Guide", "published")

	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/articles?search=Go", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "Go Programming") {
		t.Fatalf("body should contain Go article: %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "Rust Programming") {
		t.Fatalf("body should not contain Rust article: %s", rec.Body.String())
	}
}

func TestHandlerAdminListReturnsAllStatuses(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "published-one", "Published One", "published")
	seedArticle(t, db, "draft-one", "Draft One", "draft")

	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/articles", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "Published One") {
		t.Fatalf("body should contain published article: %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "Draft One") {
		t.Fatalf("body should contain draft article: %s", rec.Body.String())
	}
}

func TestHandlerListEmptyResult(t *testing.T) {
	db := openContentTestDB(t)
	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/articles", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"items":[]`) {
		t.Fatalf("body should contain empty items: %s", rec.Body.String())
	}
}

func newContentTestRouterWithDB(t *testing.T, db *sql.DB) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	handler := NewHandler(NewRepository(db))
	handler.RegisterPublicRoutes(router.Group("/api"))
	handler.RegisterAdminRoutes(router.Group("/api/admin"))
	return router
}
