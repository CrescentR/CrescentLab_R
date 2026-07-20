# CrescentLab 技术规划

> 基线：2026-07-18
> 站位：技术主管视角，为产品规划提供技术支撑
> 原则：不引入与当前项目规模不匹配的复杂架构

---

## 1. 当前架构评价

### 1.1 合理且应保留的部分

| 部分 | 评价 | 证据 |
| --- | --- | --- |
| 模块化单体后端 | 适合当前单人/小团队开发体量，模块边界清晰 | `internal/modules/<module>/` 结构 |
| Go + Gin + database/sql | 直接、可控，不引入 ORM 黑盒 | `go.mod`、`internal/platform/database/` |
| SQLite 开发 + PostgreSQL 生产 | 双驱动兼容，降低本地开发门槛 | `database.go` switch driver |
| Next.js App Router | 现代前端架构，SSR/SSG 能力可用 | `frontend/src/app/` |
| 手动 SQL 导入，不自动迁移 | 避免生产数据被自动修改 | `database/sqlite/schema.sql`、`database/postgres/schema.sql` |
| Tailwind CSS 4 + CSS Variables | 设计 token 沉淀为变量 | `frontend/src/app/globals.css` |
| 逻辑关联不使用物理外键 | 跨表一致性由应用层维护，便于多数据库 | `docs/DATABASE_SCHEMA.md` |

### 1.2 存在问题但暂不动的部分

| 部分 | 问题 | 建议 |
| --- | --- | --- |
| PostgreSQL 71 张表 | 远超当前产品能力，形成认知负担 | 不删除，只在文档中标注为"历史设计资产"；按阶段激活需要的表 |
| `mockData.ts` | 首页和仪表盘使用静态数据 | 阶段 02 接入真实 API 后逐步替换 |
| `personas.ts` | 用 localStorage 模拟权限 | 阶段 01 实现真实认证后退出权限链 |

### 1.3 需要重构的部分

| 部分 | 问题 | 重构方向 | 阶段 |
| --- | --- | --- | --- |
| `app.go` 路由注册 | 管理路由无中间件保护 | 增加 JWT 中间件 | 阶段 01 |
| Handler 直接调用 Repository | 缺少 service 层，业务逻辑分散 | 随着业务复杂度增加逐步引入 service 层 | 阶段 02+ |
| 错误响应 | 直接返回 `err.Error()`，格式不统一 | 统一错误码和结构 | 阶段 01 |
| HTTP Server 超时 | 只有 `ReadHeaderTimeout` | 补齐 Read/Write/Idle 超时和 body 上限 | 阶段 01 |
| `site-settings.ts` | `siteBranding` 是静态常量 | 改为从 API 加载 | 阶段 03 |

### 1.4 不应追求的"最佳实践"

- 不引入微服务（当前单体足够）
- 不引入消息队列（进程内事件总线足够，当前连事件总线都不需要）
- 不引入 Redis（内存缓存和 SQLite 足够）
- 不引入 Ent ORM（database/sql + 手写 SQL 更可控）
- 不引入 GraphQL（REST 足够）
- 不引入自动数据库迁移（手动 SQL 更安全）

---

## 2. 目标架构

### 2.1 架构概览

```
浏览器
  └─ Next.js :3000 (生产) 或 :3000 (开发)
      ├─ /                      公开首页
      ├─ /posts/[slug]          公开文章详情
      ├─ /login                 登录页
      ├─ /admin/*               管理后台（需认证）
      └─ /api/* rewrites
          └─ Gin :8091
              ├─ /healthz/*     健康检查
              ├─ /api/auth/*    认证接口
              ├─ /api/articles  公开文章读接口
              ├─ /api/public/*  公开读接口（设置、评论、分类）
              ├─ /uploads/*     静态文件服务
              └─ /api/admin/*   管理接口（JWT 中间件保护）
                  └─ database/sql
                      ├─ SQLite（开发）
                      └─ PostgreSQL（生产）
```

