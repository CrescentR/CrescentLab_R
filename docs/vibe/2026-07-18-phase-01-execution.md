# 阶段 01 开发执行计划

> 日期：2026-07-18
> 阶段：可重复构建与安全门禁
> 需求文档：`docs/planning/phases/phase-01-build-and-security.md`
> 任务总表：`docs/planning/04-master-task-list.md`

## 1. 目标

建立可重复构建基线和安全门禁，让管理员能以真实身份登录后台，所有 `/api/admin/*` 接口受 JWT 中间件保护。

## 2. 已确认决策（采用推荐默认值）

| 编号 | 决策 | 结论 |
| --- | --- | --- |
| Q-001 | 账号模型 | 只有管理员和访客，不实现读者成员 |
| Q-002 | Token 存放 | localStorage |
| Q-003 | Token 撤销 | 退出只撤销 refresh token，access token 自然过期 |
| Q-004 | SQLite 补建表 | 只补建 `auth_tokens`，不建 `user_groups`，管理员通过 `users.is_system` 判断 |
| Q-005 | 登录失败锁定 | 不实现，阶段 04 用限流覆盖 |
| Q-009 | 测试目录 | 保持包同目录，修订 AGENTS.md 测试规范 |

## 3. Checklist

### 批次 1：构建基线（P0，可并行）
- [x] T-01-01 修复 go.sum
- [x] T-01-02 统一包管理器为 pnpm
- 验证：`go mod verify`、`go test ./...`、`go vet ./...`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过

### 批次 2：HTTP 基线（P1）
- [ ] T-01-03 request_id 中间件
- [ ] T-01-04 统一错误响应
- [ ] T-01-05 HTTP 超时和 body 上限
- [ ] T-01-06 健康检查
- 验证：错误响应格式统一，`/healthz/ready` 可识别缺表

### 批次 3：认证后端（P1）
- [ ] T-01-07 管理员初始化命令
- [ ] T-01-08 登录 handler
- [ ] T-01-09 刷新 handler
- [ ] T-01-10 退出 handler
- [ ] T-01-11 JWT 认证中间件
- [ ] T-01-12 路由注册
- 验证：登录返回 token，`/api/admin/*` 未认证返回 401

### 批次 4：前端接入（P1）
- [ ] T-01-13 修改现有 handler 错误响应
- [ ] T-01-14 登录页
- [ ] T-01-15 AdminShell 权限检查
- [ ] T-01-16 退出按钮
- [ ] T-01-17 前端 API 客户端
- 验证：前端登录流程完整

### 批次 5：测试与文档（P2）
- [ ] T-01-18 认证集成测试
- [ ] T-01-19 CI 工作流
- [ ] T-01-20 文档更新
- 验证：CI 在 PR 上运行，文档可操作
