package comments

import (
	"database/sql"
	"encoding/json"
	"errors"
	"html"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"CrescentLab_R/internal/modules/users"
	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/platform/http/middleware"
)

type Handler struct {
	repo     *Repository
	userRepo *users.Repository
}

func NewHandler(repo *Repository, userRepo *users.Repository) *Handler {
	return &Handler{repo: repo, userRepo: userRepo}
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.GET("/comments", h.listApproved)
}

func (h *Handler) RegisterAuthenticatedRoutes(group *gin.RouterGroup) {
	group.POST("/comments", h.create)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/comments", h.listPending)
	group.POST("/comments/review", h.review)
}

func (h *Handler) listApproved(c *gin.Context) { h.list(c, true) }
func (h *Handler) listPending(c *gin.Context)  { h.list(c, false) }

func (h *Handler) list(c *gin.Context, approved bool) {
	articleID, err := strconv.ParseInt(c.Query("article_id"), 10, 64)
	if approved && (err != nil || articleID < 1) {
		platformhttp.WriteError(c, platformhttp.ValidationError("article_id 无效"))
		return
	}
	if !approved && err != nil {
		articleID = 0
	}
	var items []Comment
	if approved {
		items, err = h.repo.ListApproved(c.Request.Context(), articleID)
	} else {
		items, err = h.repo.ListPending(c.Request.Context(), articleID)
	}
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) create(c *gin.Context) {
	var input struct {
		ArticleID int64  `json:"article_id"`
		Content   string `json:"content"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("请求格式错误"))
		return
	}
	content := strings.TrimSpace(input.Content)
	if input.ArticleID < 1 || utf8.RuneCountInString(content) < 1 || utf8.RuneCountInString(content) > 1000 {
		platformhttp.WriteError(c, platformhttp.ValidationError("评论须为 1-1000 个字符"))
		return
	}
	identity, _ := middleware.GetIdentity(c)
	user, err := h.userRepo.GetByID(c.Request.Context(), identity.UserID)
	if err != nil || user.Status != users.StatusActive {
		platformhttp.WriteError(c, platformhttp.Unauthorized("登录状态已失效"))
		return
	}
	contentHTML := strings.ReplaceAll(html.EscapeString(content), "\n", "<br>")
	comment, err := h.repo.Create(c.Request.Context(), input.ArticleID, user.ID, user.Nickname, content, contentHTML)
	if errors.Is(err, sql.ErrNoRows) {
		platformhttp.WriteError(c, platformhttp.NotFound("文章不存在或未开放评论"))
		return
	}
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusCreated, comment)
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