### 2.2 架构原则

1. **单体优先**：一个 Go 进程 + 一个 Next.js 进程，通过同源转发解耦。
2. **模块化内部**：`internal/modules/<module>/` 各自独立，不跨模块直接访问 Repository。
3. **安全前置**：所有管理接口必须有认证中间件，不依赖前端隐藏。
4. **渐进式分层**：简单模块 Handler 直接调 Repository；复杂模块引入 Service 层。
5. **双库等价**：SQLite 和 PostgreSQL 对核心路径表现一致，通过 driver 切换 SQL 占位符。

---

## 3. 模块边界

### 3.1 后端模块职责

| 模块 | 职责 | 不应做 |
| --- | --- | --- |
| `platform/config` | 配置加载和环境变量映射 | 不包含业务规则 |
| `platform/database` | 数据库连接和 driver 管理 | 不包含业务 SQL |
| `platform/http` | HTTP 服务器、中间件、错误处理 | 不包含业务 handler |
| `platform/http/middleware` | 认证、限流、request_id、审计 | 不直接操作业务数据 |
| `platform/logger` | 日志输出和脱敏 | 不包含业务逻辑 |
| `platform/storage` | 文件存储适配（本期只有本地） | 不包含文件管理业务逻辑 |
| `shared/auth` | JWT 和 bcrypt 工具 | 不包含 HTTP handler |
| `shared/markdown` | Markdown 渲染和 HTML 净化 | 不包含业务逻辑 |
| `shared/validate` | 通用校验器 | 不包含业务规则 |
| `modules/content` | 文章 CRUD、分类、标签 | 不直接操作 users 表 |
| `modules/settings` | 设置读写 | 不包含前端展示逻辑 |
| `modules/users` | 用户 CRUD、状态管理 | 不包含 JWT 签发（用 shared/auth） |
| `modules/media` | 文件上传、列表、删除 | 不直接操作 articles 表 |
| `modules/comments` | 评论提交、展示、审核 | 不直接操作 articles 表（通过 article_id 逻辑关联） |
| `modules/auth`（新增） | 登录、刷新、退出 handler | 不包含 JWT 实现（用 shared/auth） |

### 3.2 前端模块职责

| 目录 | 职责 | 不应做 |
| --- | --- | --- |
| `app/` | 路由和页面组件 | 不包含复杂业务逻辑 |
| `components/admin/` | 后台页面组件 | 不直接调用 fetch（通过 lib/api） |
| `components/home/` | 首页组件 | 不包含后台逻辑 |
| `components/ui/` | 基础 UI 组件（Button、Panel、Badge、Field） | 不包含业务逻辑 |
| `lib/api/` | API 客户端和拦截器 | 不包含 UI 逻辑 |
| `lib/` | 工具函数和常量 | 不包含副作用 |
| `store/` | Zustand 状态管理 | 只管理客户端 UI 状态，不管理业务数据（业务数据用 TanStack Query） |
| `types/` | TypeScript 类型定义 | 不包含运行时逻辑 |

### 3.3 跨模块协作规则

- 模块间不直接调用对方的 Repository。
- 需要跨模块数据时，通过 Handler 层组合调用（如评论提交时验证文章存在，由 comments handler 调用 content 的公开查询方法）。
- 事件总线（`shared/events`）目前不使用；如后续需要异步处理（如评论通知），再引入。

---

## 4. 数据设计方向

### 4.1 核心实体

