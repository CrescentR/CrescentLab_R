package content

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	platformhttp "CrescentLab_R/internal/platform/http"
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
	group.GET("/articles/:id", h.adminDetail)
	group.POST("/articles", h.create)
	group.PUT("/articles/:id", h.update)
	group.DELETE("/articles/:id", h.delete)
}

func (h *Handler) list(c *gin.Context) {
	filter := parseListFilter(c)
	filter.Status = StatusPublished

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

	if article.Status != StatusPublished {
		platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
		return
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) adminDetail(c *gin.Context) {
	id, err := parseArticleID(c)
	if err != nil {
		platformhttp.WriteError(c, err)
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
	id, err := parseArticleID(c)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if err := h.prepareInput(&input); err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	article, err := h.repo.Update(c.Request.Context(), id, input)
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
	id, err := parseArticleID(c)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	if err := h.repo.SoftDelete(c.Request.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("article not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *Handler) prepareInput(input *CreateInput) error {
	if err := input.Validate(); err != nil {
		return platformhttp.ValidationError(err.Error())
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

func parseArticleID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		return 0, platformhttp.ValidationError("invalid article id")
	}
	return id, nil
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
