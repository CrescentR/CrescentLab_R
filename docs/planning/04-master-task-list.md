# CrescentLab 项目任务总表

> 基线：2026-07-18
> 来源：`phases/phase-01-build-and-security.md` ~ `phases/phase-04-interaction-and-ops.md`
> 用途：为开发执行、进度跟踪和 PR 拆分提供统一视图
> 编号规则：`T-<阶段>-<序号>`，与各阶段文档保持一致

---

## 1. 总览

| 阶段 | 阶段名称 | 任务数 | P0 | P1 | P2 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 可重复构建与安全门禁 | 20 | 2 | 11 | 7 | 待启动 |
| 02 | 文章发布闭环 | 13 | 0 | 10 | 3 | 待启动 |
| 03 | 媒体与内容组织 | 18 | 0 | 13 | 5 | 待启动 |
| 04 | 互动与生产运维 | 18 | 0 | 8 | 10 | 待启动 |
| **合计** | — | **69** | **2** | **42** | **25** | — |

> 阶段为串行依赖：阶段 02 须在阶段 01 完成后启动，依此类推。阶段内的任务按"推荐开发顺序"执行，标注"可并行"的任务可同时推进。

---

## 2. 阶段 01：可重复构建与安全门禁

> 详细需求见 `phases/phase-01-build-and-security.md`

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-01-01 | 修复 go.sum | 补全 JWT v5.3.1 校验 | go.mod, go.sum | — | go.sum 更新 | `go mod verify` 通过 | P0 | 是 |
| T-01-02 | 统一包管理器 | 删除 package-lock.json，Dockerfile/Makefile 改用 pnpm | frontend, Dockerfile, Makefile | — | 锁文件和构建配置更新 | Docker build 使用 pnpm | P0 | 是 |
| T-01-03 | 实现 request_id 中间件 | 每个请求生成唯一 ID | platform/http | — | middleware/request_id.go | 响应 header 和日志包含 request_id | P1 | 是 |
| T-01-04 | 实现统一错误响应 | 定义 AppError 和错误码 | platform/http | T-01-03 | errors.go, middleware | 错误响应格式统一 | P1 | 否 |
| T-01-05 | 补充 HTTP 超时和 body 上限 | 防止慢请求和大请求 | platform/http | — | server.go 修改 | 超时可测试 | P1 | 是 |
| T-01-06 | 实现健康检查 | liveness + readiness | platform/http, database | T-01-04 | handler/health.go | `/healthz/ready` 能识别缺表 | P1 | 是 |
| T-01-07 | 实现管理员初始化命令 | 创建首个管理员 | cmd/server, modules/users | T-01-01 | admin init 命令 | 初始化后可登录 | P1 | 否（需先确认 Q-004） |
| T-01-08 | 实现登录 handler | POST /api/auth/login | modules/auth(新增) | T-01-04, T-01-07 | handler/auth.go | 登录返回 token | P1 | 否 |
| T-01-09 | 实现刷新 handler | POST /api/auth/refresh | modules/auth | T-01-08 | handler/auth.go | 刷新返回新 token | P1 | 否 |
| T-01-10 | 实现退出 handler | POST /api/auth/logout | modules/auth | T-01-09 | handler/auth.go | 退出后 refresh 不可用 | P2 | 否 |
| T-01-11 | 实现 JWT 认证中间件 | 保护 /api/admin/* | platform/http/middleware | T-01-08 | middleware/auth.go | 未认证返回 401 | P1 | 否 |
| T-01-12 | 更新路由注册 | 对 /api/admin 应用中间件 | cmd/server | T-01-11 | app.go 修改 | 全部管理 API 受保护 | P1 | 否 |
| T-01-13 | 修改现有 handler 错误响应 | content/settings 使用统一错误 | modules/content, modules/settings | T-01-04 | handler.go 修改 | 错误响应格式统一 | P2 | 是 |
| T-01-14 | 创建登录页 | /login 页面 | frontend | T-01-08 | app/(auth)/login/page.tsx | 可提交登录并跳转 | P1 | 是 |
| T-01-15 | 修改 AdminShell 权限检查 | 从 persona 改为真实 token | frontend | T-01-14 | adminShell.tsx 修改 | 未登录跳转 /login | P1 | 否 |
| T-01-16 | 增加退出按钮 | AdminShell 头部 | frontend | T-01-10, T-01-15 | adminShell.tsx 修改 | 点击退出后跳转 /login | P2 | 否 |
| T-01-17 | 创建前端 API 客户端 | 封装 fetch + 拦截器 | frontend/lib/api | T-01-14 | client.ts | 自动添加 token 和刷新 | P1 | 是 |
| T-01-18 | 编写认证集成测试 | 登录→访问→退出 | test | T-01-12 | integration test | 测试通过 | P2 | 否 |
| T-01-19 | 创建 CI 工作流 | GitHub Actions | .github/workflows | T-01-01, T-01-02 | ci.yml | CI 在 PR 上运行 | P2 | 是 |
| T-01-20 | 更新文档 | README + ARCHITECTURE | docs | T-01-06, T-01-07 | 文档更新 | 新开发者可按文档操作 | P2 | 是 |

---

## 3. 阶段 02：文章发布闭环

> 详细需求见 `phases/phase-02-article-publishing.md`
> 前置：阶段 01 完成

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-02-01 | 实现 Markdown 渲染器 | Goldmark + Bluemonday | shared/markdown | — | renderer.go | XSS 净化测试通过 | P1 | 是 |
| T-02-02 | 集成渲染到 content handler | Create/Update 生成 content_html | modules/content | T-02-01 | handler.go 修改 | content_html 不为空 | P1 | 否 |
| T-02-03 | 实现字数和阅读时长 | 计算 word_count 和 reading_time | modules/content | T-02-01 | model.go 修改 | 字数和时长正确 | P2 | 是 |
| T-02-04 | 新增后台文章详情接口 | GET /api/admin/articles/:id | modules/content | — | handler.go | 按 ID 返回详情 | P1 | 是 |
| T-02-05 | 新增 slug 唯一校验 | Create/Update 检查 slug 冲突 | modules/content | — | repository.go | 返回 409 | P1 | 是 |
| T-02-06 | 创建后台文章列表页 | /admin/postManagement | frontend | T-02-04 | page.tsx | 列表/筛选/分页可用 | P1 | 是 |
| T-02-07 | 重写编辑器接入 API | /admin/postManagement/new 和 [id]/edit | frontend | T-02-04, T-02-05 | articleEditorWorkspace.tsx | 保存/发布/归档/删除可用 | P1 | 否 |
| T-02-08 | 创建公开文章详情页 | /posts/[slug] | frontend | T-02-02 | page.tsx | 详情页渲染 HTML | P1 | 是 |
| T-02-09 | 首页文章列表接入 API | 替换 mockData | frontend | T-02-02 | articleSection.tsx | 首页读取真实数据 | P1 | 是 |
| T-02-10 | 修改 AdminShell 导航 | "内容"指向列表页 | frontend | T-02-06 | adminShell.tsx | 导航正确 | P2 | 是 |
| T-02-11 | Dashboard 接入真实数据 | "最近内容"读取文章 | frontend | T-02-09 | dashboardOverview.tsx | 不使用 mock | P2 | 是 |
| T-02-12 | 编写 PostgreSQL 集成测试 | 文章 CRUD 双库一致 | test | T-02-02 | integration test | SQLite 和 PG 通过 | P2 | 否 |
| T-02-13 | 编写核心 E2E 测试 | 登录→创建→发布→读取→删除 | test | T-02-07, T-02-08 | e2e test | 测试通过 | P2 | 否 |

---

## 4. 阶段 03：媒体与内容组织

> 详细需求见 `phases/phase-03-media-and-content.md`
> 前置：阶段 02 完成

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-03-01 | 补建 SQLite 文件表 | files 表 | database/sqlite | — | schema.sql 追加 | 表创建成功 | P1 | 是 |
| T-03-02 | 实现文件上传 handler | POST /api/admin/media/upload | modules/media(新增) | T-03-01 | handler.go, repository.go | 上传成功 | P1 | 否 |
| T-03-03 | 实现文件列表和删除 | GET/DELETE /api/admin/media | modules/media | T-03-02 | handler.go | 列表和删除可用 | P1 | 否 |
| T-03-04 | 配置静态文件服务 | /uploads/* 由 Go 提供 | platform/http | — | server.go 修改 | URL 可访问 | P1 | 是 |
| T-03-05 | 创建媒体库页面 | /admin/media | frontend | T-03-03 | page.tsx | 上传/列表/删除可用 | P1 | 是 |
| T-03-06 | 创建媒体选择弹窗 | 编辑器中选择图片 | frontend | T-03-05 | mediaPicker.tsx | 弹窗可选择图片 | P1 | 否 |
| T-03-07 | 实现分类 CRUD | /api/admin/categories | modules/content | — | handler.go, repository.go | CRUD 可用 | P1 | 是 |
| T-03-08 | 实现公开分类列表 | GET /api/public/categories | modules/content | T-03-07 | handler.go | 公开可访问 | P2 | 否 |
| T-03-09 | 创建分类管理页面 | /admin/categories | frontend | T-03-07 | page.tsx | CRUD 可用 | P2 | 是 |
| T-03-10 | 编辑器增加分类选择 | 下拉选择 | frontend | T-03-07 | articleEditorWorkspace.tsx | 可选择分类 | P1 | 否 |
| T-03-11 | 补建 SQLite 标签表 | post_tags, article_tags | database/sqlite | — | schema.sql 追加 | 表创建成功 | P1 | 是 |
| T-03-12 | 实现标签 CRUD 和关联 | /api/admin/tags, articles/:id/tags | modules/content | T-03-11 | handler.go, repository.go | 标签可管理 | P1 | 否 |
| T-03-13 | 编辑器增加标签输入 | 标签输入和展示 | frontend | T-03-12 | articleEditorWorkspace.tsx | 可添加/移除标签 | P1 | 否 |
| T-03-14 | 实现公开设置接口 | GET /api/public/settings | modules/settings | — | handler.go | 公开可访问 | P1 | 是 |
| T-03-15 | 前端品牌设置加载 | site-settings.ts 改为 API | frontend | T-03-14 | site-settings.ts | 首页读取品牌设置 | P1 | 是 |
| T-03-16 | 首页分类筛选 | articleSection 增加筛选 | frontend | T-03-08 | articleSection.tsx | 可按分类筛选 | P2 | 是 |
| T-03-17 | 文章详情展示分类标签 | /posts/[slug] | frontend | T-03-10, T-03-13 | page.tsx | 详情显示分类和标签 | P2 | 是 |
| T-03-18 | 编写测试 | 上传安全+CRUD+设置生效 | test | T-03-15 | integration/e2e | 测试通过 | P2 | 否 |

---

## 5. 阶段 04：互动与生产运维

> 详细需求见 `phases/phase-04-interaction-and-ops.md`
> 前置：阶段 03 完成

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-04-01 | 补建 SQLite 评论和审计表 | comments, audit_logs | database/sqlite | — | schema.sql 追加 | 表创建成功 | P1 | 是 |
| T-04-02 | 实现评论提交和列表 | POST/GET /api/public/comments | modules/comments(新增) | T-04-01 | handler.go, repository.go | 评论可提交和展示 | P1 | 否 |
| T-04-03 | 实现评论审核 | GET/PUT/DELETE /api/admin/comments | modules/comments | T-04-02 | handler.go | 审核可用 | P1 | 否 |
| T-04-04 | 详情页增加评论区 | /posts/[slug] | frontend | T-04-02 | page.tsx | 可提交和查看评论 | P1 | 是 |
| T-04-05 | 创建评论管理页面 | /admin/comments | frontend | T-04-03 | page.tsx | 审核可用 | P1 | 是 |
| T-04-06 | 实现用户列表 | GET /api/admin/users | modules/users | — | handler.go | 列表可用 | P1 | 是 |
| T-04-07 | 实现用户禁用/启用和重置密码 | PUT/POST /api/admin/users/:id | modules/users | T-04-06 | handler.go | 操作可用 | P1 | 否 |
| T-04-08 | 创建用户管理页面 | /admin/users | frontend | T-04-07 | page.tsx | 管理可用 | P1 | 是 |
| T-04-09 | 实现审计日志中间件 | 记录关键操作 | platform/http, shared | T-04-01 | middleware/audit.go | 操作被记录 | P2 | 是 |
| T-04-10 | 创建审计日志页面 | /admin/audit-logs | frontend | T-04-09 | page.tsx | 可查看日志 | P2 | 是 |
| T-04-11 | 编写备份恢复脚本 | backup.sh, restore.sh | scripts | — | scripts/ | 备份可恢复 | P2 | 是 |
| T-04-12 | 实现日志脱敏 | 过滤敏感字段 | platform/http, logger | — | logger.go 修改 | 日志无明文密码 | P2 | 是 |
| T-04-13 | 实现限流中间件 | 全局和登录限流 | platform/http | — | middleware/ratelimit.go | 限流生效 | P2 | 是 |
| T-04-14 | 环境变量化配置 | JWT_SECRET 等 | platform/config | — | config.go 修改 | 生产检查必需变量 | P2 | 是 |
| T-04-15 | 编写发布回滚脚本 | deploy.sh, rollback.sh | scripts | — | scripts/ | 发布可回滚 | P2 | 是 |
| T-04-16 | 编写正式文档 | 部署/备份/回滚指南 | docs | T-04-11, T-04-15 | docs/ | 文档完整 | P2 | 是 |
| T-04-17 | 安全回归测试 | 限流/脱敏/密钥 | test | T-04-13, T-04-14 | test | 测试通过 | P2 | 否 |
| T-04-18 | 备份恢复演练 | 验证恢复 | test | T-04-11 | 演练记录 | 恢复成功 | P2 | 否 |

---

## 6. 跨阶段关键依赖链

以下依赖链标注了不可并行、必须串行完成的关键路径：

```
阶段 01 关键路径：
  T-01-01 修复 go.sum
    └─ T-01-07 管理员初始化（需先确认 Q-004）
         └─ T-01-08 登录
              └─ T-01-09 刷新
                   └─ T-01-10 退出
                        └─ T-01-11 JWT 中间件
                             └─ T-01-12 路由注册
                                  └─ T-01-18 认证集成测试

  T-01-03 request_id
    └─ T-01-04 统一错误
         └─ T-01-06 健康检查
         └─ T-01-13 修改现有 handler 错误响应

  T-01-14 登录页
    └─ T-01-15 AdminShell 权限检查
         └─ T-01-16 退出按钮
    └─ T-01-17 前端 API 客户端

阶段 02 关键路径：
  T-02-01 Markdown 渲染器
    └─ T-02-02 集成渲染到 handler
         └─ T-02-08 公开详情页
         └─ T-02-09 首页接入 API
         └─ T-02-12 PostgreSQL 集成测试

  T-02-04 后台详情接口 + T-02-05 slug 校验
    └─ T-02-07 编辑器接入 API
         └─ T-02-13 E2E 测试

阶段 03 关键路径：
  T-03-01 文件表
    └─ T-03-02 上传 handler
         └─ T-03-03 列表/删除
              └─ T-03-05 媒体库页面
                   └─ T-03-06 媒体选择弹窗

  T-03-11 标签表
    └─ T-03-12 标签 CRUD
         └─ T-03-13 编辑器标签输入

阶段 04 关键路径：
  T-04-01 评论/审计表
    └─ T-04-02 评论提交/列表
         └─ T-04-03 评论审核
              └─ T-04-05 评论管理页

  T-04-06 用户列表
    └─ T-04-07 禁用/重置密码
         └─ T-04-08 用户管理页
```

---

## 7. 技术债务映射

任务与技术债务（见 `03-technical-plan.md` 第 9 节）的对应关系：

| 债务编号 | 债务描述 | 对应任务 | 阶段 |
| --- | --- | --- | --- |
| TD-01 | go.sum 缺少 JWT v5.3.1 校验 | T-01-01 | 01 |
| TD-02 | 管理 API 无认证 | T-01-08 ~ T-01-12 | 01 |
| TD-03 | package-lock.json 与 pnpm-lock.yaml 并存 | T-01-02 | 01 |
| TD-04 | 错误响应不统一 | T-01-04, T-01-13 | 01 |
| TD-05 | 无健康检查 | T-01-06 | 01 |
| TD-06 | 无 CI | T-01-19 | 01 |
| TD-07 | 首页和仪表盘使用 mockData | T-02-09, T-02-11 | 02 |
| TD-08 | content_html 从不生成 | T-02-01, T-02-02 | 02 |
| TD-09 | siteBranding 是静态常量 | T-03-14, T-03-15 | 03 |
| TD-10 | SQLite schema 只有 4 张表 | T-03-01, T-03-11, T-04-01 | 03-04 |
| TD-11 | personas.ts 模拟权限 | T-01-15 | 01 |
| TD-12 | 旧首页组件并存 | 阶段 02 后清理 | 02+ |
| TD-14 | 测试规范与结构冲突 | 待确认 Q-009 | 01 |
| TD-16 | 无限流 | T-04-13 | 04 |
| TD-17 | 无日志脱敏 | T-04-12 | 04 |
| TD-18 | 无备份恢复 | T-04-11, T-04-18 | 04 |
| TD-19 | 无发布回滚 | T-04-15 | 04 |
| TD-20 | README/ARCHITECTURE 文档过时 | T-01-20 | 01 |

---

## 8. 交付物清单

按阶段汇总的交付物，用于验收和 PR 拆分参考：

### 8.1 阶段 01 交付物

- `go.sum` 修复（T-01-01）
- 前端锁文件和构建配置统一（T-01-02）
- `internal/platform/http/middleware/request_id.go`（T-01-03）
- `internal/platform/http/errors.go` + 错误中间件（T-01-04）
- `server.go` 超时和 body 上限（T-01-05）
- `internal/platform/http/handler/health.go`（T-01-06）
- 管理员初始化命令（T-01-07）
- `internal/modules/auth/` handler（T-01-08 ~ T-01-10）
- `internal/platform/http/middleware/auth.go`（T-01-11）
- `cmd/server/app.go` 路由注册修改（T-01-12）
- 现有 handler 错误响应修改（T-01-13）
- `frontend/src/app/(auth)/login/page.tsx`（T-01-14）
- `frontend/src/components/admin/adminShell.tsx` 修改（T-01-15, T-01-16）
- `frontend/src/lib/api/client.ts`（T-01-17）
- 认证集成测试（T-01-18）
- `.github/workflows/ci.yml`（T-01-19）
- README + ARCHITECTURE 更新（T-01-20）

### 8.2 阶段 02 交付物

- `internal/shared/markdown/renderer.go`（T-02-01）
- content handler 集成渲染（T-02-02, T-02-03）
- 后台文章详情接口（T-02-04）
- slug 唯一校验（T-02-05）
- `frontend/src/app/admin/postManagement/page.tsx`（T-02-06）
- 编辑器重写（T-02-07）
- `frontend/src/app/posts/[slug]/page.tsx`（T-02-08）
- 首页 articleSection 修改（T-02-09）
- AdminShell 导航修改（T-02-10）
- Dashboard 修改（T-02-11）
- PostgreSQL 集成测试（T-02-12）
- 核心 E2E 测试（T-02-13）

### 8.3 阶段 03 交付物

- SQLite schema 追加 files 表（T-03-01）
- `internal/modules/media/`（T-03-02, T-03-03）
- 静态文件服务配置（T-03-04）
- `frontend/src/app/admin/media/page.tsx`（T-03-05）
- `frontend/src/components/admin/mediaPicker.tsx`（T-03-06）
- 分类 CRUD（T-03-07, T-03-08）
- `frontend/src/app/admin/categories/page.tsx`（T-03-09）
- 编辑器分类选择（T-03-10）
- SQLite schema 追加标签表（T-03-11）
- 标签 CRUD 和关联（T-03-12）
- 编辑器标签输入（T-03-13）
- 公开设置接口（T-03-14）
- `frontend/src/lib/site-settings.ts` 修改（T-03-15）
- 首页分类筛选（T-03-16）
- 详情页分类标签展示（T-03-17）
- 测试（T-03-18）

### 8.4 阶段 04 交付物

- SQLite schema 追加 comments/audit_logs 表（T-04-01）
- `internal/modules/comments/`（T-04-02, T-04-03）
- 详情页评论区（T-04-04）
- `frontend/src/app/admin/comments/page.tsx`（T-04-05）
- 用户列表和管理 handler（T-04-06, T-04-07）
- `frontend/src/app/admin/users/page.tsx`（T-04-08）
- `internal/platform/http/middleware/audit.go`（T-04-09）
- `frontend/src/app/admin/audit-logs/page.tsx`（T-04-10）
- `scripts/backup.sh`, `scripts/restore.sh`（T-04-11）
- 日志脱敏（T-04-12）
- `internal/platform/http/middleware/ratelimit.go`（T-04-13）
- 环境变量化配置（T-04-14）
- `scripts/deploy.sh`, `scripts/rollback.sh`（T-04-15）
- 正式文档（T-04-16）
- 安全回归测试（T-04-17）
- 备份恢复演练记录（T-04-18）

---

## 9. 使用说明

1. **执行顺序**：严格按阶段顺序推进，阶段内按各文档"推荐开发顺序"执行。
2. **PR 拆分**：每个任务对应一个独立 PR；可并行的任务可合并为同一 PR，但须在 PR 描述中标注包含的任务编号。
3. **进度跟踪**：完成任务后在对应阶段文档和本表中标记状态。
4. **依赖确认**：标注"需先确认 Q-xxx"的任务，须在 `05-decisions-and-open-questions.md` 中确认对应决策后方可启动。
5. **验收**：每个任务的"验收条件"是 PR 合并的硬性标准，须在 PR 中提供验证证据（测试结果、截图或命令输出）。
