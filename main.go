package main

import (
	"fmt"
	"os"

	"CrescentLab_R/cmd/server"
)

func main() {
	app := server.New()
	if err := app.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "crescentlab failed: %v\n", err)
		os.Exit(1)
	}
}
