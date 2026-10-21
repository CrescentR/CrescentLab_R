package content

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/microcosm-cc/bluemonday"

	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/shared/editorhtml"
	sharedmarkdown "CrescentLab_R/internal/shared/markdown"
)

type Handler struct {
	repo     *Repository
	renderer *sharedmarkdown.Renderer
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo, renderer: sharedmarkdown.NewRenderer()}
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.GET("/articles", h.list)
	group.GET("/articles/:slug", h.detail)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/articles", h.adminList)
	group.GET("/articles/detail", h.adminDetail)
	group.POST("/articles", h.create)
	group.POST("/articles/preview", h.preview)
	group.POST("/articles/update", h.update)
	group.POST("/articles/publish", h.publish)
	group.POST("/articles/delete", h.delete)
}

func (h *Handler) list(c *gin.Context) {
	filter := parseListFilter(c)
	filter.Status = StatusPublished
	filter.Public = true

	result, err := h.repo.List(c.Request.Context(), filter)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) adminList(c *gin.Context) {
	filter := parseListFilter(c)

	result, err := h.repo.List(c.Request.Context(), filter)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) detail(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		platformhttp.WriteError(c, platformhttp.ValidationError("slug is required"))
		return
	}

	article, err := h.repo.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}

	if article.Status != StatusPublished || article.Visibility != "public" {
		platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
		return
	}
	if strings.TrimSpace(article.ContentHTML) == "" && strings.TrimSpace(article.ContentMD) != "" {
		rendered, renderErr := h.renderer.Render(article.ContentMD)
		if renderErr != nil {
			platformhttp.WriteError(c, renderErr)
			return
		}
		article.ContentHTML = rendered.HTML
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) adminDetail(c *gin.Context) {
	id, err := strconv.ParseInt(c.Query("id"), 10, 64)
	if err != nil || id < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid article id"))
		return
	}

	article, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) create(c *gin.Context) {
	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if err := h.prepareInput(&input); err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	article, err := h.repo.Create(c.Request.Context(), input)
	if err != nil {
		writeArticleMutationError(c, err)
		return
	}

	c.JSON(http.StatusCreated, article.Detail())
}

func (h *Handler) update(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
		CreateInput
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid article id"))
		return
	}
	if err := h.prepareInput(&input.CreateInput); err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	article, err := h.repo.Update(c.Request.Context(), input.ID, input.CreateInput)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
			return
		}
		writeArticleMutationError(c, err)
		return
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) delete(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid article id"))
		return
	}

	if err := h.repo.SoftDelete(c.Request.Context(), input.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) preview(c *gin.Context) {
	var input struct {
		ContentMD    string `json:"content_md"`
		ContentHTML  string `json:"content_html"`
		SourceFormat string `json:"source_format"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}

	contentHTML := input.ContentHTML
	wordCount := 0
	readingTime := 0
	if input.SourceFormat == "tiptap" || input.SourceFormat == "html" {
		contentHTML = editorhtml.Sanitize(contentHTML)
		text := strings.TrimSpace(bluemonday.StrictPolicy().Sanitize(contentHTML))
		wordCount = utf8.RuneCountInString(strings.ReplaceAll(text, " ", ""))
		if wordCount > 0 {
			readingTime = (wordCount + 299) / 300
		}
	} else {
		rendered, err := h.renderer.Render(input.ContentMD)
		if err != nil {
			platformhttp.WriteError(c, err)
			return
		}
		contentHTML, wordCount, readingTime = rendered.HTML, rendered.WordCount, rendered.ReadingTimeMinutes
	}

	c.JSON(http.StatusOK, gin.H{
		"content_html":         contentHTML,
		"word_count":           wordCount,
		"reading_time_minutes": readingTime,
	})
}

func (h *Handler) publish(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
		CreateInput
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid article id"))
		return
	}

	input.CreateInput.Status = string(StatusPublished)
	if err := h.prepareInput(&input.CreateInput); err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	article, err := h.repo.Update(c.Request.Context(), input.ID, input.CreateInput)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
			return
		}
		writeArticleMutationError(c, err)
		return
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) prepareInput(input *CreateInput) error {
	if err := input.Validate(); err != nil {
		return platformhttp.ValidationError(err.Error())
	}

	if input.SourceFormat == "tiptap" || input.SourceFormat == "html" {
		input.ContentHTML = editorhtml.Sanitize(input.ContentHTML)
		text := strings.TrimSpace(bluemonday.StrictPolicy().Sanitize(input.ContentHTML))
		input.WordCount = utf8.RuneCountInString(strings.ReplaceAll(text, " ", ""))
		if input.WordCount > 0 {
			input.ReadingTimeMinutes = (input.WordCount + 299) / 300
		}
		return nil
	}
	rendered, err := h.renderer.Render(input.ContentMD)
	if err != nil {
		return err
	}
	input.ContentHTML = rendered.HTML
	input.WordCount = rendered.WordCount
	input.ReadingTimeMinutes = rendered.ReadingTimeMinutes
	return nil
}

func writeArticleMutationError(c *gin.Context, err error) {
	if errors.Is(err, ErrSlugConflict) {
		platformhttp.WriteError(c, platformhttp.Conflict("slug already exists"))
		return
	}
	platformhttp.WriteError(c, err)
}

func parseListFilter(c *gin.Context) ListFilter {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	return ListFilter{
		Status:   ArticleStatus(c.Query("status")),
		Category: c.Query("category"),
		Search:   c.Query("search"),
		Page:     page,
		PageSize: pageSize,
	}
}
