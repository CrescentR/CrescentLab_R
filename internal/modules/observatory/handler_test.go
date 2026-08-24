package observatory

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

func TestPublicListOmitsPrivateNotes(t *testing.T) {
	router, repo := newObservatoryTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{
		Title: "私有记录", Status: "active", NoteType: "fragment",
	}, "")
	if err != nil {
		t.Fatal(err)
	}
	_, err = repo.Create(context.Background(), CreateInput{
		Title:       "公开失败",
		Question:    "对象存储能否替换本地上传？",
		Observation: "默认策略写入云端后，站内地址可以回读。",
		Conclusion:  "媒体不再落本地磁盘。",
		NoteType:    "failure",
		Status:      "resolved",
		Visibility:  "public",
	}, "")
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/observatory", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "公开失败") {
		t.Fatalf("public list missing public note: %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "私有记录") {
		t.Fatalf("public list leaked private note: %s", rec.Body.String())
	}
}

func TestCreatePublicNoteRequiresObservation(t *testing.T) {
	router, _ := newObservatoryTestRouter(t)
	body := `{"title":"半成品","visibility":"public","question":"只有问题"}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/observatory", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("POST status = %d, want 400, body = %s", rec.Code, rec.Body.String())
	}
}

func TestAdminListReturnsPrivateNotes(t *testing.T) {
	router, repo := newObservatoryTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{Title: "草稿观察"}, "")
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/admin/observatory", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "草稿观察") {
		t.Fatalf("admin list missing private note: %s", rec.Body.String())
	}
}

func TestFeaturedPublicNoteSortsFirst(t *testing.T) {
	router, repo := newObservatoryTestRouter(t)
	_, err := repo.Create(context.Background(), CreateInput{
		Title: "普通公开", Question: "问题 A", Observation: "观察 A", Conclusion: "结论 A", Visibility: "public",
	}, "")
	if err != nil {
		t.Fatal(err)
	}
	_, err = repo.Create(context.Background(), CreateInput{
		Title: "精选公开", Question: "问题 B", Observation: "观察 B", Conclusion: "结论 B", Visibility: "public", IsFeatured: true,
	}, "")
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/observatory", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", rec.Code, rec.Body.String())
	}

	var result ListResult
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Items) != 2 || result.Items[0].Title != "精选公开" || !result.Items[0].IsFeatured {
		t.Fatalf("featured note should sort first: %+v", result.Items)
	}
}

func newObservatoryTestRouter(t *testing.T) (*gin.Engine, *Repository) {
	t.Helper()
	gin.SetMode(gin.ReleaseMode)
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "observatory.db"))
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
