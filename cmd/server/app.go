package server

import "fmt"

// App is the future composition root for configuration, persistence,
// routers, background tasks, and the Next.js proxy process.
type App struct {
	Name string
}

func New() *App {
	return &App{Name: "CrescentLab"}
}

func (a *App) Run() error {
	fmt.Printf("%s backend shell is ready. API routes are intentionally not registered yet.\n", a.Name)
	return nil
}
