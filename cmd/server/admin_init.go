package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"CrescentLab_R/internal/modules/users"
	"CrescentLab_R/internal/platform/config"
	"CrescentLab_R/internal/platform/database"
	"CrescentLab_R/internal/platform/logger"
	"CrescentLab_R/internal/shared/auth"
)

// AdminInit 执行管理员初始化命令。
// 如果系统中已存在 is_system=true 的管理员，则跳过。
func AdminInit(args []string) error {
	fs := flag.NewFlagSet("admin init", flag.ExitOnError)
	username := fs.String("username", "", "管理员用户名")
	password := fs.String("password", "", "管理员密码")
	nickname := fs.String("nickname", "", "管理员昵称（默认同用户名）")
	_ = fs.Parse(args)

	// 支持环境变量覆盖
	if *username == "" {
		*username = os.Getenv("ADMIN_USERNAME")
	}
	if *password == "" {
		*password = os.Getenv("ADMIN_PASSWORD")
	}

	if strings.TrimSpace(*username) == "" {
		return fmt.Errorf("--username 或 ADMIN_USERNAME 环境变量是必需的")
	}
	if len(*password) < 8 {
		return fmt.Errorf("--password 或 ADMIN_PASSWORD 环境变量必须不少于 8 个字符")
	}
	if strings.TrimSpace(*nickname) == "" {
		*nickname = *username
	}

	cfg, err := config.Load("data/conf.ini", "default_files/conf.ini")
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	log := logger.New(os.Stdout)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := database.Open(ctx, cfg.Database)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer func() { _ = db.Close() }()

	userRepo := users.NewRepository(db.SQL(), db.Driver())

	// 检查是否已存在系统管理员
	existing, err := userRepo.GetByUsernameKey(ctx, strings.ToLower(*username))
	if err == nil && existing.IsSystem {
		log.Info("admin user already exists, skipping", "username", existing.Username)
		fmt.Printf("admin user already exists: username=%s, skipping\n", existing.Username)
		return nil
	}

	// 创建管理员（直接 SQL 插入，兼容 Hexo 表结构）
	passwordHash, err := auth.HashPassword(*password)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	_, err = db.SQL().ExecContext(ctx,
		`INSERT INTO users (group_id, username, username_key, password_hash, nickname, status)
		 VALUES (1, $1, $2, $3, $4, 'active')`,
		strings.TrimSpace(*username),
		strings.ToLower(strings.TrimSpace(*username)),
		passwordHash,
		strings.TrimSpace(*nickname),
	)
	if err != nil {
		return fmt.Errorf("create admin user: %w", err)
	}

	log.Info("admin user created", "username", strings.TrimSpace(*username))
	fmt.Printf("admin user created: username=%s, status=active, group=admin\n", strings.TrimSpace(*username))
	return nil
}

// generateDevSecret 生成一个随机 JWT secret，用于开发环境。
func generateDevSecret() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
