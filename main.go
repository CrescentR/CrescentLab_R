package main

import (
	"fmt"
	"os"

	"CrescentLab_R/cmd/server"
)

func main() {
	// 子命令：admin init
	if len(os.Args) > 1 && os.Args[1] == "admin" {
		if len(os.Args) > 2 && os.Args[2] == "init" {
			if err := server.AdminInit(os.Args[3:]); err != nil {
				fmt.Fprintf(os.Stderr, "admin init failed: %v\n", err)
				os.Exit(1)
			}
			return
		}
		fmt.Fprintf(os.Stderr, "usage: crescentlab admin init --username <name> --password <pass>\n")
		os.Exit(1)
	}

	app := server.New()
	if err := app.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "crescentlab failed: %v\n", err)
		os.Exit(1)
	}
}
