package auth

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	settingsmodule "CrescentLab_R/internal/modules/settings"
	"CrescentLab_R/internal/modules/users"
	"CrescentLab_R/internal/platform/config"
	platformdb "CrescentLab_R/internal/platform/database"
	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/platform/http/middleware"
	sharedauth "CrescentLab_R/internal/shared/auth"
)

// TestAuthFlow_LoginAccessLogout 验证完整认证主链路：
// 登录 → 用 access token 访问管理接口 → 退出 → refresh token 不可再用。
func TestAuthFlow_LoginAccessLogout(t *testing.T) {
	engine := setupAuthTestEngine(t)
	const password = "test-password-123"

	// 1. 登录
	loginResp := doJSON(t, engine, http.MethodPost, "/api/auth/login",
		map[string]string{"username": "admin", "password": password})
	if loginResp.Code != http.StatusOK {
		t.Fatalf("login status = %d, body = %s", loginResp.Code, loginResp.Body.String())
	}
	var tokens struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.Unmarshal(loginResp.Body.Bytes(), &tokens); err != nil {
		t.Fatalf("unmarshal login response: %v", err)
	}
	if tokens.AccessToken == "" || tokens.RefreshToken == "" {
		t.Fatal("login response missing access_token or refresh_token")
	}

	// 2. 无 token 访问管理接口 → 401
	noAuthResp := doRequest(t, engine, http.MethodGet, "/api/admin/settings", "", nil)
	if noAuthResp.Code != http.StatusUnauthorized {
		t.Fatalf("no-auth admin settings status = %d, want 401", noAuthResp.Code)
	}

	// 3. 用 access token 访问管理接口 → 200
	authedResp := doRequest(t, engine, http.MethodGet, "/api/admin/settings",
		"Bearer "+tokens.AccessToken, nil)
	if authedResp.Code != http.StatusOK {
		t.Fatalf("authed admin settings status = %d, body = %s", authedResp.Code, authedResp.Body.String())
	}

	// 4. 刷新 token → 200
	refreshResp := doJSON(t, engine, http.MethodPost, "/api/auth/refresh",
		map[string]string{"refresh_token": tokens.RefreshToken})
	if refreshResp.Code != http.StatusOK {
		t.Fatalf("refresh status = %d, body = %s", refreshResp.Code, refreshResp.Body.String())
	}
	var refreshBody struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(refreshResp.Body.Bytes(), &refreshBody); err != nil {
		t.Fatalf("unmarshal refresh response: %v", err)
	}
	if refreshBody.AccessToken == "" {
		t.Fatal("refresh response missing access_token")
	}

	// 5. 退出 → 204
	logoutResp := doJSON(t, engine, http.MethodPost, "/api/auth/logout",
		map[string]string{"refresh_token": tokens.RefreshToken})
	if logoutResp.Code != http.StatusNoContent {
		t.Fatalf("logout status = %d, want 204", logoutResp.Code)
	}
	repeatedLogoutResp := doJSON(t, engine, http.MethodPost, "/api/auth/logout",
		map[string]string{"refresh_token": tokens.RefreshToken})
	if repeatedLogoutResp.Code != http.StatusNoContent {
		t.Fatalf("repeated logout status = %d, want 204", repeatedLogoutResp.Code)
	}

	// 6. 退出后 refresh token 不可再用 → 401
	revokedResp := doJSON(t, engine, http.MethodPost, "/api/auth/refresh",
		map[string]string{"refresh_token": tokens.RefreshToken})
	if revokedResp.Code != http.StatusUnauthorized {
		t.Fatalf("revoked refresh status = %d, want 401", revokedResp.Code)
	}
}

// TestAuthFlow_LoginWrongPassword 验证错误密码返回 401。
func TestAuthFlow_LoginWrongPassword(t *testing.T) {
	engine := setupAuthTestEngine(t)

	resp := doJSON(t, engine, http.MethodPost, "/api/auth/login",
		map[string]string{"username": "admin", "password": "wrong-password"})
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("wrong password login status = %d, want 401", resp.Code)
	}
}

// TestAuthFlow_RefreshWithAccessTokenRejected 验证 access token 不能用于刷新。
func TestAuthFlow_RefreshWithAccessTokenRejected(t *testing.T) {
	engine := setupAuthTestEngine(t)

	loginResp := doJSON(t, engine, http.MethodPost, "/api/auth/login",
		map[string]string{"username": "admin", "password": "test-password-123"})
	if loginResp.Code != http.StatusOK {
		t.Fatalf("login status = %d", loginResp.Code)
	}
	var tokens struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(loginResp.Body.Bytes(), &tokens); err != nil {
		t.Fatalf("unmarshal login response: %v", err)
	}

	resp := doJSON(t, engine, http.MethodPost, "/api/auth/refresh",
		map[string]string{"refresh_token": tokens.AccessToken})
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("refresh with access token status = %d, want 401", resp.Code)
	}
}

// setupAuthTestEngine 创建一个与 app.go 路由结构一致的测试引擎，
// 使用 SQLite 临时库并预置一个管理员账号。
func setupAuthTestEngine(t *testing.T) *gin.Engine {
	t.Helper()

	db := openAuthTestDB(t)
	driver := "sqlite"

	userRepo := users.NewRepository(db, driver)
	tokenRepo := NewRepository(db, driver)

	hash, err := sharedauth.HashPassword("test-password-123")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	_, err = userRepo.Create(context.Background(), users.CreateInput{
		Username:     "admin",
		UsernameKey:  "admin",
		PasswordHash: hash,
		Nickname:     "admin",
		Status:       users.StatusActive,
		IsSystem:     true,
	})
	if err != nil {
		t.Fatalf("create test admin: %v", err)
	}

	authService, err := sharedauth.NewService(
		[]byte("integration-test-secret"),
		2*time.Hour,
		168*time.Hour,
	)
	if err != nil {
		t.Fatalf("new auth service: %v", err)
	}

	engine := gin.New()
	engine.Use(platformhttp.RequestID(), gin.Recovery())

	authHandler := NewHandler(authService, userRepo, tokenRepo)
	authHandler.RegisterRoutes(engine.Group("/api"))

	adminGroup := engine.Group("/api/admin")
	adminGroup.Use(middleware.RequireAuth(authService), middleware.RequireAdmin())
	settingsmodule.NewHandler(settingsmodule.NewRepository(db, driver)).RegisterAdminRoutes(adminGroup)

	return engine
}

func openAuthTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := platformdb.Open(context.Background(), config.DatabaseConfig{
		Driver: "sqlite",
		DSN:    filepath.Join(t.TempDir(), "auth_test.db"),
	})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	schemaPath := filepath.Join("..", "..", "..", "database", "sqlite", "schema.sql")
	schema, err := os.ReadFile(schemaPath)
	if err != nil {
		t.Fatalf("read schema: %v", err)
	}
	if _, err := db.SQL().ExecContext(context.Background(), string(schema)); err != nil {
		t.Fatalf("apply schema: %v", err)
	}
	return db.SQL()
}

func doJSON(t *testing.T, engine *gin.Engine, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatalf("encode request body: %v", err)
		}
	}
	return doRequest(t, engine, method, path, "", &buf)
}

func doRequest(t *testing.T, engine *gin.Engine, method, path, authHeader string, body *bytes.Buffer) *httptest.ResponseRecorder {
	t.Helper()
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, path, body)
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	req.Header.Set("Content-Type", "application/json")
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}
