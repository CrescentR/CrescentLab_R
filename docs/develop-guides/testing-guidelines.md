# 测试规范

## 原则

- 测试真实行为、关键主路径和明确的回归风险，不为实现细节编写低价值断言。
- 修改后按改动范围依次执行检查、相关测试和 Lint。
- 涉及接口时执行集成测试，涉及关键主链路时补充端到端验证。
- 测试不得输出 `.env` 中的账户、密码或其他敏感值。

## 目录

- 后端单元测试：`backend/test/unit`
- 后端集成测试：`backend/test/integration`
- 后端端到端测试：`backend/test/e2e`

## 当前项目命令

- Go 测试：`go test ./...`
- 前端 Lint：在 `frontend` 目录执行 `pnpm lint`
- 前端类型检查：在 `frontend` 目录执行 `pnpm typecheck`
- 前端生产构建：在 `frontend` 目录执行 `pnpm build`
- 完成前端改动后，使用 Docker 启动项目并在真实浏览器视口验证。
