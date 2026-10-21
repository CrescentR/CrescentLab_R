package content

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9-]+$`)

type ArticleStatus string

const (
	StatusDraft     ArticleStatus = "draft"
	StatusPublished ArticleStatus = "published"
	StatusArchived  ArticleStatus = "archived"
	StatusScheduled ArticleStatus = "scheduled"
)

type Revision struct {
	Date    string `json:"date"`
	Summary string `json:"summary"`
}

type Article struct {
	TitleEmphasis      string
	ProjectID          *int64
	Revisions          []Revision
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
	TitleEmphasis      string     `json:"title_emphasis"`
	CategoryID         *int64     `json:"category_id"`
	CategoryName       string     `json:"category_name"`
	ProjectID          *int64     `json:"project_id"`
	ID                 int64      `json:"id"`
	PublicID           string     `json:"public_id"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	Excerpt            string     `json:"excerpt"`
	CoverURL           string     `json:"cover_url"`
	Status             string     `json:"status"`
	IsPinned           bool       `json:"is_pinned"`
	PinSort            int        `json:"pin_sort"`
	HomeSort           int        `json:"home_sort"`
	ViewCount          int64      `json:"view_count"`
	CommentCount       int        `json:"comment_count"`
	WordCount          int        `json:"word_count"`
	ReadingTimeMinutes int        `json:"reading_time_minutes"`
	PublishedAt        *time.Time `json:"published_at"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type ListFilter struct {
	Public   bool
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
	TitleEmphasis      string     `json:"title_emphasis"`
	ProjectID          *int64     `json:"project_id"`
	Revisions          []Revision `json:"revisions"`
	ID                 int64      `json:"id"`
	PublicID           string     `json:"public_id"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	CategoryID         *int64     `json:"category_id"`
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
		TitleEmphasis: a.TitleEmphasis,
		ProjectID:     a.ProjectID, Revisions: a.Revisions,
		ID:                 a.ID,
		PublicID:           a.PublicID,
		Title:              a.Title,
		Slug:               a.Slug,
		CategoryID:         nullableInt64(a.CategoryID),
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
	TitleEmphasis      string     `json:"title_emphasis"`
	ProjectID          *int64     `json:"project_id"`
	Revisions          []Revision `json:"revisions"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	CategoryID         *int64     `json:"category_id"`
	Excerpt            string     `json:"excerpt"`
	ContentMD          string     `json:"content_md"`
	CoverURL           string     `json:"cover_url"`
	Status             string     `json:"status"`
	SourceFormat       string     `json:"source_format"`
	ContentHTML        string     `json:"content_html"`
	WordCount          int        `json:"-"`
	ReadingTimeMinutes int        `json:"-"`
}

func nullableInt64(value sql.NullInt64) *int64 {
	if !value.Valid {
		return nil
	}
	return &value.Int64
}

func (i CreateInput) Validate() error {
	if i.TitleEmphasis != "" && !strings.Contains(i.Title, i.TitleEmphasis) {
		return errors.New("title_emphasis must be an exact phrase from title")
	}
	if i.ProjectID != nil && *i.ProjectID < 1 {
		return errors.New("invalid project_id")
	}
	for _, revision := range i.Revisions {
		if _, err := time.Parse("2006-01-02", revision.Date); err != nil {
			return errors.New("revision date must use YYYY-MM-DD")
		}
		if strings.TrimSpace(revision.Summary) == "" || utf8.RuneCountInString(revision.Summary) > 1000 {
			return errors.New("revision summary is required and must not exceed 1000 characters")
		}
	}

	title := strings.TrimSpace(i.Title)
	if title == "" {
		return errors.New("title is required")
	}
	if utf8.RuneCountInString(title) > 200 {
		return errors.New("title must not exceed 200 characters")
	}
	if i.Slug == "" {
		return errors.New("slug is required")
	}
	if !slugPattern.MatchString(i.Slug) {
		return errors.New("slug must contain only lowercase letters, numbers, and hyphens")
	}
	if utf8.RuneCountInString(i.Excerpt) > 500 {
		return errors.New("excerpt must not exceed 500 characters")
	}
	if i.CoverURL != "" {
		parsedURL, err := url.ParseRequestURI(i.CoverURL)
		isAbsoluteHTTP := err == nil && parsedURL.Host != "" && (parsedURL.Scheme == "http" || parsedURL.Scheme == "https")
		isRootRelative := err == nil && parsedURL.Host == "" && parsedURL.Scheme == "" && strings.HasPrefix(parsedURL.Path, "/")
		if !isAbsoluteHTTP && !isRootRelative {
			return errors.New("cover_url must be an HTTP, HTTPS, or root-relative URL")
		}
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
