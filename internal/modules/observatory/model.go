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

type Note struct {
	ID          int64
	PublicID    string
	Title       string
	ContentMD   string
	ContentHTML string
	Tags        []string
	NoteType    NoteType
	Status      NoteStatus
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type NoteListItem struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Tags        []string   `json:"tags"`
	NoteType    string     `json:"note_type"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type NoteDetail struct {
	NoteListItem
	ContentMD   string `json:"content_md"`
	ContentHTML string `json:"content_html"`
}

type ListFilter struct {
	Status   NoteStatus
	NoteType NoteType
	Search   string
	Page     int
	PageSize int
}

type ListResult struct {
	Items      []NoteListItem `json:"items"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

type CreateInput struct {
	Title     string   `json:"title"`
	ContentMD string   `json:"content_md"`
	Tags      []string `json:"tags"`
	NoteType  string   `json:"note_type"`
	Status    string   `json:"status"`
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
		ID:        n.ID,
		Title:     n.Title,
		Tags:      n.Tags,
		NoteType:  string(n.NoteType),
		Status:    string(n.Status),
		CreatedAt: n.CreatedAt,
		UpdatedAt: n.UpdatedAt,
	}
}

func (n Note) Detail() NoteDetail {
	return NoteDetail{
		NoteListItem: n.ListItem(),
		ContentMD:    n.ContentMD,
		ContentHTML:  n.ContentHTML,
	}
}

func (i CreateInput) Validate() error {
	title := strings.TrimSpace(i.Title)
	if title == "" {
		return errors.New("title is required")
	}
	if utf8.RuneCountInString(title) > 200 {
		return errors.New("title must not exceed 200 characters")
	}
	if utf8.RuneCountInString(i.ContentMD) > 10000 {
		return errors.New("content must not exceed 10000 characters")
	}
	if i.NoteType != "" {
		switch NoteType(i.NoteType) {
		case NoteTypeFragment, NoteTypeFailure, NoteTypeIdea, NoteTypeToolIdea, NoteTypeTechDebt:
		default:
			return fmt.Errorf("invalid note_type %q", i.NoteType)
		}
	}
	if i.Status != "" {
		switch NoteStatus(i.Status) {
		case NoteStatusActive, NoteStatusResolved, NoteStatusAbandoned:
		default:
			return fmt.Errorf("invalid status %q", i.Status)
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
