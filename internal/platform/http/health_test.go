package http

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"CrescentLab_R/internal/platform/config"
)

func TestHealthRouteReturnsOKWhenDatabaseIsReachable(t *testing.T) {
	srv := New(config.ServerConfig{
		Name: "CrescentLab",
		Host: "127.0.0.1",
		Port: 8091,
	}, nil)
	srv.RegisterHealthRoutes(fakeHealthChecker{})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	srv.Engine().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"database":"ok"`) {
		t.Fatalf("body = %s", rec.Body.String())
	}
}

func TestHealthRouteReturnsUnavailableWhenDatabaseFails(t *testing.T) {
	srv := New(config.ServerConfig{
		Name: "CrescentLab",
		Host: "127.0.0.1",
		Port: 8091,
	}, nil)
	srv.RegisterHealthRoutes(fakeHealthChecker{err: errors.New("database closed")})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	srv.Engine().ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"database":"down"`) {
		t.Fatalf("body = %s", rec.Body.String())
	}
}

type fakeHealthChecker struct {
	err error
}

func (c fakeHealthChecker) Ping(context.Context) error {
	return c.err
}
