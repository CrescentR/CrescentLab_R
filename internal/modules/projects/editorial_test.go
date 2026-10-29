package projects

import (
	"context"
	"database/sql"
	"encoding/json"
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
	_, err = repo.Create(context.Background(), CreateInput{Name: "已放弃项目", Slug: "closed-project", Status: "published", EditorialFields: EditorialFields{Phase: "waning", ClosureKind: "abandoned", ClosureReason: "验证后不再投入"}}, "")
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
	if err := (CreateInput{Name: "项目", Slug: "project", Status: "archived", EditorialFields: EditorialFields{Phase: "waning", ClosureKind: "archived", ClosureReason: "结束"}}).Validate(); err == nil {
		t.Fatal("archived is no longer a visibility status; closure lives in the waning phase")
	}
}

func TestAdminRelatedListsLinkedArticlesAndNotesIncludingDrafts(t *testing.T) {
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "related.db"))
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
	for _, statement := range []string{
		"INSERT INTO projects (id, name, slug) VALUES (1, '线索', 'thread'), (2, '别的项目', 'other')",
		"INSERT INTO articles (title, slug, status, visibility, project_id, published_at, created_at) VALUES ('旧长文', 'old', 'published', 'public', 1, '2026-09-01 10:00:00', '2026-08-01 10:00:00'), ('新草稿', 'draft', 'draft', 'public', 1, NULL, '2026-10-01 10:00:00'), ('无关长文', 'other', 'published', 'public', 2, NULL, '2026-10-02 10:00:00')",
		"INSERT INTO observatory_notes (title, visibility, project_id, created_at) VALUES ('私有札记', 'private', 1, '2026-09-15 10:00:00')",
	} {
		if _, err := db.Exec(statement); err != nil {
			t.Fatal(err)
		}
	}
	router := gin.New()
	NewHandler(NewRepository(db)).RegisterAdminRoutes(router.Group("/api/admin"))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/admin/projects/related?id=1", nil))
	var related RelatedRecords
	if err := json.Unmarshal(rec.Body.Bytes(), &related); err != nil || rec.Code != http.StatusOK {
		t.Fatalf("related: %d %s %v", rec.Code, rec.Body.String(), err)
	}
	if len(related.Articles) != 2 || related.Articles[0].Title != "新草稿" || related.Articles[1].Date.Month() != 9 {
		t.Fatalf("articles should include drafts, newest first, dated by publication: %+v", related.Articles)
	}
	if len(related.Notes) != 1 || related.Notes[0].Visibility != "private" {
		t.Fatalf("notes should include private items: %+v", related.Notes)
	}
}
