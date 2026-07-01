.PHONY: run test fmt vet frontend-install frontend-dev frontend-build frontend-typecheck

run:
	go run main.go

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-typecheck:
	cd frontend && npm run typecheck
