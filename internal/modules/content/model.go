package content

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

type ArticleStatus string

const (
	StatusDraft     ArticleStatus = "draft"
	StatusPublished ArticleStatus = "published"
	StatusArchived  ArticleStatus = "archived"
	StatusScheduled ArticleStatus = "scheduled"
)

type Article struct {
	ID                 int64
	PublicID           string
	OwnerID            sql.NullInt64
	CategoryID         sql.NullInt64
	Title              string
	Slug               string
	Excerpt            sql.NullString
	ContentMD          string
	ContentHTML        string
	CoverURL           sql.NullString
	Status             ArticleStatus
	Visibility         string
	SourceFormat       string
	AllowComment       bool
	IsPinned           bool
	PinSort            int
	HomeSort           int
	ViewCount          int64
	CommentCount       int
	WordCount          int
	ReadingTimeMinutes int
	PublishedAt        sql.NullTime
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeletedAt          sql.NullTime
}

type ArticleListItem struct {
	ID                 int64      `json:"id"`
	PublicID           string     `json:"public_id"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	Excerpt            string     `json:"excerpt"`
	CoverURL           string     `json:"cover_url"`
	Status             string     `json:"status"`
	IsPinned           bool       `json:"is_pinned"`
	ViewCount          int64      `json:"view_count"`
	CommentCount       int        `json:"comment_count"`
	ReadingTimeMinutes int        `json:"reading_time_minutes"`
	PublishedAt        *time.Time `json:"published_at"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type ListFilter struct {
	Status   ArticleStatus
	Category string
	Search   string
	Page     int
	PageSize int
}

type ListResult struct {
	Items      []ArticleListItem `json:"items"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
	TotalPages int               `json:"total_pages"`
}

func (f ListFilter) normalizedPage() int {
	if f.Page < 1 {
		return 1
	}
	return f.Page
}

func (f ListFilter) normalizedPageSize() int {
	if f.PageSize < 1 || f.PageSize > 50 {
		return 10
	}
	return f.PageSize
}

type ArticleDetail struct {
	ID                 int64      `json:"id"`
	PublicID           string     `json:"public_id"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	Excerpt            string     `json:"excerpt"`
	ContentMD          string     `json:"content_md"`
	ContentHTML        string     `json:"content_html"`
	CoverURL           string     `json:"cover_url"`
	Status             string     `json:"status"`
	Visibility         string     `json:"visibility"`
	SourceFormat       string     `json:"source_format"`
	AllowComment       bool       `json:"allow_comment"`
	IsPinned           bool       `json:"is_pinned"`
	ViewCount          int64      `json:"view_count"`
	CommentCount       int        `json:"comment_count"`
	WordCount          int        `json:"word_count"`
	ReadingTimeMinutes int        `json:"reading_time_minutes"`
	PublishedAt        *time.Time `json:"published_at"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func (a Article) Detail() ArticleDetail {
	detail := ArticleDetail{
		ID:                 a.ID,
		PublicID:           a.PublicID,
		Title:              a.Title,
		Slug:               a.Slug,
		Excerpt:            a.Excerpt.String,
		ContentMD:          a.ContentMD,
		ContentHTML:        a.ContentHTML,
		CoverURL:           a.CoverURL.String,
		Status:             string(a.Status),
		Visibility:         a.Visibility,
		SourceFormat:       a.SourceFormat,
		AllowComment:       a.AllowComment,
		IsPinned:           a.IsPinned,
		ViewCount:          a.ViewCount,
		CommentCount:       a.CommentCount,
		WordCount:          a.WordCount,
		ReadingTimeMinutes: a.ReadingTimeMinutes,
		CreatedAt:          a.CreatedAt,
		UpdatedAt:          a.UpdatedAt,
	}
	if a.PublishedAt.Valid {
		t := a.PublishedAt.Time
		detail.PublishedAt = &t
	}
	return detail
}

type CreateInput struct {
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Excerpt     string `json:"excerpt"`
	ContentMD   string `json:"content_md"`
	CoverURL    string `json:"cover_url"`
	Status      string `json:"status"`
	SourceFormat string `json:"source_format"`
}

func (i CreateInput) Validate() error {
	if strings.TrimSpace(i.Title) == "" {
		return errors.New("title is required")
	}
	if strings.TrimSpace(i.Slug) == "" {
		return errors.New("slug is required")
	}
	if i.Status != "" {
		switch ArticleStatus(i.Status) {
		case StatusDraft, StatusPublished, StatusArchived, StatusScheduled:
		default:
			return fmt.Errorf("invalid status %q", i.Status)
		}
	}
	if i.SourceFormat != "" {
		switch i.SourceFormat {
		case "markdown", "tiptap", "html":
		default:
			return fmt.Errorf("invalid source_format %q", i.SourceFormat)
		}
	}
	return nil
}

type errorResponse struct {
	Error string `json:"error"`
}
