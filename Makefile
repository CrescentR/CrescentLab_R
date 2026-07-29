.PHONY: run test fmt vet db-sqlite-init frontend-install frontend-dev frontend-build frontend-typecheck

run:
	go run main.go

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

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