| 实体 | 表名 | 当前状态 | 激活阶段 |
| --- | --- | --- | --- |
| 用户 | `users` | SQLite + PG 已有 | 阶段 01 |
| 设置 | `settings` | SQLite + PG 已有 | 已实现 |
| 文章 | `articles` | SQLite + PG 已有 | 已实现 |
| 分类 | `post_categories` | SQLite + PG 已有 | 阶段 03 |
| 标签 | `post_tags`, `article_tags` | PG 已有，SQLite 需补建 | 阶段 03 |
| 文件 | `files` | PG 已有，SQLite 需补建 | 阶段 03 |
| 评论 | `comments` | PG 已有，SQLite 需补建 | 阶段 04 |
| 审计日志 | `audit_logs` | PG 已有，SQLite 需补建 | 阶段 04 |
| 认证令牌 | `auth_tokens` | PG 已有，SQLite 需补建 | 阶段 01（如实现退出撤销） |
| 用户组 | `user_groups` | PG 已有，SQLite 需补建 | 阶段 04（如需用户组管理） |

### 4.2 实体关系

```
users ──< articles >── post_categories
                  └──< article_tags >── post_tags
                  └──< comments
files ──< articles.cover_url（逻辑关联，非外键）
settings（独立，无关联）
audit_logs（独立，记录操作者 user_id）
auth_tokens ── user_id（逻辑关联）
```

### 4.3 数据设计原则

- **不使用物理外键**：跨表关系用 `*_id` 逻辑字段表达，由应用层校验。
- **软删除**：核心业务表（articles、comments、files、users）保留 `deleted_at`。
- **状态字段**：使用 `TEXT + CHECK` 约束，可读且可迁移。
- **审计字段**：所有表包含 `created_at` 和 `updated_at`，由应用层写入。
- **唯一约束**：`users.username_key`、`articles.slug`、`settings.(scope, key)` 等使用数据库唯一约束。
- **不使用触发器**：`updated_at` 由应用层写入。
- **不使用视图和函数**：读模型由应用层组织。

### 4.4 数据生命周期

| 数据 | 保留策略 | 清理方式 |
| --- | --- | --- |
| 文章 | 软删除后保留，不自动物理删除 | 人工 SQL 清理 |
| 评论 | 软删除后保留 | 人工 SQL 清理 |
| 文件 | 软删除后保留，物理文件不删除 | 人工清理 |
| 审计日志 | 保留 90 天（建议） | 定时任务清理（阶段 04 后实现） |
| auth_tokens | 过期后保留 | 定时任务清理（后续实现） |

### 4.5 双库一致性策略

- SQLite schema 只包含当前已激活模块的表。
- PostgreSQL schema 保留全部 71 张表（历史设计资产），但只激活当前需要的。
- 每次新增 SQLite 表时，同步在 PostgreSQL schema 中确认对应表存在。
- 集成测试同时验证 SQLite 和 PostgreSQL 的核心路径。

---

## 5. 接口设计方向

### 5.1 接口分组

| 前缀 | 用途 | 鉴权 |
| --- | --- | --- |
| `/healthz/*` | 健康检查 | 公开 |
| `/api/auth/*` | 认证（登录、刷新、退出） | 公开（登录/刷新）/ 需认证（退出） |
| `/api/articles` | 公开文章读 | 公开 |
| `/api/public/*` | 公开读接口（设置、评论、分类） | 公开 |
| `/uploads/*` | 静态文件 | 公开 |
| `/api/admin/*` | 管理接口 | 需认证 + 管理员 |

### 5.2 请求和响应规范

- **请求格式**：JSON（`Content-Type: application/json`），文件上传使用 `multipart/form-data`。
- **响应格式**：JSON。
- **分页响应**：`{items, total, page, page_size, total_pages}`。
- **列表响应**：`{items: [...]}` 或直接数组（简单场景）。
- **错误响应**：`{code, message, request_id}`。

### 5.3 HTTP 状态码使用

| 状态码 | 使用场景 |
| --- | --- |
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无返回体） |
| 400 | 参数校验失败 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 状态冲突（如 slug 重复） |
| 413 | 请求体过大 |
| 429 | 请求频率过高 |
| 500 | 服务内部错误 |
| 503 | 服务不可用 |

### 5.4 错误码规范

