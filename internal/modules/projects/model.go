package projects

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

type ProjectStatus string

const (
	ProjectStatusDraft     ProjectStatus = "draft"
	ProjectStatusPublished ProjectStatus = "published"
)

type EditorialFields struct {
	Phase           string `json:"phase"`
	Goal            string `json:"goal"`
	Boundary        string `json:"boundary"`
	CurrentWork     string `json:"current_work"`
	ProgressPercent *int   `json:"progress_percent"`
	ClosureKind     string `json:"closure_kind"`
	ClosureReason   string `json:"closure_reason"`
}

type Project struct {
	EditorialFields
	ID           int64
	PublicID     sql.NullString
	OwnerID      sql.NullInt64
	Name         string
	Slug         string
	Tagline      sql.NullString
	Description  string
	ContentMD    string
	ContentHTML  string
	SourceFormat string
	CoverURL     sql.NullString
	RepoURL      sql.NullString
	DemoURL      sql.NullString
	Status       ProjectStatus
	TechStack    []string
	SortOrder    int
	ViewCount    int64
	PublishedAt  sql.NullTime
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    sql.NullTime
}

type ProjectListItem struct {
	EditorialFields
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Tagline     string     `json:"tagline"`
	Status      string     `json:"status"`
	CoverURL    string     `json:"cover_url"`
	RepoURL     string     `json:"repo_url"`
	DemoURL     string     `json:"demo_url"`
	TechStack   []string   `json:"tech_stack"`
	ViewCount   int64      `json:"view_count"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type ProjectDetail struct {
	ProjectListItem
	Description  string `json:"description"`
	ContentMD    string `json:"content_md"`
	ContentHTML  string `json:"content_html"`
	SourceFormat string `json:"source_format"`
}

// RelatedRecord is a compact view of an article or note linked to a project.
type RelatedRecord struct {
	ID         int64     `json:"id"`
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Status     string    `json:"status"`
	Visibility string    `json:"visibility"`
	Date       time.Time `json:"date"`
}

type RelatedRecords struct {
	Articles []RelatedRecord `json:"articles"`
	Notes    []RelatedRecord `json:"notes"`
}

type ListFilter struct {
	Public   bool
	Status   ProjectStatus
	Search   string
	Page     int
	PageSize int
}

type ListResult struct {
	Items      []ProjectListItem `json:"items"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
	TotalPages int               `json:"total_pages"`
}

type CreateInput struct {
	EditorialFields
	Name         string   `json:"name"`
	Slug         string   `json:"slug"`
	Tagline      string   `json:"tagline"`
	Description  string   `json:"description"`
	ContentHTML  string   `json:"content_html"`
	CoverURL     string   `json:"cover_url"`
	RepoURL      string   `json:"repo_url"`
	DemoURL      string   `json:"demo_url"`
	Status       string   `json:"status"`
	SourceFormat string   `json:"source_format"`
	ContentMD    string   `json:"content_md"`
	TechStack    []string `json:"tech_stack"`
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

func (p Project) Detail() ProjectDetail {
	return ProjectDetail{
		ProjectListItem: p.ListItem(),
		Description:     p.Description,
		ContentMD:       p.ContentMD,
		ContentHTML:     p.ContentHTML,
		SourceFormat:    p.SourceFormat,
	}
}

func (p Project) ListItem() ProjectListItem {
	item := ProjectListItem{
		EditorialFields: p.EditorialFields,
		ID:              p.ID,
		Name:            p.Name,
		Slug:            p.Slug,
		Status:          string(p.Status),
		TechStack:       p.TechStack,
		ViewCount:       p.ViewCount,
		CreatedAt:       p.CreatedAt,
		UpdatedAt:       p.UpdatedAt,
	}
	if p.Tagline.Valid {
		item.Tagline = p.Tagline.String
	}
	if p.CoverURL.Valid {
		item.CoverURL = p.CoverURL.String
	}
	if p.RepoURL.Valid {
		item.RepoURL = p.RepoURL.String
	}
	if p.DemoURL.Valid {
		item.DemoURL = p.DemoURL.String
	}
	if p.PublishedAt.Valid {
		t := p.PublishedAt.Time
		item.PublishedAt = &t
	}
	return item
}

func (i CreateInput) Validate() error {
	if i.Status == "published" && i.Phase == "" {
		return errors.New("公开项目必须填写月相阶段")
	}

	switch i.Phase {
	case "", "research", "building", "live", "waning":
	default:
		return errors.New("invalid phase")
	}
	if i.ProgressPercent != nil && (*i.ProgressPercent < 0 || *i.ProgressPercent > 100) {
		return errors.New("progress_percent must be between 0 and 100")
	}
	if i.ClosureKind != "" && i.ClosureKind != "archived" && i.ClosureKind != "abandoned" {
		return errors.New("invalid closure_kind")
	}
	if i.Phase == "waning" && (i.ClosureKind == "" || strings.TrimSpace(i.ClosureReason) == "") {
		return errors.New("waning projects require closure_kind and closure_reason")
	}
	if i.Phase != "waning" && (i.ClosureKind != "" || i.ClosureReason != "") {
		return errors.New("closure fields require waning phase")
	}
	for _, value := range []string{i.Goal, i.Boundary, i.CurrentWork, i.ClosureReason} {
		if utf8.RuneCountInString(value) > 1000 {
			return errors.New("project editorial text must not exceed 1000 characters")
		}
	}

	name := strings.TrimSpace(i.Name)
	if name == "" {
		return errors.New("name is required")
	}
	if utf8.RuneCountInString(name) > 100 {
		return errors.New("name must not exceed 100 characters")
	}
	if i.Slug == "" {
		return errors.New("slug is required")
	}
	if !slugPattern.MatchString(i.Slug) {
		return errors.New("slug must contain only lowercase letters, numbers, and hyphens")
	}
	if utf8.RuneCountInString(i.Description) > 1000 {
		return errors.New("description must not exceed 1000 characters")
	}
	if i.CoverURL != "" {
		if err := validateURL(i.CoverURL); err != nil {
			return fmt.Errorf("cover_url: %w", err)
		}
	}
	if i.RepoURL != "" {
		if err := validateURL(i.RepoURL); err != nil {
			return fmt.Errorf("repo_url: %w", err)
		}
	}
	if i.DemoURL != "" {
		if err := validateURL(i.DemoURL); err != nil {
			return fmt.Errorf("demo_url: %w", err)
		}
	}
	if i.Status != "" {
		switch ProjectStatus(i.Status) {
		case ProjectStatusDraft, ProjectStatusPublished:
		default:
			return fmt.Errorf("invalid status %q", i.Status)
		}
	}
	if i.SourceFormat != "" {
		switch i.SourceFormat {
		case "markdown", "mdx", "tiptap", "html":
		default:
			return fmt.Errorf("invalid source_format %q", i.SourceFormat)
		}
	}
	return nil
}

func validateURL(raw string) error {
	parsedURL, err := url.ParseRequestURI(raw)
	isAbsoluteHTTP := err == nil && parsedURL.Host != "" && (parsedURL.Scheme == "http" || parsedURL.Scheme == "https")
	isRootRelative := err == nil && parsedURL.Host == "" && parsedURL.Scheme == "" && strings.HasPrefix(parsedURL.Path, "/")
	if !isAbsoluteHTTP && !isRootRelative {
		return errors.New("must be an HTTP, HTTPS, or root-relative URL")
	}
	return nil
}
