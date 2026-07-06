package server

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	settingsmodule "CrescentLab_R/internal/modules/settings"
	"CrescentLab_R/internal/platform/config"
	"CrescentLab_R/internal/platform/database"
	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/platform/logger"
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
	settingsmodule.NewHandler(settingsmodule.NewRepository(db.SQL(), db.Driver())).RegisterAdminRoutes(a.httpServer.Engine().Group("/api/admin"))

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
