# 后端开发规划

> 日期：2026-07-07
> 范围：后端模块逐步实现

## 一、现状

### 已实现

| 层 | 文件 | 状态 |
|----|------|------|
| platform/config | INI 配置加载 | ✅ |
| platform/database | SQLite + PostgreSQL 双驱动 | ✅ |
| platform/http | Gin 服务器 + 请求日志 | ✅ |
| platform/logger | slog 文本日志 | ✅ |
| modules/settings | settings 表 CRUD + handler + 测试 | ✅ |
| cmd/server | app.go 组装启动 | ✅ |

### 未实现

`internal/modules` 下 12 个模块目录，只有 `settings` 有代码，其余为空：
albums, analytics, comments, content, links, media, music, notifications, plugins, themes, users

`internal/shared` 下 6 个目录全为空：
auth, events, idgen, markdown, security, validate

### 数据库 schema

PostgreSQL schema 完整定义了 50+ 张表，分 12 个区域。SQLite schema 只有 `settings` 一张表。

## 二、切入点选择：文章（content）模块

### 为什么选 content 作为切入点

1. **前端已有消费方**：首页 ArticleSection 使用 mock 数据展示文章列表，接入后端后可立即看到效果
2. **schema 已就绪**：`articles` + `post_categories` + `post_tags` + `article_tags` 表已定义
3. **模式复用**：content 模块的 repository/handler 分层模式可以直接复用给后续模块
4. **不依赖 auth**：文章公开列表不需要认证，可以先跑通主链路，auth 后补

### 暂不做的

- auth/权限：当前 settings 也没有 auth，content 模块先保持同样风格
- 文章历史版本（article_histories）：第一步只做 CRUD
- 文章关联关系（article_relations）：第一步不做
- SEO 字段、密码保护文章：第一步不做

## 三、分步计划

### 第一步：content 模块 — 文章列表 API

**目标**：实现 `GET /api/articles` 公开接口，返回已发布文章列表

**涉及**：
- SQLite schema 补 articles 表
- `internal/modules/content/model.go` — Article 结构体
- `internal/modules/content/repository.go` — List 查询
- `internal/modules/content/handler.go` — HTTP handler
- `cmd/server/app.go` — 注册路由
- 测试：repository_test.go + handler_test.go

**验收**：
- `GET /api/articles` 返回已发布文章列表
- `GET /api/articles?category=xxx` 按分类筛选
- 单元测试通过

### 后续步骤（完成第一步后再规划）

- 第二步：content 模块 — 文章详情 API
- 第三步：content 模块 — 文章创建/编辑 API
- 第四步：auth 模块 — 用户注册/登录
- 第五步：为已有 API 补充认证中间件
- ...

## 四、Checklist

- [x] 第一步：content 模块 — 文章列表 API ✅ 2026-07-07
- [x] 第二步：content 模块 — 文章详情 + 创建 API ✅ 2026-07-07

### 第一步完成记录

**新增文件**：
- `internal/modules/content/model.go` — Article 结构体、ListFilter、ListResult、ArticleListItem
- `internal/modules/content/repository.go` — List（分页+搜索+状态过滤+分类过滤）、GetBySlug
- `internal/modules/content/handler.go` — 公开路由 `GET /api/articles`（仅已发布）、管理路由 `GET /api/admin/articles`（全部状态）
- `internal/modules/content/repository_test.go` — 4 个测试：已发布过滤、搜索、分页、软删除排除
- `internal/modules/content/handler_test.go` — 4 个测试：公开列表、搜索、管理列表、空结果

**修改文件**：
- `database/sqlite/schema.sql` — 补充 `post_categories` + `articles` 表
- `cmd/server/app.go` — 注册 content 模块路由

**API 端点**：
- `GET /api/articles` — 公开，只返回 status=published 的文章，支持 `?page=&page_size=&search=&category=` 查询参数
- `GET /api/admin/articles` — 管理，返回所有状态的文章，额外支持 `?status=` 查询参数

**测试结果**：8/8 通过，全项目测试无回归

---

### 第二步完成记录

**目标**：
- `GET /api/articles/:slug` — 公开文章详情（含 markdown 正文）
- `POST /api/admin/articles` — 创建文章

**修改文件**：
- `internal/modules/content/model.go` — 新增 `ArticleDetail` 结构体、`Article.Detail()` 投影方法、`CreateInput` 输入类型及 `Validate()` 校验
- `internal/modules/content/repository.go` — 新增 `Create` 方法（含默认值填充、published_at 条件写入）；提取 `scanArticleRow` helper 消除 `GetBySlug`/`GetByID` 重复扫描逻辑；`GetBySlug` 和 `GetByID` 共用 helper
- `internal/modules/content/handler.go` — 新增 `detail` handler（公开，仅返回已发布文章）、`create` handler（管理，创建文章）；注册 `GET /api/articles/:slug` 和 `POST /api/admin/articles` 路由
- `database/sqlite/schema.sql` — `articles.slug` 增加 `UNIQUE` 约束（与 PostgreSQL 的 `ux_articles_slug_active` 部分唯一索引对齐）

**新增测试**：
- `repository_test.go` — 6 个新测试：GetBySlug 正常/不存在/软删除排除、Create 默认值/published_at 写入/校验失败/重复 slug
- `handler_test.go` — 5 个新测试：detail 返回已发布/detail 不存在/detail 隐藏草稿、create 创建成功/校验失败/重复 slug

**API 端点**：
- `GET /api/articles/:slug` — 公开，返回已发布文章详情（含 `content_md`、`content_html` 正文字段）；草稿/归档文章返回 404
- `POST /api/admin/articles` — 管理，创建文章；自动填充默认值（status=draft、source_format=markdown）；published 状态自动写入 `published_at`

**测试结果**：19/19 通过（含第一步原有 8 个测试，无回归）

---

## 下一步规划

### 第三步：content 模块 — 文章编辑 + 删除 API

**目标**：
- `PUT /api/admin/articles/:id` — 编辑文章
- `DELETE /api/admin/articles/:id` — 软删除文章

**涉及**：
- `repository.go` 补充 `Update` + `SoftDelete` 方法
- `handler.go` 补充 `update` / `delete` handler
- 测试补充

### 第四步：auth 模块 — 用户注册/登录

**目标**：
- `POST /api/auth/register` — 用户注册
- `POST /api/auth/login` — 用户登录
- 实现 JWT 签发与验证

### 第五步：为已有 API 补充认证中间件

**目标**：
- `/api/admin/*` 路由组增加 JWT 认证中间件
- 未认证请求返回 401
