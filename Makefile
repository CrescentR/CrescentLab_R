# 限定 Go 包范围，避免扫描 frontend/admin 的 node_modules 中自带的 Go 文件
GO_PKGS := . ./cmd/... ./internal/...

.PHONY: run test fmt vet db-sqlite-init frontend-install frontend-dev frontend-build frontend-typecheck admin-install admin-dev admin-build admin-typecheck

run:
	go run main.go

test:
	go test $(GO_PKGS)

fmt:
	go fmt $(GO_PKGS)

vet:
	go vet $(GO_PKGS)

db-sqlite-init:
	sqlite3 data/crescentlab.db < database/sqlite/schema.sql

frontend-install:
	cd frontend && pnpm install

frontend-dev:
	cd frontend && pnpm run dev

frontend-build:
	cd frontend && pnpm run build

frontend-typecheck:
	cd frontend && pnpm run typecheck

admin-install:
	cd admin && pnpm install

admin-dev:
	cd admin && pnpm run dev -- --port 3001

admin-build:
	cd admin && pnpm run build

admin-typecheck:
	cd admin && pnpm run typecheck
