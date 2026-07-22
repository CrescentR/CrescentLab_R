package server

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	authmodule "CrescentLab_R/internal/modules/auth"
	contentmodule "CrescentLab_R/internal/modules/content"
	settingsmodule "CrescentLab_R/internal/modules/settings"
	usersmodule "CrescentLab_R/internal/modules/users"
	"CrescentLab_R/internal/platform/config"
	"CrescentLab_R/internal/platform/database"
	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/platform/http/handler"
	"CrescentLab_R/internal/platform/http/middleware"
	"CrescentLab_R/internal/platform/logger"
	"CrescentLab_R/internal/shared/auth"
)

type App struct {
	cfg        config.Config
	db         *database.DB
	log        *slog.Logger
	httpServer *platformhttp.Server
}

func New() *App {
	return &App{log: logger.New(os.Stdout)}
}

func (a *App) Run() error {
	cfg, err := config.Load("data/conf.ini", "default_files/conf.ini")
	if err != nil {
		return err
	}

	a.cfg = cfg
	db, err := database.Open(context.Background(), cfg.Database)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := db.Close(); closeErr != nil {
			a.log.Error("close database failed", "error", closeErr)
		}
	}()

	a.db = db
	a.httpServer = platformhttp.New(cfg.Server, a.log)
	engine := a.httpServer.Engine()

	// JWT auth service
	jwtSecret := []byte(cfg.Auth.JWTSecret)
	if len(jwtSecret) == 0 {
		// 开发环境自动生成随机 secret
		jwtSecret = []byte(generateDevSecret())
		a.log.Warn("auth.jwt_secret is empty, using generated dev secret; set a fixed secret for production")
	}
	accessTTL, _ := time.ParseDuration(cfg.Auth.AccessTTL)
	if accessTTL == 0 {
		accessTTL = 2 * time.Hour
	}
	refreshTTL, _ := time.ParseDuration(cfg.Auth.RefreshTTL)
	if refreshTTL == 0 {
		refreshTTL = 168 * time.Hour
	}
	authService, err := auth.NewService(jwtSecret, accessTTL, refreshTTL)
	if err != nil {
		return err
	}

	// 健康检查（公开）
	healthHandler := handler.NewHealthHandler(db)
	healthHandler.RegisterRoutes(engine.Group(""))

	// 认证接口（公开）
	userRepo := usersmodule.NewRepository(db.SQL(), db.Driver())
	tokenRepo := authmodule.NewRepository(db.SQL(), db.Driver())
	authHandler := authmodule.NewHandler(authService, userRepo, tokenRepo)
	authHandler.RegisterRoutes(engine.Group("/api"))

	// 公开文章接口（不需认证）
	contentRepo := contentmodule.NewRepository(db.SQL(), db.Driver())
	contentmodule.NewHandler(contentRepo).RegisterPublicRoutes(engine.Group("/api"))

	// 管理接口（需认证 + 管理员）
	adminGroup := engine.Group("/api/admin")
	adminGroup.Use(middleware.RequireAuth(authService), middleware.RequireAdmin())
	settingsmodule.NewHandler(settingsmodule.NewRepository(db.SQL(), db.Driver())).RegisterAdminRoutes(adminGroup)
	contentmodule.NewHandler(contentRepo).RegisterAdminRoutes(adminGroup)

	a.log.Info("crescentlab backend starting", "address", cfg.Server.Address(), "config", cfg.Source, "database_driver", db.Driver())

	errCh := make(chan error, 1)
	go func() {
		errCh <- a.httpServer.ListenAndServe()
	}()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		a.log.Info("crescentlab backend shutting down")
		return a.httpServer.Shutdown(shutdownCtx)
	}
}
