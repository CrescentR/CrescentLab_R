package content

import (
	"database/sql"
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

type errorResponse struct {
	Error string `json:"error"`
}
