package builds

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	platformhttp "CrescentLab_R/internal/platform/http"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.GET("/builds", h.publicList)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/builds", h.adminList)
	group.GET("/builds/detail", h.adminDetail)
	group.POST("/builds", h.create)
	group.POST("/builds/update", h.update)
	group.POST("/builds/assign", h.assign)
	group.POST("/builds/delete", h.delete)
}

func (h *Handler) publicList(c *gin.Context) {
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

func (h *Handler) adminDetail(c *gin.Context) {
	id, err := strconv.ParseInt(c.Query("id"), 10, 64)
	if err != nil || id < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid build id"))
		return
	}
	item, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("build not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, item.ListItem())
}

func (h *Handler) create(c *gin.Context) {
	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if err := input.Validate(); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError(err.Error()))
		return
	}
	item, err := h.repo.Create(c.Request.Context(), input)
	if err != nil {
		writeMutationError(c, err)
		return
	}
	c.JSON(http.StatusCreated, item.ListItem())
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
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid build id"))
		return
	}
	if err := input.CreateInput.Validate(); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError(err.Error()))
		return
	}
	item, err := h.repo.Update(c.Request.Context(), input.ID, input.CreateInput)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("build not found"))
			return
		}
		writeMutationError(c, err)
		return
	}
	c.JSON(http.StatusOK, item.ListItem())
}

func (h *Handler) assign(c *gin.Context) {
	var input struct {
		ID        int64 `json:"id"`
		ProjectID int64 `json:"project_id"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid build id"))
		return
	}
	item, err := h.repo.AssignProject(c.Request.Context(), input.ID, input.ProjectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("build not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, item.ListItem())
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
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid build id"))
		return
	}
	if err := h.repo.SoftDelete(c.Request.Context(), input.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("build not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func writeMutationError(c *gin.Context, err error) {
	if errors.Is(err, ErrSlugConflict) {
		platformhttp.WriteError(c, platformhttp.Conflict("slug already exists"))
		return
	}
	platformhttp.WriteError(c, err)
}

func parseListFilter(c *gin.Context) ListFilter {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	var projectID *int64
	if id, err := strconv.ParseInt(c.Query("project_id"), 10, 64); err == nil {
		projectID = &id
	}
	return ListFilter{
		ProjectID:  projectID,
		Unassigned: c.Query("unassigned") == "true",
		Status:     Status(c.Query("status")),
		Search:     c.Query("search"),
		Page:       page,
		PageSize:   pageSize,
	}
}
