package observatory

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

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/observatory", h.adminList)
	group.GET("/observatory/detail", h.adminDetail)
	group.POST("/observatory", h.create)
	group.POST("/observatory/update", h.update)
	group.POST("/observatory/delete", h.delete)
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
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid note id"))
		return
	}
	note, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("note not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, note.Detail())
}

func (h *Handler) create(c *gin.Context) {
	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	rendered, err := h.renderContent(input.ContentMD)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	note, err := h.repo.Create(c.Request.Context(), input, rendered)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusCreated, note.Detail())
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
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid note id"))
		return
	}
	rendered, err := h.renderContent(input.ContentMD)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	note, err := h.repo.Update(c.Request.Context(), input.ID, input.CreateInput, rendered)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("note not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, note.Detail())
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
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid note id"))
		return
	}
	if err := h.repo.SoftDelete(c.Request.Context(), input.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("note not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) renderContent(contentMD string) (string, error) {
	if contentMD == "" {
		return "", nil
	}
	rendered, err := h.renderer.Render(contentMD)
	if err != nil {
		return "", err
	}
	return rendered.HTML, nil
}

func parseListFilter(c *gin.Context) ListFilter {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	return ListFilter{
		Status:   NoteStatus(c.Query("status")),
		NoteType: NoteType(c.Query("note_type")),
		Search:   c.Query("search"),
		Page:     page,
		PageSize: pageSize,
	}
}
