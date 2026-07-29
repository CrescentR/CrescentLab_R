# 设置模块本地联调流程

## 目标

让后台设置模块具备可重复的本地联调路径：初始化 SQLite、启动 Go 后端、通过设置页保存配置，并在刷新后读回。

## 验收标准

- 可以通过 `make db-sqlite-init` 或 `sqlite3 data/crescentlab.db < database/sqlite/schema.sql` 初始化本地设置表。
- `go run main.go` 启动后，`GET /api/health` 返回健康状态。
- `http://localhost:3000/admin/settings` 在切换为管理员演示后，可以保存站点标志、后台标志、默认头像、首页主图和 favicon。
- 保存后刷新设置页，字段能从 `/api/admin/settings` 读回。

## Checklist

- [x] 增加 SQLite 初始化命令。
- [x] 在 README 中补充本地联调步骤。
- [x] 保持数据库手动导入边界，不增加自动 migration。
- [ ] 后续补充浏览器级保存/刷新回归测试。
