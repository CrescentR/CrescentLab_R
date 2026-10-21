# 测试规范

## 原则

- 测试真实行为、关键主路径和明确的回归风险，不为实现细节编写低价值断言。
- 修改后按改动范围依次执行检查、相关测试和 Lint。
- 涉及接口时执行集成测试，涉及关键主链路时补充端到端验证。
- 测试不得输出 `.env` 中的账户、密码或其他敏感值。

## 目录

Go 测试文件与被测包放在同一目录下（遵循 Go 惯例），文件名以 `_test.go` 结尾：

- 单元测试：与源码同目录，如 `internal/modules/users/repository_test.go`
- 集成测试：与源码同目录，如 `internal/modules/auth/integration_test.go`
- 测试辅助函数（如建临时库、构造测试数据）放在同包的 `_test.go` 文件中

前端单元测试放在 `backend/test/unit`，浏览器测试放在 `backend/test/e2e`。纸张改版使用隔离数据库运行 Playwright，启动方式及数据准备见 `docs/vibe/2026-10-21-paper-journal-redesign.md`。

## 当前项目命令

- Go 测试：`go test ./...`
- 前端 Lint：在 `frontend` 目录执行 `pnpm lint`
- 前端类型检查：在 `frontend` 目录执行 `pnpm typecheck`
- 前端生产构建：在 `frontend` 目录执行 `pnpm build`
- 前端单元测试：`pnpm --dir frontend test:unit`
- 浏览器回归：`pnpm --dir frontend test:e2e`（需先准备隔离数据与对应服务）
- 完成前端改动后，使用 Docker 启动项目并在真实浏览器视口验证。
