package builds

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9-]+$`)

type Stage string

const (
	StagePrototype   Stage = "prototype"
	StageDevelopment Stage = "development"
	StageValidating  Stage = "validating"
	StageBeta        Stage = "beta"
	StagePaused      Stage = "paused"
)

type Status string

const (
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
	StatusArchived  Status = "archived"
)

type Build struct {
	ProjectID      *int64 `json:"project_id"`
	ID             int64
	Name           string
	Slug           string
	OneLiner       string
	Stage          Stage
	RoundGoal      string
	LatestProgress string
	NextStep       string
	DetailURL      string
	DemoURL        string
	RepoURL        string
	Status         Status
	SortOrder      int
	ProgressedAt   *time.Time
	PublishedAt    *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type BuildListItem struct {
	ProjectID      *int64     `json:"project_id"`
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Slug           string     `json:"slug"`
	OneLiner       string     `json:"one_liner"`
	Stage          string     `json:"stage"`
	RoundGoal      string     `json:"round_goal"`
	LatestProgress string     `json:"latest_progress"`
	NextStep       string     `json:"next_step"`
	DetailURL      string     `json:"detail_url"`
	DemoURL        string     `json:"demo_url"`
	RepoURL        string     `json:"repo_url"`
	Status         string     `json:"status"`
	SortOrder      int        `json:"sort_order"`
	ProgressedAt   *time.Time `json:"progressed_at"`
	PublishedAt    *time.Time `json:"published_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type ListFilter struct {
	Status   Status
	Search   string
	Page     int
	PageSize int
}

type ListResult struct {
	Items      []BuildListItem `json:"items"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

type CreateInput struct {
	ProjectID      *int64 `json:"project_id"`
	Name           string `json:"name"`
	Slug           string `json:"slug"`
	OneLiner       string `json:"one_liner"`
	Stage          string `json:"stage"`
	RoundGoal      string `json:"round_goal"`
	LatestProgress string `json:"latest_progress"`
	NextStep       string `json:"next_step"`
	DetailURL      string `json:"detail_url"`
	DemoURL        string `json:"demo_url"`
	RepoURL        string `json:"repo_url"`
	Status         string `json:"status"`
	SortOrder      int    `json:"sort_order"`
}

func (f ListFilter) normalizedPage() int {
	if f.Page < 1 {
		return 1
	}
	return f.Page
}

func (f ListFilter) normalizedPageSize() int {
	if f.PageSize < 1 || f.PageSize > 50 {
		return 20
	}
	return f.PageSize
}

func (b Build) ListItem() BuildListItem {
	return BuildListItem{
		ProjectID:      b.ProjectID,
		ID:             b.ID,
		Name:           b.Name,
		Slug:           b.Slug,
		OneLiner:       b.OneLiner,
		Stage:          string(b.Stage),
		RoundGoal:      b.RoundGoal,
		LatestProgress: b.LatestProgress,
		NextStep:       b.NextStep,
		DetailURL:      b.DetailURL,
		DemoURL:        b.DemoURL,
		RepoURL:        b.RepoURL,
		Status:         string(b.Status),
		SortOrder:      b.SortOrder,
		ProgressedAt:   b.ProgressedAt,
		PublishedAt:    b.PublishedAt,
		CreatedAt:      b.CreatedAt,
		UpdatedAt:      b.UpdatedAt,
	}
}

func (i *CreateInput) normalize() {
	i.Name = strings.TrimSpace(i.Name)
	i.Slug = strings.TrimSpace(strings.ToLower(i.Slug))
	i.OneLiner = strings.TrimSpace(i.OneLiner)
	i.Stage = strings.TrimSpace(i.Stage)
	i.RoundGoal = strings.TrimSpace(i.RoundGoal)
	i.LatestProgress = strings.TrimSpace(i.LatestProgress)
	i.NextStep = strings.TrimSpace(i.NextStep)
	i.DetailURL = strings.TrimSpace(i.DetailURL)
	i.DemoURL = strings.TrimSpace(i.DemoURL)
	i.RepoURL = strings.TrimSpace(i.RepoURL)
	i.Status = strings.TrimSpace(i.Status)
	if i.Stage == "" {
		i.Stage = string(StagePrototype)
	}
	if i.Status == "" {
		i.Status = string(StatusDraft)
	}
}

func (i *CreateInput) Validate() error {
	if i == nil {
		return errors.New("name is required")
	}
	i.normalize()
	if i.Name == "" {
		return errors.New("name is required")
	}
	if utf8.RuneCountInString(i.Name) > 100 {
		return errors.New("name must not exceed 100 characters")
	}
	if i.Slug == "" {
		return errors.New("slug is required")
	}
	if !slugPattern.MatchString(i.Slug) {
		return errors.New("slug must contain only lowercase letters, numbers, and hyphens")
	}
	if utf8.RuneCountInString(i.OneLiner) > 80 {
		return errors.New("one_liner must not exceed 80 characters")
	}
	for _, field := range []struct {
		name  string
		value string
	}{
		{"round_goal", i.RoundGoal},
		{"latest_progress", i.LatestProgress},
		{"next_step", i.NextStep},
	} {
		if utf8.RuneCountInString(field.value) > 300 {
			return fmt.Errorf("%s must not exceed 300 characters", field.name)
		}
	}
	switch Stage(i.Stage) {
	case StagePrototype, StageDevelopment, StageValidating, StageBeta, StagePaused:
	default:
		return fmt.Errorf("invalid stage %q", i.Stage)
	}
	switch Status(i.Status) {
	case StatusDraft, StatusPublished, StatusArchived:
	default:
		return fmt.Errorf("invalid status %q", i.Status)
	}
	if i.Status == string(StatusPublished) {
		if i.OneLiner == "" {
			return errors.New("published builds require a one-liner")
		}
		if i.LatestProgress == "" && i.NextStep == "" {
			return errors.New("published builds require latest progress or next step")
		}
	}
	for _, field := range []struct {
		name  string
		value string
	}{
		{"detail_url", i.DetailURL},
		{"demo_url", i.DemoURL},
		{"repo_url", i.RepoURL},
	} {
		if field.value == "" {
			continue
		}
		if err := validateURL(field.value); err != nil {
			return fmt.Errorf("%s: %w", field.name, err)
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
