# 贡献与提交

- 改动前阅读根目录 `AGENTS.md`、设计规范及测试规范；较大需求在 `docs/vibe/` 记录目标、范围、验收标准和 checklist。
- 使用 pnpm 管理前端依赖。运行相关 Go 测试、前后台类型检查、Lint 和生产构建；涉及公开站关键路径时执行真实浏览器验收。
- 数据库结构变更同时维护 SQLite／PostgreSQL 完整 schema 和手动升级 SQL，不在应用启动时自动执行迁移。
- 更新 `docs/develop-guides/changelog.md`；新增正式用户文档时同步已有文档导航。
- 使用中文 Conventional Commits 提交，PR 按仓库模板描述问题、结果、验证及剩余限制。不提交凭据、数据库或本地运行产物。
- 未完成的验收如实标注；仅在必要检查通过后将 PR 标为可合并。
