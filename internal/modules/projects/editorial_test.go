package projects

import (
	"context"
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPublicProjectLifecycleAndPersistence(t *testing.T) {
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "editorial.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	schema, err := os.ReadFile("../../../database/sqlite/schema.sql")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec(string(schema)); err != nil {
		t.Fatal(err)
	}
	repo := NewRepository(db)
	progress := 37
	project, err := repo.Create(context.Background(), CreateInput{
		Name: "构建中的项目", Slug: "building-project", Status: "published",
		EditorialFields: EditorialFields{Phase: "building", Goal: "验证目标", Boundary: "限定边界", CurrentWork: "当前工作", ProgressPercent: &progress},
	}, "")
	if err != nil {
		t.Fatal(err)
	}
	if project.Phase != "building" || project.ProgressPercent == nil || *project.ProgressPercent != progress || project.Goal != "验证目标" {
		t.Fatalf("editorial fields not persisted: %+v", project)
	}
	_, err = repo.Create(context.Background(), CreateInput{Name: "已放弃项目", Slug: "closed-project", Status: "archived", EditorialFields: EditorialFields{Phase: "waning", ClosureKind: "abandoned", ClosureReason: "验证后不再投入"}}, "")
	if err != nil {
		t.Fatal(err)
	}
	_, err = repo.Create(context.Background(), CreateInput{Name: "私有草稿", Slug: "private-draft"}, "")
	if err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	NewHandler(repo).RegisterPublicRoutes(router.Group("/api"))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/projects", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "已放弃项目") || strings.Contains(rec.Body.String(), "私有草稿") {
		t.Fatalf("public lifecycle list: %d %s", rec.Code, rec.Body.String())
	}
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/projects/closed-project", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "验证后不再投入") {
		t.Fatalf("closed detail: %d %s", rec.Code, rec.Body.String())
	}
}

func TestProjectLifecycleRejectsMissingReasonsAndInvalidProgress(t *testing.T) {
	progress := 101
	for _, fields := range []EditorialFields{{Phase: "waning"}, {Phase: "building", ClosureReason: "原因"}, {Phase: "invalid"}, {Phase: "live", ProgressPercent: &progress}} {
		if err := (CreateInput{Name: "项目", Slug: "project", EditorialFields: fields}).Validate(); err == nil {
			t.Fatalf("expected validation failure: %+v", fields)
		}
	}
	if err := (CreateInput{Name: "项目", Slug: "project", Status: "published"}).Validate(); err == nil {
		t.Fatal("publication must not infer a project phase")
	}
}
