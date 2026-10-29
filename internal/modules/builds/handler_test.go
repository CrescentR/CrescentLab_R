package builds

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

func TestPublicListOmitsDrafts(t *testing.T) {
	router, repo, projectID := newBuildsTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{ProjectID: &projectID, Name: "草稿盒", Slug: "draft-box", Stage: "prototype"})
	if err != nil {
		t.Fatal(err)
	}
	_, err = repo.Create(context.Background(), CreateInput{
		ProjectID:      &projectID,
		Name:           "媒体中心",
		Slug:           "media-center",
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

func TestProgressRequiresProjectAndPublishedContent(t *testing.T) {
	router, _, _ := newBuildsTestRouter(t)
	for _, body := range []string{
		`{"name":"无项目","slug":"no-project","stage":"prototype"}`,
		`{"project_id":1,"name":"空壳","slug":"empty-shell","status":"published","stage":"prototype"}`,
	} {
		req := httptest.NewRequest(http.MethodPost, "/api/admin/builds", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("POST %s status = %d, want 400, body = %s", body, rec.Code, rec.Body.String())
		}
	}
}

func TestProgressDateIsKeptOnEditAndListFiltersByProject(t *testing.T) {
	router, repo, projectID := newBuildsTestRouter(t)
	progressedAt := time.Date(2026, 9, 1, 8, 0, 0, 0, time.UTC)
	item, err := repo.Create(context.Background(), CreateInput{ProjectID: &projectID, Name: "接通主链路", Slug: "main-path", LatestProgress: "主链路已接通", Status: "published", ProgressedAt: &progressedAt})
	if err != nil {
		t.Fatal(err)
	}
	updated, err := repo.Update(context.Background(), item.ID, CreateInput{ProjectID: &projectID, Name: "接通主链路", Slug: "main-path", LatestProgress: "主链路已接通，补充说明", Status: "published"})
	if err != nil {
		t.Fatal(err)
	}
	if updated.ProgressedAt == nil || !updated.ProgressedAt.Equal(progressedAt) {
		t.Fatalf("progressed_at changed on edit: %v", updated.ProgressedAt)
	}

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/builds?project_id=999", nil))
	if rec.Code != http.StatusOK || strings.Contains(rec.Body.String(), "接通主链路") {
		t.Fatalf("project filter leaked other project progress: %d %s", rec.Code, rec.Body.String())
	}
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/builds?project_id=1", nil))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "主链路已接通，补充说明") {
		t.Fatalf("project filter missed own progress: %d %s", rec.Code, rec.Body.String())
	}
}

func TestSlugConflictReturns409(t *testing.T) {
	router, repo, projectID := newBuildsTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{ProjectID: &projectID, Name: "第一项", Slug: "same-slug"})
	if err != nil {
		t.Fatal(err)
	}
	body := `{"project_id":1,"name":"第二项","slug":"same-slug","stage":"prototype"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/builds", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusConflict {
		t.Fatalf("POST status = %d, want 409, body = %s", rec.Code, rec.Body.String())
	}
}

func TestAdminListIncludesDrafts(t *testing.T) {
	router, repo, projectID := newBuildsTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{ProjectID: &projectID, Name: "未发布", Slug: "unpublished"})
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

func TestLegacyProgressCanBeListedAndAssignedWithoutRevalidation(t *testing.T) {
	router, repo, projectID := newBuildsTestRouter(t)
	// 旧数据：没有项目、公开但只有 one_liner，按新规则无法通过完整保存。
	if _, err := repo.db.Exec("INSERT INTO builds (name, slug, one_liner, status) VALUES ('旧进展', 'legacy', '只有一句话', 'published')"); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Create(context.Background(), CreateInput{ProjectID: &projectID, Name: "已归属", Slug: "owned"}); err != nil {
		t.Fatal(err)
	}

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/admin/builds?unassigned=true", nil))
	var result ListResult
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil || result.Total != 1 || result.Items[0].Name != "旧进展" {
		t.Fatalf("unassigned list: %d %s", rec.Code, rec.Body.String())
	}

	for body, want := range map[string]int{
		`{"id":` + itoa(result.Items[0].ID) + `,"project_id":999}`: http.StatusBadRequest,
		`{"id":` + itoa(result.Items[0].ID) + `,"project_id":1}`:   http.StatusOK,
	} {
		rec = httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/admin/builds/assign", strings.NewReader(body)))
		if rec.Code != want {
			t.Fatalf("assign %s = %d, want %d: %s", body, rec.Code, want, rec.Body.String())
		}
	}
	assigned, err := repo.GetByID(context.Background(), result.Items[0].ID)
	if err != nil || assigned.ProjectID == nil || *assigned.ProjectID != projectID || assigned.OneLiner != "只有一句话" || assigned.Status != StatusPublished {
		t.Fatalf("assign should only set project_id: %+v %v", assigned, err)
	}
}

func itoa(value int64) string {
	return strconv.FormatInt(value, 10)
}

func newBuildsTestRouter(t *testing.T) (*gin.Engine, *Repository, int64) {
	t.Helper()
	gin.SetMode(gin.ReleaseMode)
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "builds.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	schema, err := os.ReadFile("../../../database/sqlite/schema.sql")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(string(schema)); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec("INSERT INTO projects (id, name, slug) VALUES (1, '进展所属项目', 'progress-owner')"); err != nil {
		t.Fatal(err)
	}
	repo := NewRepository(db, "sqlite")
	router := gin.New()
	handler := NewHandler(repo)
	handler.RegisterPublicRoutes(router.Group("/api"))
	handler.RegisterAdminRoutes(router.Group("/api/admin"))
	return router, repo, 1
}