| 错误码 | HTTP | 含义 |
| --- | --- | --- |
| UNAUTHORIZED | 401 | 未认证 |
| TOKEN_EXPIRED | 401 | token 过期 |
| INVALID_TOKEN | 401 | token 无效 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数校验失败 |
| CONFLICT | 409 | 状态冲突 |
| RATE_LIMITED | 429 | 请求频率过高 |
| PAYLOAD_TOO_LARGE | 413 | 请求体过大 |
| INTERNAL_ERROR | 500 | 服务内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

### 5.5 分页、搜索、筛选、排序

- **分页**：`page`（从 1 开始）、`page_size`（默认 10，最大 50）。
- **搜索**：`search` 参数，匹配 title 和 excerpt（文章）或 name（文件）。
- **筛选**：`status`、`category` 等参数。
- **排序**：服务端固定排序（如文章按 `is_pinned DESC, published_at DESC`），本期不支持客户端自定义排序。

### 5.6 鉴权

- 认证方式：`Authorization: Bearer <access_token>`。
- access token TTL：2 小时。
- refresh token TTL：7 天。
- token 类型：JWT HS256。

### 5.7 版本兼容

- 本期不实现 API 版本化（不使用 `/api/v1/`）。
- 接口变更原则：新增字段不破坏旧客户端；删除或重命名字段需要迁移期。
- 接口废弃策略：被废弃的接口返回 `Deprecation` header，并在文档中标注。

---

## 6. 权限与安全

### 6.1 登录鉴权

- 密码使用 bcrypt 哈希（cost ≥ 10）。
- 登录不区分用户名大小写（使用 `username_key`）。
- 登录失败不泄露用户是否存在。
- JWT secret 从环境变量注入，生产环境无默认值。

### 6.2 角色权限

| 角色 | 权限 |
| --- | --- |
| 访客 | 读取公开内容、发表评论 |
| 站点管理员 | 全部管理操作 |
| 未来角色（待确认） | 内容作者、编辑等 |

本期只实现"管理员"和"访客"两个角色。用户组和细粒度权限在阶段 04 后按需引入。

### 6.3 数据权限

- 管理员可操作全部数据。
- 访客只能读取 `published` 且未删除的内容。
- 评论提交不要求登录，但需要频率限制。

### 6.4 敏感信息保护

- 密码、token、密钥不出现在日志中（日志脱敏）。
- 配置文件中的密钥使用环境变量覆盖。
- `is_encrypted = true` 的设置值不通过公开接口返回。
- 评论的邮箱字段不公开展示。

### 6.5 参数校验

- 所有入参在 Handler 层校验。
- 必填字段非空检查。
- 字符串长度限制。
- 枚举值校验。
- URL 格式校验（cover_url 等）。

### 6.6 防重复提交

- 本期不实现幂等 token。
- 前端通过禁用提交按钮防止重复点击。

### 6.7 限流

- 全局限流：100 req/s（内存计数器）。
- 登录接口：10 req/min/IP。
- 评论提交：3 req/min/IP。

### 6.8 文件上传安全

- 文件类型白名单：jpg、jpeg、png、gif、webp、svg。
- 文件大小上限：10MB。
- 存储路径使用 UUID，不使用原始文件名。
- 不执行上传文件（纯静态服务）。

### 6.9 密钥管理

- JWT secret：环境变量 `CRESCENTLAB_JWT_SECRET`。
- 数据库密码：环境变量 `CRESCENTLAB_DATABASE_DSN`。
- 生产环境启动时检查必需变量，缺失则拒绝启动。
- 开发环境可使用默认值。

### 6.10 生产环境配置

- Docker Compose 生产配置不使用默认凭据。
- PostgreSQL 密码从环境变量读取。
- 前端 API 代理指向后端内部网络（不暴露后端端口）。
- HTTPS 由反向代理（Nginx）终止，后端只监听 HTTP。

