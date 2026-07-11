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

func TestHandlerDetailReturnsPublishedArticle(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "my-post", "My Post", "published")

	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/articles/my-post", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "My Post") {
		t.Fatalf("body should contain article title: %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"content_md"`) {
		t.Fatalf("body should contain content_md field: %s", rec.Body.String())
	}
}

func TestHandlerDetailNotFound(t *testing.T) {
	db := openContentTestDB(t)
	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/articles/nonexistent", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("GET status = %d, want 404, body = %s", rec.Code, rec.Body.String())
	}
}

func TestHandlerDetailHidesDraftFromPublic(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "draft-post", "Draft Post", "draft")

	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodGet, "/api/articles/draft-post", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("GET status = %d, want 404 (draft hidden), body = %s", rec.Code, rec.Body.String())
	}
}

func TestHandlerCreateArticle(t *testing.T) {
	db := openContentTestDB(t)
	router := newContentTestRouterWithDB(t, db)

	body := `{"title":"New Post","slug":"new-post","content_md":"# Hello"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/articles", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("POST status = %d, want 201, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "New Post") {
		t.Fatalf("body should contain article title: %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"draft"`) {
		t.Fatalf("body should contain default status draft: %s", rec.Body.String())
	}
}

func TestHandlerCreateValidationFails(t *testing.T) {
	db := openContentTestDB(t)
	router := newContentTestRouterWithDB(t, db)

	tests := []struct {
		name string
		body string
	}{
		{"empty title", `{"slug":"test"}`},
		{"empty slug", `{"title":"Test"}`},
		{"invalid json", `not json`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/admin/articles", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("POST status = %d, want 400 for %s, body = %s", rec.Code, tt.name, rec.Body.String())
			}
		})
	}
}

func TestHandlerCreateDuplicateSlug(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "duplicate-slug", "First", "published")
	router := newContentTestRouterWithDB(t, db)

	body := `{"title":"Second","slug":"duplicate-slug"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/articles", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("POST status = %d, want 400 for duplicate slug, body = %s", rec.Code, rec.Body.String())
	}
}

func TestHandlerUpdateArticle(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "old-post", "Old Post", "draft")
	router := newContentTestRouterWithDB(t, db)

	body := `{"title":"Updated Post","slug":"updated-post","content_md":"# Updated","status":"published"}`
	req := httptest.NewRequest(http.MethodPut, "/api/admin/articles/1", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("PUT status = %d, want 200, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"title":"Updated Post"`) || !strings.Contains(rec.Body.String(), `"status":"published"`) {
		t.Fatalf("body should contain updated article: %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), `"published_at":null`) {
		t.Fatalf("published_at should be set: %s", rec.Body.String())
	}
}

func TestHandlerUpdateValidationFails(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "post", "Post", "draft")
	router := newContentTestRouterWithDB(t, db)

	for _, body := range []string{`{"slug":"post"}`, `not json`} {
		req := httptest.NewRequest(http.MethodPut, "/api/admin/articles/1", strings.NewReader(body))
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("PUT status = %d, want 400, body = %s", rec.Code, rec.Body.String())
		}
	}
}

func TestHandlerUpdateNotFound(t *testing.T) {
	db := openContentTestDB(t)
	seedDeletedArticle(t, db, "deleted", "Deleted", "draft")
	router := newContentTestRouterWithDB(t, db)

	for _, path := range []string{"/api/admin/articles/1", "/api/admin/articles/999"} {
		req := httptest.NewRequest(http.MethodPut, path, strings.NewReader(`{"title":"Updated","slug":"updated"}`))
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("PUT %s status = %d, want 404, body = %s", path, rec.Code, rec.Body.String())
		}
	}
}

func TestHandlerDeleteArticle(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "post", "Post", "published")
	router := newContentTestRouterWithDB(t, db)

	req := httptest.NewRequest(http.MethodDelete, "/api/admin/articles/1", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("DELETE status = %d, want 204, body = %s", rec.Code, rec.Body.String())
	}
	var deletedAt sql.NullTime
	if err := db.QueryRow("SELECT deleted_at FROM articles WHERE id = 1").Scan(&deletedAt); err != nil {
		t.Fatalf("query deleted article: %v", err)
	}
	if !deletedAt.Valid {
		t.Fatal("deleted_at should be set")
	}
}

func TestHandlerDeleteNotFound(t *testing.T) {
	db := openContentTestDB(t)
	seedDeletedArticle(t, db, "deleted", "Deleted", "draft")
	router := newContentTestRouterWithDB(t, db)

	for _, path := range []string{"/api/admin/articles/1", "/api/admin/articles/999"} {
		req := httptest.NewRequest(http.MethodDelete, path, nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("DELETE %s status = %d, want 404, body = %s", path, rec.Code, rec.Body.String())
		}
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
