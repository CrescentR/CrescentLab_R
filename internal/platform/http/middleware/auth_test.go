package middleware

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	sharedauth "CrescentLab_R/internal/shared/auth"
)

func TestAdminRouteAuthorization(t *testing.T) {
	authService, err := sharedauth.NewService([]byte("middleware-test-secret-0123456789abcdef"), time.Hour, 24*time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	reader := sharedauth.Identity{UserID: 7, Username: "reader"}
	admin := sharedauth.Identity{UserID: 1, Username: "admin", IsAdmin: true}

	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.GET("/admin", RequireAuth(authService), RequireAdmin(), func(c *gin.Context) {
		identity, _ := GetIdentity(c)
		c.String(http.StatusOK, strconv.FormatInt(identity.UserID, 10))
	})

	cases := []struct {
		name          string
		authorization string
		wantStatus    int
	}{
		{"missing header", "", http.StatusUnauthorized},
		{"non-bearer scheme", "Basic " + mustIssue(t, authService.IssueAccessToken, admin), http.StatusUnauthorized},
		{"malformed token", "Bearer not-a-jwt", http.StatusUnauthorized},
		{"refresh token rejected", "Bearer " + mustIssue(t, authService.IssueRefreshToken, admin), http.StatusUnauthorized},
		{"non-admin forbidden", "Bearer " + mustIssue(t, authService.IssueAccessToken, reader), http.StatusForbidden},
		{"admin allowed", "Bearer " + mustIssue(t, authService.IssueAccessToken, admin), http.StatusOK},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/admin", nil)
			if tc.authorization != "" {
				req.Header.Set("Authorization", tc.authorization)
			}
			rec := httptest.NewRecorder()
			engine.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d, body = %s", rec.Code, tc.wantStatus, rec.Body.String())
			}
			if tc.wantStatus == http.StatusOK && rec.Body.String() != "1" {
				t.Fatalf("identity user id = %s, want 1", rec.Body.String())
			}
		})
	}
}

func mustIssue(t *testing.T, issue func(sharedauth.Identity) (string, error), identity sharedauth.Identity) string {
	t.Helper()
	token, err := issue(identity)
	if err != nil {
		t.Fatal(err)
	}
	return token
}
