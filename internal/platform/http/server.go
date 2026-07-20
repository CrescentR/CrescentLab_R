package http

import (
	"context"
	"errors"
	"log/slog"
	nethttp "net/http"
	"time"

	"CrescentLab_R/internal/platform/config"
	"CrescentLab_R/internal/platform/http/middleware"

	"github.com/gin-gonic/gin"
)

type Server struct {
	engine *gin.Engine
	server *nethttp.Server
}

func New(cfg config.ServerConfig, log *slog.Logger) *Server {
	gin.SetMode(gin.ReleaseMode)

	engine := gin.New()
	engine.Use(middleware.RequestID(), requestLogger(log), gin.Recovery())

	return &Server{
		engine: engine,
		server: &nethttp.Server{
			Addr:              cfg.Address(),
			Handler:           engine,
			ReadHeaderTimeout: 5 * time.Second,
			ReadTimeout:       30 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
			MaxHeaderBytes:    1 << 20, // 1MB
		},
	}
}

func (s *Server) Engine() *gin.Engine {
	return s.engine
}

func (s *Server) ListenAndServe() error {
	if err := s.server.ListenAndServe(); err != nil {
		if errors.Is(err, nethttp.ErrServerClosed) {
			return nil
		}
		return err
	}

	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

func requestLogger(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()

		if log == nil {
			return
		}

		log.Info(
			"http request",
			"request_id", middleware.GetRequestID(c),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"latency", time.Since(startedAt).String(),
		)
	}
}
