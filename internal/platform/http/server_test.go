package http

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"CrescentLab_R/internal/platform/config"
)

func TestNewCreatesGinEngine(t *testing.T) {
	srv := New(config.ServerConfig{
		Name: "CrescentLab",
		Host: "127.0.0.1",
		Port: 8091,
	}, nil)

	if srv.Engine() == nil {
		t.Fatal("Engine returned nil")
	}

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	srv.Engine().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d", rec.Code)
	}
}
