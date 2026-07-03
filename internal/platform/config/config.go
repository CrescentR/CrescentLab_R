package config

import (
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Source   string         `mapstructure:"-"`
	Server   ServerConfig   `mapstructure:"server"`
	Frontend FrontendConfig `mapstructure:"frontend"`
	Database DatabaseConfig `mapstructure:"database"`
}

type ServerConfig struct {
	Name string `mapstructure:"name"`
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
}

func (c ServerConfig) Address() string {
	return net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
}

type FrontendConfig struct {
	Enabled bool   `mapstructure:"enabled"`
	DevURL  string `mapstructure:"dev_url"`
}

type DatabaseConfig struct {
	Driver string `mapstructure:"driver"`
	DSN    string `mapstructure:"dsn"`
}

func Load(paths ...string) (Config, error) {
	for _, path := range paths {
		path = strings.TrimSpace(path)
		if path == "" {
			continue
		}

		if _, err := os.Stat(path); err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return Config{}, fmt.Errorf("stat config file %q: %w", path, err)
		}

		v := viper.New()
		setDefaults(v)
		v.SetConfigType("toml")

		file, err := os.Open(path)
		if err != nil {
			return Config{}, fmt.Errorf("open config file %q: %w", path, err)
		}

		if err := v.ReadConfig(file); err != nil {
			_ = file.Close()
			return Config{}, fmt.Errorf("read config file %q: %w", path, err)
		}
		if err := file.Close(); err != nil {
			return Config{}, fmt.Errorf("close config file %q: %w", path, err)
		}

		return decode(v, path)
	}

	return Config{}, fmt.Errorf("config file not found: %s", strings.Join(paths, ", "))
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("server.name", "CrescentLab")
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 8091)
	v.SetDefault("frontend.enabled", true)
	v.SetDefault("frontend.dev_url", "http://localhost:3000")
	v.SetDefault("database.driver", "sqlite")
	v.SetDefault("database.dsn", "data/crescentlab.db")
}

func decode(v *viper.Viper, source string) (Config, error) {
	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return Config{}, fmt.Errorf("decode config file %q: %w", source, err)
	}

	cfg.Source = source
	if err := cfg.Validate(); err != nil {
		return Config{}, fmt.Errorf("validate config file %q: %w", source, err)
	}

	return cfg, nil
}

func (c Config) Validate() error {
	if strings.TrimSpace(c.Server.Name) == "" {
		return fmt.Errorf("server.name is required")
	}
	if strings.TrimSpace(c.Server.Host) == "" {
		return fmt.Errorf("server.host is required")
	}
	if c.Server.Port < 1 || c.Server.Port > 65535 {
		return fmt.Errorf("server.port must be between 1 and 65535")
	}
	if strings.TrimSpace(c.Database.Driver) == "" {
		return fmt.Errorf("database.driver is required")
	}
	if strings.TrimSpace(c.Database.DSN) == "" {
		return fmt.Errorf("database.dsn is required")
	}

	return nil
}
