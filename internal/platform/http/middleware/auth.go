package middleware

import (
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	platformhttp "CrescentLab_R/internal/platform/http"
	sharedauth "CrescentLab_R/internal/shared/auth"
)

const ContextIdentity = "identity"

// RequireAuth 是 JWT 认证中间件，保护需要登录的路由。
// 它只验证 access token 的有效性，不检查管理员权限。
func RequireAuth(authService *sharedauth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		identity, err := parseAccessTokenFromHeader(c, authService)
		if err != nil {
			platformhttp.WriteError(c, platformhttp.Unauthorized(err.Error()))
			c.Abort()
			return
		}
		c.Set(ContextIdentity, identity)
		c.Next()
	}
}

// RequireAdmin 是管理员授权中间件，在 RequireAuth 之后使用。
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		v, exists := c.Get(ContextIdentity)
		if !exists {
			platformhttp.WriteError(c, platformhttp.Unauthorized("请先登录"))
			c.Abort()
			return
		}

		identity, ok := v.(sharedauth.Identity)
		if !ok {
			platformhttp.WriteError(c, platformhttp.Unauthorized("身份信息无效"))
			c.Abort()
			return
		}

		if !identity.IsAdmin {
			platformhttp.WriteError(c, platformhttp.Forbidden("无管理员权限"))
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetIdentity 从 gin.Context 中获取当前登录身份。
func GetIdentity(c *gin.Context) (sharedauth.Identity, bool) {
	v, exists := c.Get(ContextIdentity)
	if !exists {
		return sharedauth.Identity{}, false
	}
	identity, ok := v.(sharedauth.Identity)
	return identity, ok
}

// parseAccessTokenFromHeader 从 Authorization header 中提取并解析 access token。
func parseAccessTokenFromHeader(c *gin.Context, authService *sharedauth.Service) (sharedauth.Identity, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return sharedauth.Identity{}, errors.New("missing authorization header")
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return sharedauth.Identity{}, errors.New("invalid authorization header format")
	}

	claims, err := authService.ParseAccessToken(strings.TrimSpace(parts[1]))
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return sharedauth.Identity{}, errors.New("token expired")
		}
		return sharedauth.Identity{}, errors.New("invalid token")
	}

	return sharedauth.Identity{
		UserID:   claims.UserID,
		Username: claims.Username,
		IsAdmin:  claims.IsAdmin,
	}, nil
}