---

## 7. 测试策略

### 7.1 测试分层

| 层级 | 范围 | 工具 | 优先级 |
| --- | --- | --- | --- |
| 单元测试 | Go 函数和 Repository | Go testing | 高（已部分实现） |
| 单元测试 | 前端组件 | 未引入（后续按需） | 低 |
| 集成测试 | Go Handler + SQLite/PostgreSQL | Go testing + testcontainers（PG） | 高 |
| 接口测试 | API 契约验证 | Go testing | 中 |
| E2E 测试 | 核心用户流程 | Playwright（后续引入） | 高 |

### 7.2 必须优先测试的模块

| 模块 | 原因 | 测试类型 |
| --- | --- | --- |
| `shared/auth` | 安全核心 | 单元测试 |
| `platform/http/middleware`（认证） | 安全核心 | 单元 + 集成 |
| `modules/content` | 核心业务 | 单元 + 集成（双库） |
| `shared/markdown` | XSS 防护 | 单元测试 |
| 登录→发布→阅读→删除 | 核心流程 | E2E |

### 7.3 测试数据

- 单元测试使用 SQLite 临时文件（`t.TempDir()`）。
- PostgreSQL 集成测试使用 Docker 临时容器（或 CI 中的 service container）。
- 不使用生产数据。
- 测试数据在测试结束后自动清理。

### 7.4 测试环境

- 本地开发：SQLite 临时文件。
- CI：SQLite 临时文件 + PostgreSQL service container。
- 不在测试中依赖外部网络（除 Docker 镜像拉取）。

### 7.5 回归测试

- 每次 PR 必须通过 CI 的全部测试。
- E2E 测试覆盖核心流程，不追求全量覆盖。
- 修复 bug 时先写复现测试，再修复。

### 7.6 测试规范

- 遵循 `docs/develop-guides/testing-guidelines.md`。
- Go 测试与包同目录（当前实践），不迁移到 `backend/test/`（规范冲突待确认，见 Q-009）。
- 测试函数命名：`Test<行为>`。
- 不为简单 getter/setter 写测试。

---

## 8. 部署与运维

### 8.1 环境分层

| 环境 | 用途 | 数据库 | 配置 |
| --- | --- | --- | --- |
| 本地开发 | 日常开发 | SQLite | `data/conf.ini` |
| CI | 自动化测试 | SQLite 临时文件 + PG container | 无配置文件 |
| 生产 | 正式运行 | PostgreSQL | 环境变量覆盖 |

### 8.2 Docker

- **Dockerfile**：多阶段构建（Go 编译 + 前端构建 + 运行时镜像）。
- **docker-compose.yml**：PostgreSQL + backend + frontend 三服务。
- **生产 Compose**：不使用默认凭据，从 `.env` 读取。
- **镜像标签**：版本号标签（`crescentlab:v1.0.0`）+ latest。

### 8.3 配置隔离

| 配置项 | 开发默认值 | 生产来源 |
| --- | --- | --- |
| server.port | 8091 | 环境变量 |
| database.driver | sqlite | 环境变量 `CRESCENTLAB_DATABASE_DRIVER` |
| database.dsn | data/crescentlab.db | 环境变量 `CRESCENTLAB_DATABASE_DSN` |
| JWT secret | 随机生成 | 环境变量 `CRESCENTLAB_JWT_SECRET`（必需） |
| log level | info | 环境变量 `CRESCENTLAB_LOG_LEVEL` |

### 8.4 数据库迁移

- 不使用自动迁移工具。
- SQL 变更文件单独提交、人工 review、手动执行。
- 变更文件命名：`database/migrations/YYYYMMDD-description.sql`（后续建立）。
- 变更前备份。

### 8.5 日志

