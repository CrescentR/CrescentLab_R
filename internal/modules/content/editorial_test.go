package content

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestArticleRevisionAndProjectAssociationRoundTrip(t *testing.T) {
	db := openContentTestDB(t)
	if _, err := db.Exec("CREATE TABLE projects (id INTEGER PRIMARY KEY, deleted_at DATETIME); INSERT INTO projects (id) VALUES (7)"); err != nil {
		t.Fatal(err)
	}
	id := int64(7)
	input := CreateInput{Title: "可修订的长文", Slug: "revision-note", Status: "published", ProjectID: &id, TitleEmphasis: "修订", Revisions: []Revision{{Date: "2026-10-21", Summary: "更正原有结论"}}}
	repo := NewRepository(db)
	article, err := repo.Create(context.Background(), input)
	if err != nil {
		t.Fatal(err)
	}
	if article.ProjectID == nil || *article.ProjectID != 7 || len(article.Revisions) != 1 || article.Revisions[0].Summary != "更正原有结论" || article.TitleEmphasis != "修订" {
		t.Fatalf("lost editorial data: %+v", article)
	}
	missing := int64(99)
	input.ProjectID = &missing
	if _, err = repo.Update(context.Background(), article.ID, input); err == nil {
		t.Fatal("nonexistent project association accepted")
	}
	input.ProjectID = nil
	input.TitleEmphasis = "不存在的短语"
	if err = input.Validate(); err == nil {
		t.Fatal("title emphasis must be an exact phrase")
	}
	input.TitleEmphasis = ""
	input.Revisions[0].Date = "2026-02-30"
	if err = input.Validate(); err == nil {
		t.Fatal("invalid revision date accepted")
	}
}

func TestPublicNotesDoNotExposePrivateArticles(t *testing.T) {
	db := openContentTestDB(t)
	seedArticle(t, db, "private-note", "私有文章不可公开", "published")
	if _, err := db.Exec("UPDATE articles SET visibility = 'private' WHERE slug = 'private-note'"); err != nil {
		t.Fatal(err)
	}
	router := newContentTestRouterWithDB(t, db)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/articles", nil))
	if rec.Code != 200 || strings.Contains(rec.Body.String(), "私有文章不可公开") {
		t.Fatalf("private list leaked: %d %s", rec.Code, rec.Body.String())
	}
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/articles/private-note", nil))
	if rec.Code != 404 {
		t.Fatalf("private detail status: %d", rec.Code)
	}
}
