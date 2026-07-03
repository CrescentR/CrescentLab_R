package settings

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandlerUpsertBatchAndList(t *testing.T) {
	router := newSettingsTestRouter(t)

	body := []byte(`{"settings":[{"scope":"site","group_key":"branding","key":"siteLogoUrl","value":"https://example.com/logo.svg","value_type":"string","is_public":true,"is_encrypted":false,"description":"站点标志"}]}`)
	putReq := httptest.NewRequest(http.MethodPut, "/api/admin/settings", bytes.NewReader(body))
	putReq.Header.Set("Content-Type", "application/json")
	putRec := httptest.NewRecorder()
	router.ServeHTTP(putRec, putReq)

	if putRec.Code != http.StatusOK {
		t.Fatalf("PUT status = %d, body = %s", putRec.Code, putRec.Body.String())
	}
	if !strings.Contains(putRec.Body.String(), "siteLogoUrl") {
		t.Fatalf("PUT body = %s", putRec.Body.String())
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/admin/settings?scope=site&group_key=branding", nil)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body = %s", getRec.Code, getRec.Body.String())
	}
	if !strings.Contains(getRec.Body.String(), "https://example.com/logo.svg") {
		t.Fatalf("GET body = %s", getRec.Body.String())
	}
}

func TestHandlerRejectsInvalidSettingValue(t *testing.T) {
	router := newSettingsTestRouter(t)

	body := []byte(`{"settings":[{"scope":"site","group_key":"branding","key":"siteLogoUrl","value":{,"value_type":"json","is_public":true,"is_encrypted":false}]}`)
	req := httptest.NewRequest(http.MethodPut, "/api/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func newSettingsTestRouter(t *testing.T) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	sqlDB := openSettingsTestDB(t)
	NewHandler(NewRepository(sqlDB)).RegisterAdminRoutes(router.Group("/api/admin"))
	return router
}