- 使用 Go `slog` 结构化日志。
- 日志级别：debug、info、warn、error。
- 日志格式：JSON（生产）或文本（开发）。
- 日志包含：request_id、user_id（如适用）、method、path、status、latency。
- 日志脱敏：password、token、secret 字段值替换为 `***`。
- 日志输出到 stdout（Docker 收集）或文件（本地）。

### 8.6 健康检查

- `GET /healthz/live`：进程存活，返回 200。
- `GET /healthz/ready`：数据库可用 + 核心表存在，返回 200/503。
- Docker Compose healthcheck 使用 `/healthz/ready`。
- 外部监控定期调用 `/healthz/ready`。

### 8.7 备份

- PostgreSQL：`pg_dump` 导出到 `data/backup/`。
- 自动清理 7 天前备份。
- 备份脚本：`scripts/backup.sh`。
- 恢复脚本：`scripts/restore.sh`。
- 定期恢复演练（阶段 04 验证）。

### 8.8 回滚

- Docker 镜像版本标签。
- 发布脚本：`scripts/deploy.sh`。
- 回滚脚本：`scripts/rollback.sh`。
- 发布失败自动回滚（健康检查不通过时）。
- 数据库变更不自动回滚。

### 8.9 监控

- 健康检查端点。
- 日志级别管理。
- 后续可接入外部监控（Prometheus + Grafana 或云服务），本期不实现。
- 关键指标：请求量、错误率、响应时间、数据库连接数。

### 8.10 告警

- 健康检查连续 3 次失败触发告警（外部监控实现）。
- 日志 ERROR 级别触发告警（外部监控实现）。
- 告警渠道：邮件或 webhook（运维配置）。

---

## 9. 技术债务清单

| 编号 | 债务 | 优先级 | 推荐处理阶段 | 说明 |
| --- | --- | --- | --- | --- |
| TD-01 | `go.sum` 缺少 JWT v5.3.1 校验 | P0 | 阶段 01 | 阻塞干净环境构建 |
| TD-02 | 管理 API 无认证 | P0 | 阶段 01 | 安全风险 |
| TD-03 | `package-lock.json` 与 `pnpm-lock.yaml` 并存 | P1 | 阶段 01 | 包管理器漂移 |
| TD-04 | 错误响应不统一 | P1 | 阶段 01 | 前端难处理 |
| TD-05 | 无健康检查 | P1 | 阶段 01 | 运维不可观测 |
| TD-06 | 无 CI | P1 | 阶段 01 | 质量无门禁 |
| TD-07 | 首页和仪表盘使用 mockData | P1 | 阶段 02 | 核心链路未闭环 |
| TD-08 | `content_html` 从不生成 | P1 | 阶段 02 | 无安全渲染 |
| TD-09 | `siteBranding` 是静态常量 | P2 | 阶段 03 | 设置不生效 |
| TD-10 | SQLite schema 只有 4 张表 | P2 | 阶段 03-04 | 按阶段补建 |
| TD-11 | `personas.ts` 模拟权限 | P2 | 阶段 01 | 退出权限链 |
| TD-12 | 旧首页组件与 Lab 首页并存 | P3 | 阶段 02 后 | 清理确认无引用后删除 |
| TD-13 | Git 提交信息不规范 | P3 | 持续 | 后续按 Conventional Commits |
| TD-14 | 测试规范与 Go 项目结构冲突 | P3 | 阶段 01 | 决定修订规范还是迁移测试 |
| TD-15 | PostgreSQL 71 表认知负担 | P3 | 持续 | 文档标注历史资产 |
| TD-16 | 无限流 | P2 | 阶段 04 | 安全加固 |
| TD-17 | 无日志脱敏 | P2 | 阶段 04 | 安全加固 |
| TD-18 | 无备份恢复 | P2 | 阶段 04 | 生产就绪 |
| TD-19 | 无发布回滚 | P2 | 阶段 04 | 生产就绪 |
| TD-20 | README/ARCHITECTURE 文档过时 | P2 | 阶段 01 | 文档与代码不一致 |
