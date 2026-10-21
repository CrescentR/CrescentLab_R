package observatory

import (
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"
)

type NoteType string

const (
	NoteTypeFragment NoteType = "fragment"
	NoteTypeFailure  NoteType = "failure"
	NoteTypeIdea     NoteType = "idea"
	NoteTypeToolIdea NoteType = "tool_idea"
	NoteTypeTechDebt NoteType = "tech_debt"
)

type NoteStatus string

const (
	NoteStatusActive    NoteStatus = "active"
	NoteStatusResolved  NoteStatus = "resolved"
	NoteStatusAbandoned NoteStatus = "abandoned"
)

type NoteVisibility string

const (
	NoteVisibilityPrivate NoteVisibility = "private"
	NoteVisibilityPublic  NoteVisibility = "public"
)

type Note struct {
	ProjectID   *int64 `json:"project_id"`
	ID          int64
	PublicID    string
	Title       string
	ContentMD   string
	ContentHTML string
	Question    string
	Observation string
	Conclusion  string
	NextStep    string
	Tags        []string
	NoteType    NoteType
	Status      NoteStatus
	Visibility  NoteVisibility
	IsFeatured  bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type NoteListItem struct {
	ProjectID   *int64    `json:"project_id"`
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Question    string    `json:"question"`
	Observation string    `json:"observation"`
	Conclusion  string    `json:"conclusion"`
	NextStep    string    `json:"next_step"`
	Tags        []string  `json:"tags"`
	NoteType    string    `json:"note_type"`
	Status      string    `json:"status"`
	Visibility  string    `json:"visibility"`
	IsFeatured  bool      `json:"is_featured"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type NoteDetail struct {
	NoteListItem
	ContentMD   string `json:"content_md"`
	ContentHTML string `json:"content_html"`
}

type ListFilter struct {
	Status     NoteStatus
	NoteType   NoteType
	Visibility NoteVisibility
	Search     string
	Page       int
	PageSize   int
}

type ListResult struct {
	Items      []NoteListItem `json:"items"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

type CreateInput struct {
	ProjectID   *int64   `json:"project_id"`
	Title       string   `json:"title"`
	ContentMD   string   `json:"content_md"`
	Question    string   `json:"question"`
	Observation string   `json:"observation"`
	Conclusion  string   `json:"conclusion"`
	NextStep    string   `json:"next_step"`
	Tags        []string `json:"tags"`
	NoteType    string   `json:"note_type"`
	Status      string   `json:"status"`
	Visibility  string   `json:"visibility"`
	IsFeatured  bool     `json:"is_featured"`
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

func (n Note) ListItem() NoteListItem {
	return NoteListItem{
		ProjectID:   n.ProjectID,
		ID:          n.ID,
		Title:       n.Title,
		Question:    n.Question,
		Observation: n.Observation,
		Conclusion:  n.Conclusion,
		NextStep:    n.NextStep,
		Tags:        n.Tags,
		NoteType:    string(n.NoteType),
		Status:      string(n.Status),
		Visibility:  string(n.Visibility),
		IsFeatured:  n.IsFeatured,
		CreatedAt:   n.CreatedAt,
		UpdatedAt:   n.UpdatedAt,
	}
}

func (n Note) Detail() NoteDetail {
	return NoteDetail{
		NoteListItem: n.ListItem(),
		ContentMD:    n.ContentMD,
		ContentHTML:  n.ContentHTML,
	}
}

func (i *CreateInput) normalize() {
	i.Title = strings.TrimSpace(i.Title)
	i.ContentMD = strings.TrimSpace(i.ContentMD)
	i.Question = strings.TrimSpace(i.Question)
	i.Observation = strings.TrimSpace(i.Observation)
	i.Conclusion = strings.TrimSpace(i.Conclusion)
	i.NextStep = strings.TrimSpace(i.NextStep)
	i.NoteType = strings.TrimSpace(i.NoteType)
	i.Status = strings.TrimSpace(i.Status)
	i.Visibility = strings.TrimSpace(i.Visibility)
	if i.NoteType == "" {
		i.NoteType = string(NoteTypeFragment)
	}
	if i.Status == "" {
		i.Status = string(NoteStatusActive)
	}
	if i.IsFeatured {
		i.Visibility = string(NoteVisibilityPublic)
	}
	if i.Visibility == "" {
		i.Visibility = string(NoteVisibilityPrivate)
	}
}

func (i *CreateInput) Validate() error {
	if i == nil {
		return errors.New("title is required")
	}
	i.normalize()
	if i.Title == "" {
		return errors.New("title is required")
	}
	if utf8.RuneCountInString(i.Title) > 200 {
		return errors.New("title must not exceed 200 characters")
	}
	if utf8.RuneCountInString(i.ContentMD) > 10000 {
		return errors.New("content must not exceed 10000 characters")
	}
	for _, field := range []struct {
		name  string
		value string
	}{
		{"question", i.Question},
		{"observation", i.Observation},
		{"conclusion", i.Conclusion},
		{"next_step", i.NextStep},
	} {
		if utf8.RuneCountInString(field.value) > 500 {
			return fmt.Errorf("%s must not exceed 500 characters", field.name)
		}
	}
	switch NoteType(i.NoteType) {
	case NoteTypeFragment, NoteTypeFailure, NoteTypeIdea, NoteTypeToolIdea, NoteTypeTechDebt:
	default:
		return fmt.Errorf("invalid note_type %q", i.NoteType)
	}
	switch NoteStatus(i.Status) {
	case NoteStatusActive, NoteStatusResolved, NoteStatusAbandoned:
	default:
		return fmt.Errorf("invalid status %q", i.Status)
	}
	switch NoteVisibility(i.Visibility) {
	case NoteVisibilityPrivate, NoteVisibilityPublic:
	default:
		return fmt.Errorf("invalid visibility %q", i.Visibility)
	}
	if i.Visibility == string(NoteVisibilityPublic) {
		if i.Question == "" {
			return errors.New("public notes require a question")
		}
		if i.Observation == "" {
			return errors.New("public notes require an observation")
		}
		if i.Conclusion == "" && i.NextStep == "" {
			return errors.New("public notes require a conclusion or next step")
		}
	}
	if len(i.Tags) > 10 {
		return errors.New("tags must not exceed 10 items")
	}
	for _, tag := range i.Tags {
		if utf8.RuneCountInString(tag) > 30 {
			return fmt.Errorf("tag %q must not exceed 30 characters", tag)
		}
	}
	return nil
}
