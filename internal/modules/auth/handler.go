package auth

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"CrescentLab_R/internal/modules/users"
	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/platform/http/middleware"
	"CrescentLab_R/internal/shared/auth"
)

type Handler struct {
	authService *auth.Service
	userRepo    *users.Repository
	tokenRepo   *Repository
	log         *slog.Logger
}

func NewHandler(authService *auth.Service, userRepo *users.Repository, tokenRepo *Repository, log *slog.Logger) *Handler {
	return &Handler{authService: authService, userRepo: userRepo, tokenRepo: tokenRepo, log: log}
}

// RegisterRoutes 注册认证路由（公开接口）。
func (h *Handler) RegisterRoutes(group *gin.RouterGroup) {
	group.POST("/auth/login", h.login)
	group.POST("/auth/refresh", h.refresh)
	group.POST("/auth/logout", h.logout)
}

// RegisterAdminRoutes 注册需要管理员认证的路由。
func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.POST("/auth/change-password", h.changePassword)
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type tokenResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	User         userInfo `json:"user"`
}

type userInfo struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Nickname string `json:"nickname"`
	IsAdmin  bool   `json:"is_admin"`
}

// login 处理管理员登录请求。
func (h *Handler) login(c *gin.Context) {
	var req loginRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&req); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("请求格式错误"))
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" || req.Password == "" {
		platformhttp.WriteError(c, platformhttp.ValidationError("用户名和密码不能为空"))
		return
	}

	user, err := h.userRepo.GetByUsernameKey(c.Request.Context(), strings.ToLower(username))
	if err != nil {
		// 不区分用户不存在和密码错误
		platformhttp.WriteError(c, platformhttp.Unauthorized("用户名或密码错误"))
		return
	}

	if user.Status != users.StatusActive {
		platformhttp.WriteError(c, platformhttp.Forbidden("账号已被禁用"))
		return
	}

	if !user.IsSystem {
		platformhttp.WriteError(c, platformhttp.Forbidden("无管理员权限"))
		return
	}

	if err := auth.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		platformhttp.WriteError(c, platformhttp.Unauthorized("用户名或密码错误"))
		return
	}

	identity := auth.Identity{
		UserID:   user.ID,
		Username: user.Username,
		IsAdmin:  true,
	}

	accessToken, err := h.authService.IssueAccessToken(identity)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}

	refreshToken, err := h.authService.IssueRefreshToken(identity)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}

	// 更新最后登录信息
	_ = h.userRepo.UpdateLastLogin(c.Request.Context(), user.ID, time.Now(), c.ClientIP())

	c.JSON(http.StatusOK, tokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: userInfo{
			ID:       user.ID,
			Username: user.Username,
			Nickname: user.Nickname,
			IsAdmin:  true,
		},
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type refreshResponse struct {
	AccessToken string `json:"access_token"`
}

// refresh 使用 refresh token 获取新的 access token。
func (h *Handler) refresh(c *gin.Context) {
	var req refreshRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&req); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("请求格式错误"))
		return
	}

	if req.RefreshToken == "" {
		platformhttp.WriteError(c, platformhttp.ValidationError("refresh_token 不能为空"))
		return
	}

	claims, err := h.authService.ParseRefreshToken(req.RefreshToken)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.Unauthorized("refresh token 无效或已过期"))
		return
	}

	// 检查是否已被撤销
	tokenHash := HashToken(req.RefreshToken)
	revoked, err := h.tokenRepo.IsRevoked(c.Request.Context(), tokenHash)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}
	if revoked {
		platformhttp.WriteError(c, platformhttp.Unauthorized("refresh token 已撤销"))
		return
	}

	identity := auth.Identity{
		UserID:   claims.UserID,
		Username: claims.Username,
		IsAdmin:  claims.IsAdmin,
	}

	accessToken, err := h.authService.IssueAccessToken(identity)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}

	c.JSON(http.StatusOK, refreshResponse{AccessToken: accessToken})
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// logout 撤销 refresh token。
func (h *Handler) logout(c *gin.Context) {
	var req logoutRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&req); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("请求格式错误"))
		return
	}

	if req.RefreshToken == "" {
		platformhttp.WriteError(c, platformhttp.ValidationError("refresh_token 不能为空"))
		return
	}

	// 解析 token 获取 user_id（即使 token 已过期也尝试解析）
	claims, err := h.authService.ParseRefreshToken(req.RefreshToken)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidToken) {
			// token 无效，幂等返回 204
			c.Status(http.StatusNoContent)
			return
		}
		platformhttp.WriteError(c, platformhttp.Unauthorized("refresh token 无效"))
		return
	}

	tokenHash := HashToken(req.RefreshToken)
	if err := h.tokenRepo.RevokeToken(c.Request.Context(), claims.UserID, tokenHash, claims.ExpiresAt.Time); err != nil {
		platformhttp.WriteError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// changePassword 允许已登录的管理员修改自己的密码。
func (h *Handler) changePassword(c *gin.Context) {
	var req changePasswordRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&req); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("请求格式错误"))
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		platformhttp.WriteError(c, platformhttp.ValidationError("旧密码和新密码不能为空"))
		return
	}

	if len(req.NewPassword) < 8 {
		platformhttp.WriteError(c, platformhttp.ValidationError("新密码长度至少为 8 位"))
		return
	}

	identity, ok := middleware.GetIdentity(c)
	if !ok {
		platformhttp.WriteError(c, platformhttp.Unauthorized("请先登录"))
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), identity.UserID)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}

	if err := auth.VerifyPassword(user.PasswordHash, req.OldPassword); err != nil {
		platformhttp.WriteError(c, platformhttp.Unauthorized("旧密码错误"))
		return
	}

	newHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}

	if err := h.userRepo.UpdatePassword(c.Request.Context(), user.ID, newHash); err != nil {
		platformhttp.WriteError(c, platformhttp.InternalError(""))
		return
	}

	h.log.Info("password changed", "user_id", identity.UserID, "username", identity.Username)
	c.Status(http.StatusNoContent)
}

// ParseAccessTokenFromHeader 从 Authorization header 中提取并解析 access token。
// 返回 Identity 和 nil error 表示成功。
func (h *Handler) ParseAccessTokenFromHeader(c *gin.Context) (auth.Identity, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return auth.Identity{}, errors.New("missing authorization header")
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return auth.Identity{}, errors.New("invalid authorization header format")
	}

	claims, err := h.authService.ParseAccessToken(strings.TrimSpace(parts[1]))
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return auth.Identity{}, errors.New("token expired")
		}
		return auth.Identity{}, errors.New("invalid token")
	}

	return auth.Identity{
		UserID:   claims.UserID,
		Username: claims.Username,
		IsAdmin:  claims.IsAdmin,
	}, nil
}
