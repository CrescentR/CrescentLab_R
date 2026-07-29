package server

import (
	"fmt"
	"os"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

// run 分发子命令。
//
//	crescentlab            启动 HTTP 服务（默认）
//	crescentlab serve      启动 HTTP 服务
//	crescentlab admin init --username <name> --password <pwd>  初始化管理员
//	crescentlab admin secret  生成一个随机 JWT secret（供开发环境使用）
func run(args []string) error {
	if len(args) == 0 {
		return New().Run()
	}

	switch args[0] {
	case "serve":
		return New().Run()
	case "admin":
		return runAdmin(args[1:])
	case "-h", "--help", "help":
		printUsage()
		return nil
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", args[0])
		printUsage()
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func runAdmin(args []string) error {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: crescentlab admin <init|secret>")
		return fmt.Errorf("admin subcommand required")
	}

	switch args[0] {
	case "init":
		return AdminInit(args[1:])
	case "secret":
		fmt.Println(generateDevSecret())
		return nil
	default:
		return fmt.Errorf("unknown admin subcommand %q", args[0])
	}
}

func printUsage() {
	fmt.Println(`CrescentLab backend server

Usage:
  crescentlab                Start the HTTP server (default)
  crescentlab serve          Start the HTTP server
  crescentlab admin init     Initialize the first administrator
      --username <name>      Admin username (or ADMIN_USERNAME env)
      --password <password>  Admin password, min 8 chars (or ADMIN_PASSWORD env)
      --nickname <name>      Display name (defaults to username)
  crescentlab admin secret   Print a random JWT secret for development`)
}
