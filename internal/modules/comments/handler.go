package comments

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

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/comments", h.listPending)
	group.POST("/comments/review", h.review)
}

func (h *Handler) listPending(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Query("article_id"), 10, 64)
	if err != nil {
		articleID = 0
	}
	items, err := h.repo.ListPending(c.Request.Context(), articleID)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) review(c *gin.Context) {
	var input struct {
		ID     int64  `json:"id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil || input.ID < 1 || (input.Status != "approved" && input.Status != "rejected") {
		platformhttp.WriteError(c, platformhttp.ValidationError("评论 ID 或审核状态无效"))
		return
	}
	if err := h.repo.Review(c.Request.Context(), input.ID, input.Status); errors.Is(err, sql.ErrNoRows) {
		platformhttp.WriteError(c, platformhttp.NotFound("待审核评论不存在"))
		return
	} else if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
