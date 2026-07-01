package server

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"CrescentLab_R/internal/platform/config"
	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/platform/logger"
)

type App struct {
	cfg        config.Config
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
	a.httpServer = platformhttp.New(cfg.Server, a.log)

	a.log.Info("crescentlab backend starting", "address", cfg.Server.Address(), "config", cfg.Source)

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
