package http

import (
	"context"
	nethttp "net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type HealthChecker interface {
	Ping(ctx context.Context) error
}

func (s *Server) RegisterHealthRoutes(checker HealthChecker) {
	s.engine.GET("/api/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := checker.Ping(ctx); err != nil {
			c.JSON(nethttp.StatusServiceUnavailable, gin.H{
				"status":   "unhealthy",
				"database": "down",
			})
			return
		}

		c.JSON(nethttp.StatusOK, gin.H{
			"status":   "ok",
			"database": "ok",
		})
	})
}
