package builds

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

func TestPublicListOmitsDrafts(t *testing.T) {
	router, repo := newBuildsTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{Name: "草稿盒", Slug: "draft-box", Stage: "prototype"})
	if err != nil {
		t.Fatal(err)
	}
	_, err = repo.Create(context.Background(), CreateInput{
		Name:           "媒体中心",
		Slug:           "media-center",
		OneLiner:       "把图片和视频交给当前云存储策略。",
		Stage:          "development",
		LatestProgress: "上传已走默认策略。",
		NextStep:       "补删除与分页。",
		Status:         "published",
	})
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/builds", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "媒体中心") {
		t.Fatalf("public list missing published build: %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "草稿盒") {
		t.Fatalf("public list leaked draft: %s", rec.Body.String())
	}
}

func TestPublishRequiresOneLiner(t *testing.T) {
	router, _ := newBuildsTestRouter(t)
	body := `{"name":"空壳","slug":"empty-shell","status":"published","stage":"prototype"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/builds", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("POST status = %d, want 400, body = %s", rec.Code, rec.Body.String())
	}
}

func TestSlugConflictReturns409(t *testing.T) {
	router, repo := newBuildsTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{Name: "第一项", Slug: "same-slug"})
	if err != nil {
		t.Fatal(err)
	}
	body := `{"name":"第二项","slug":"same-slug","stage":"prototype"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/builds", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusConflict {
		t.Fatalf("POST status = %d, want 409, body = %s", rec.Code, rec.Body.String())
	}
}

func TestAdminListIncludesDrafts(t *testing.T) {
	router, repo := newBuildsTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{Name: "未发布", Slug: "unpublished"})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/api/admin/builds", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	var result ListResult
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result.Total != 1 || result.Items[0].Name != "未发布" {
		t.Fatalf("admin list should include draft: %+v", result)
	}
}

func newBuildsTestRouter(t *testing.T) (*gin.Engine, *Repository) {
	t.Helper()
	gin.SetMode(gin.ReleaseMode)
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "builds.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	repo := NewRepository(db, "sqlite")
	if err := repo.EnsureSchema(context.Background()); err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	handler := NewHandler(repo)
	handler.RegisterPublicRoutes(router.Group("/api"))
	handler.RegisterAdminRoutes(router.Group("/api/admin"))
	return router, repo
}
