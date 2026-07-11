package content

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.GET("/articles", h.list)
	group.GET("/articles/:slug", h.detail)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/articles", h.adminList)
	group.POST("/articles", h.create)
	group.PUT("/articles/:id", h.update)
	group.DELETE("/articles/:id", h.delete)
}

func (h *Handler) list(c *gin.Context) {
	filter := parseListFilter(c)
	filter.Status = StatusPublished

	result, err := h.repo.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) adminList(c *gin.Context) {
	filter := parseListFilter(c)

	result, err := h.repo.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) detail(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "slug is required"})
		return
	}

	article, err := h.repo.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, errorResponse{Error: "article not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	if article.Status != StatusPublished {
		c.JSON(http.StatusNotFound, errorResponse{Error: "article not found"})
		return
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) create(c *gin.Context) {
	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "invalid request body"})
		return
	}

	article, err := h.repo.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, article.Detail())
}

func (h *Handler) update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "invalid article id"})
		return
	}

	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "invalid request body"})
		return
	}

	article, err := h.repo.Update(c.Request.Context(), id, input)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, errorResponse{Error: "article not found"})
			return
		}
		c.JSON(http.StatusBadRequest, errorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, article.Detail())
}

func (h *Handler) delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "invalid article id"})
		return
	}

	if err := h.repo.SoftDelete(c.Request.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, errorResponse{Error: "article not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
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
