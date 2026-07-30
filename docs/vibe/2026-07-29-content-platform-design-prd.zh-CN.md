# CrescentLab 内容平台设计 PRD

> 日期：2026-07-29
> 版本：V1.0
> 状态：设计稿，待评审
> 合并来源：`docs/vibe/2026-07-29-homepage-content-prd.md`（首页内容边界）+ `docs/vibe/2026-07-29-content-platform-prd.zh-CN.md`（内容平台能力蓝图）
> 文档性质：**落地设计文档**，包含需求、数据设计、后端设计、前端设计与技术需求，可直接拆分为开发任务

---

## 1. 两份文档的关系与本文档的定位

两份来源文档处在不同层面，本身不冲突，但都无法单独驱动开发：

| 来源文档 | 回答的问题 | 缺什么 |
| --- | --- | --- |
| 首页内容 PRD | 公开端**应该展示什么内容**、每个区块的收录条件与字段模板 | 明确声明"不定义数据库字段、API、后台表单" |
| 内容平台 PRD | 内容**如何被生产**：草稿、版本、发布、媒体、存储 | 技术无关的通用 CMS 蓝图，没有对齐本仓库的实际技术栈与现状 |

**本文档的合并主线：**

> 首页内容 PRD 定义了"公开端的内容契约"（验收面）；
> 内容平台 PRD 定义了"生产这些内容所需的能力"（实现面）。
> 二者的接缝是：**首页每个区块的每一个字段，都必须能追溯到某张表的某一列，并由一个已发布版本产出。**

这条主线直接暴露了当前最大的问题：首页 PRD 要求"正在构建"提供 7 个结构化字段，但代码里没有任何一张表能承载它；首页 PRD 要求"实验观测台"和"项目"展示真实数据，但这两个模块只有管理端接口，没有公开接口。

因此本文档以"**让首页内容契约的每一个字段都由真实发布版本供给**"为设计约束，向下展开完整的内容平台设计。

---

## 2. 现状基线（事实核对）

以下为写作本文档时对仓库的实测结果，是所有设计决策的前提。**不要基于 `docs/planning/` 或 `AGENTS.md` 的描述假设现状**，二者与代码存在偏差。

### 2.1 技术栈

| 层 | 技术 | 来源 |
| --- | --- | --- |
| 后端语言 | Go 1.26 | `go.mod:3` |
| Web 框架 | Gin v1.12.0 | `go.mod:7` |
| 数据访问 | **无 ORM**，`database/sql` + 手写 SQL | `internal/platform/database/database.go` |
| 数据库 | PostgreSQL 16（生产）/ SQLite（本地默认） | `docker-compose.yml`、`default_files/conf.ini` |
| 迁移工具 | **无**，手工导入 `schema.sql` | `docs/DATABASE_SCHEMA.md:10-11` |
| 鉴权 | JWT HS256 + bcrypt | `golang-jwt/jwt/v5 v5.3.1` |
| Markdown | goldmark + bluemonday 净化 | `go.mod` |
| 前端 | **Next.js 16 App Router + React 19 + TypeScript** | `frontend/package.json` |
| 样式 | **Tailwind CSS v4 + CSS 变量**（非 Less） | `frontend/src/app/globals.css` |
| 编辑器 | TipTap v3 | `@tiptap/react ^3.28.0` |
| 状态 | Zustand v5；react-query 已装但**无实际使用** | `frontend/src/store/uiStore.ts` |
| 动效/3D | GSAP、Motion、Lenis、three + @react-three/fiber | `frontend/package.json` |
| 图标 | lucide-react | `frontend/package.json` |

**与规范文档的偏差（需同步修正规范，不要按规范写代码）：**

- 前端目录是 `frontend/`，**不是** `web/`；API 层在 `frontend/src/lib/api/`，**不是** `web/src/apis`。
- 样式是 Tailwind + CSS 变量，**不是** Less + `base.css`。
- 框架是 React/Next.js，**不是** Vue/UniApp；用户规约中的 Vue 选项式顺序、`kr-` 组件、`uni.request` 等条目在本仓库不适用。
- `docs/develop-guides/contributing.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`docs/.vitepress/config.mts` 均**不存在**。

### 2.2 已实现 vs 仅有表结构

`database/postgres/schema.sql` 共 **62 张表**，但只有 6 个 Go 模块被实现。

| 能力 | 状态 | 证据 |
| --- | --- | --- |
| 文章 admin CRUD + 公开列表/详情 | **已实现** | `internal/modules/content/` |
| 项目 admin CRUD | **已实现**，无公开接口 | `internal/modules/projects/` |
| 观测台 admin CRUD | **已实现**，无公开接口 | `internal/modules/observatory/` |
| 设置 admin 读写 | **已实现**；`ListPublic()` 有仓储方法但**无 HTTP 出口** | `internal/modules/settings/` |
| 认证（登录/刷新/登出） | **已实现** | `internal/modules/auth/` |
| 软删除（`deleted_at`） | **已实现** | 三个内容模块均有 `SoftDelete()` |
| 正在构建 | **不存在**：无表、无接口、无模块 | 首页读 `labHomeContent.ts` 常量 |
| 媒体 / 上传 / 存储策略 | **仅表结构**，`internal/modules/media/`、`internal/platform/storage/` 是空目录 | `schema.sql:120-285` |
| 版本历史 | **仅表结构**，`article_histories` 无任何 Go 代码引用 | `schema.sql:371-385` |
| 回收站（列表/恢复/彻底删除） | **不存在**，软删除后无任何找回入口 | 无 restore/trash 接口 |
| 定时发布 | **仅表结构**：`articles.scheduled_at`、`status='scheduled'` 存在，无 Go 代码、无任务运行器 | `internal/platform/jobs/` 空目录 |
| 任务队列 | **仅表结构**：`scheduled_jobs` / `job_runs` / `event_outbox` | `schema.sql:1051-1094` |
| RBAC | **仅表结构**；运行时只用 `users.is_system` → JWT `is_admin` 布尔 | `internal/modules/auth/handler.go:79-82` |
| 分类 / 标签 CRUD | **不存在** | 表在，无 handler |

### 2.3 首页数据来源现状

`frontend/src/components/home/homeClient.tsx:42-51` 的渲染树：

| 区块 | 组件 | 数据来源 |
| --- | --- | --- |
| Hero | `labHero.tsx` | **组件内硬编码** |
| 正在构建 | `nowBuildingSection.tsx` | **Mock**：`labHomeContent.ts` 的 `nowBuilding` |
| 实验观测台 | `experimentsSection.tsx` | **Mock**：`mockData.ts` 的 `sharedLabModules` |
| 项目 | `labProjects.tsx` | **Mock**：`mockData.ts` 的 `projectSites` |
| 笔记 | `labNotes.tsx` | **真实 API**：`GET /api/articles` |
| 关于/页脚 | `labFooter.tsx` | **组件内硬编码**，GitHub/联系方式无真实链接 |

即：首页六块内容中，**只有一块跑在真实数据上**。

### 2.4 开工前的阻塞项（P0 门禁）

| 项 | 影响 |
| --- | --- |
| `cmd/server/app.go:58-105` 存在**未解决的 Git 合并冲突** | 当前分支可能无法编译；两侧路由注册不一致 |
| `README.md`、`docs/ARCHITECTURE.md` 存在合并冲突标记 | 文档不可信 |
| `PUT /api/admin/settings` 违反项目接口规约（禁用 PUT） | 需改为 POST |
| SQLite 只有 7 张表，Postgres 有 62 张 | 本地开发无法覆盖媒体/版本相关链路 |

---

## 3. 产品目标与非目标

### 3.1 核心目标

1. **首页每个区块由真实已发布内容驱动**，`mockData.ts` / `labHomeContent.ts` 从渲染链路中彻底移除。
2. **草稿与线上严格隔离**：编辑已发布内容时，访客始终看到旧的发布版本。
3. **内容具备版本历史、版本恢复与并发保护**，不会静默覆盖。
4. **所有图片与文件进入统一媒体中心**，封面、正文图片、图片集复用同一套附件选择能力。
5. **存储方式可切换**，上层业务不感知文件落在本地磁盘还是对象存储。
6. **耗时任务状态明确**：发布、缩略图、删除、转存失败可见、可重试。
7. **正在构建成为一等内容对象**，满足首页 PRD 第 7 章的字段模板。

### 3.2 非目标（V1 明确不做）

- 实时多人协同编辑、内容锁定、可视化三方合并。
- 发布审批工作流。
- 多站点 / 多租户。
- 评论、订阅、读者账号（首页 PRD §2.3 已排除）。
- AI 写作与 AI 图片生成。
- 无限层级的网盘式目录（媒体分组只做单层）。
- 全文搜索引擎接入（V1 用数据库 `search_text` 做前缀/模糊匹配即可）。

### 3.3 角色简化决策

内容平台 PRD 列了 6 种角色。CrescentLab 是**自托管个人技术实验室**，V1 实际只有两种主体：

| 角色 | 说明 | 实现 |
| --- | --- | --- |
| 站点所有者（管理员） | 全部管理能力 | `users.is_system = true` → JWT `is_admin` |
| 访客 | 只读已发布且公开的内容 | 无 token |

**决策：V1 不引入 RBAC**，`permissions` / `user_groups` 表保持空置。权限检查退化为"是否管理员"。但所有 handler 必须**在服务端检查**，不得依赖前端隐藏按钮。多角色留到 V2，届时把 `RequireAdmin()` 换成 `RequirePermission(code)` 即可，接口形状不变。

> 取舍说明：内容平台 PRD 的 12 项权限粒度对单人站点是过度设计。这里主动降级，但保留了替换点。

---

## 4. 领域模型

### 4.1 核心概念

| 概念 | 定义 | 落库 |
| --- | --- | --- |
| **内容条目** | 稳定的业务对象，持有标题、路径、封面、可见性、发布设置 | `articles` / `projects` / `builds` / `observatory_notes` |
| **内容版本** | 正文的一次快照，是正文的唯一真实来源 | `article_versions`（由 `article_histories` 演进而来） |
| **草稿版本** | 当前正在编辑的版本，`content.draft_version_id` 指向它 | 版本表中的一行 |
| **发布版本** | 当前对外展示的版本，`content.released_version_id` 指向它 | 版本表中的一行 |
| **本地恢复副本** | 浏览器 localStorage 中的未提交内容，**不是**服务器草稿 | 前端，不落库 |
| **附件** | 上传或转存进媒体中心的文件 | `files`（`type='file'`） |
| **分组** | 单层媒体分组 | `files`（`type='folder'`，`parent_id IS NULL`） |
| **存储策略** | 附件的落盘位置与规则 | `storage_policies` |
| **图片集** | 正文中的一种内容块，引用多个附件 | 存在版本正文的 `content_json` 中 + `file_references` |
| **构建项** | "正在构建"区块的内容对象 | `builds`（**新增表**） |

### 4.2 三个概念的严格区分

首页 PRD 与内容平台 PRD 都强调这一点，界面文案不得混淆：

```
本地恢复副本   浏览器 localStorage，随时覆盖，不进历史，用户可能不知道它存在
服务器草稿     article_versions 中 is_draft = true 的那一行，需显式保存
历史版本       article_versions 中的任意一行，可查看、比较、恢复
```

### 4.3 业务关系

```text
内容条目 (articles / projects / builds / observatory_notes)
  ├── draft_version_id      → 当前草稿版本
  ├── released_version_id   → 当前发布版本（NULL 表示从未发布）
  ├── 历史版本列表          → article_versions where article_id = ?
  ├── cover_file_id         → files
  └── 已发布正文投影        → articles.content_html（发布时物化，供公开端零 JOIN 读取）

正文 (article_versions.content_json / content_md / content_html)
  ├── 文本、标题、列表、引用、代码块
  ├── 单图 / 音视频 / 文件链接   → 引用 files
  └── 图片集 gallery 节点        → 引用多个 files

媒体中心
  ├── files (file | folder)
  ├── entities        内容寻址 blob，sha256 去重，ref_count
  ├── file_entities   file 版本 → entity 映射 + object_key
  ├── file_thumbnails 派生缩略图
  ├── file_references 引用追踪（新增表）
  ├── resource_tags   附件标签（复用现有通用标签表）
  └── storage_policies
```

### 4.4 关键业务规则

沿用内容平台 PRD §9，按本项目收敛为 12 条，全部为**可测试**规则：

1. 内容主键使用自增 `id`；对外使用 `public_id` 或 `slug`，`slug` 可变且不得作为主键。
2. 草稿版本与发布版本必须分离；保存草稿**不得**改变 `released_version_id`。
3. `released_version_id IS NULL` 时，内容不得进入 `published` 状态。
4. 恢复历史版本只创建新的草稿版本，**不**改变线上内容。
5. 移入回收站立即停止公开访问，但保留全部版本与关联数据。
6. 彻底删除内容**默认不级联删除附件**。
7. 删除附件必须清理物理文件与全部派生资源；任一步失败保留 `delete_failed` 状态并可重试。
8. 图片集中移除图片只解除正文引用，**不**删除附件。
9. 同一附件可被多个内容、封面、图片集复用（`entities.ref_count` 与 `file_references` 共同保证）。
10. 自动摘要、公开页面、搜索索引**只读发布版本**。
11. 所有耗时或最终一致的操作必须提供 `processing` / `succeeded` / `failed` 三态。
12. 派生任务（缩略图、索引、摘要）失败**不得**导致正文或原附件丢失。

---

## 5. 数据设计

### 5.1 变更总览

| 类型 | 对象 | 说明 |
| --- | --- | --- |
| 新增表 | `builds` | "正在构建"内容对象 |
| 新增表 | `content_versions` | 统一版本表，替代 `article_histories` 的用法 |
| 新增表 | `file_references` | 附件引用追踪 |
| 新增表 | `schema_migrations` | 迁移版本记录 |
| 改造表 | `articles` | 增加版本指针、发布结果、乐观锁字段 |
| 改造表 | `projects` | 增加版本指针、`slug` 公开读取所需索引 |
| 改造表 | `observatory_notes` | 增加首页所需结构化字段 |
| 改造表 | `files` | 增加生命周期状态、处理状态 |
| 沿用表 | `entities` / `file_entities` / `file_thumbnails` / `direct_links` / `upload_sessions` / `upload_chunks` / `storage_policies` | 结构已足够，直接实现 |
| 沿用表 | `tags` / `resource_tags` | 附件标签用 `resource_type='file'` |
| 沿用表 | `scheduled_jobs` / `job_runs` / `event_outbox` / `audit_logs` | 直接实现 |
| 废弃 | `article_histories` | 由 `content_versions` 取代；**保留空表不删**，避免破坏现有 schema 导入 |

### 5.2 新增：`builds`（正在构建）

字段与首页 PRD §7.4 的字段模板**一一对应**，不多不少：

```sql
CREATE TABLE builds (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  public_id TEXT UNIQUE,
  owner_id BIGINT,
  project_id BIGINT,                                    -- 关联的项目（可空，首页 §12.1）
  name TEXT NOT NULL,                                   -- 名称
  slug TEXT NOT NULL,
  one_liner TEXT NOT NULL DEFAULT '',                   -- 一句话定义，20-40 字
  stage TEXT NOT NULL DEFAULT 'prototype',              -- 当前阶段
  round_goal TEXT NOT NULL DEFAULT '',                  -- 本轮目标
  latest_progress TEXT NOT NULL DEFAULT '',             -- 最新进展
  next_step TEXT NOT NULL DEFAULT '',                   -- 下一步
  detail_url TEXT,                                      -- 详情入口
  demo_url TEXT,                                        -- 演示入口
  repo_url TEXT,                                        -- 仓库入口
  status TEXT NOT NULL DEFAULT 'draft',                 -- 发布结果
  sort_order INTEGER NOT NULL DEFAULT 0,
  progressed_at TIMESTAMPTZ,                            -- 更新时间（真实进展发生的时间，非 updated_at）
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  CHECK (stage IN ('prototype', 'development', 'validating', 'beta', 'paused')),
  CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE UNIQUE INDEX ux_builds_slug_active ON builds (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_builds_home ON builds (status, sort_order, progressed_at DESC) WHERE deleted_at IS NULL;
```

**设计说明：**

- `stage` 的枚举直接来自首页 PRD §7.4 的"原型、开发、验证、内测、暂停"。
- `progressed_at` 与 `updated_at` 分开：首页要展示的是"最近一次真实进展的日期"，而不是"最后一次改了错别字的时间"。首页 PRD §7.2 的"最近 30 天内有真实进展"规则依赖这一列。
- `builds` **不使用版本表**。构建项是短字段结构化内容，没有长正文，引入草稿/发布双版本是过度设计。用 `status` 的 draft/published 即可。这是相对 `articles` 的有意差异化，需在评审时确认。

### 5.3 新增：`content_versions`（统一版本表）

```sql
CREATE TABLE content_versions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  resource_type TEXT NOT NULL,                          -- article | project
  resource_id BIGINT NOT NULL,
  version INTEGER NOT NULL,                             -- 从 1 递增，按 resource 维度
  editor_id BIGINT,
  title TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  source_format TEXT NOT NULL DEFAULT 'markdown',       -- markdown | tiptap | html
  content_md TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',                -- 已净化
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,      -- TipTap 文档，source_format='tiptap' 时为真实来源
  word_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 0,
  change_summary TEXT,
  is_release_point BOOLEAN NOT NULL DEFAULT false,      -- 是否曾作为发布版本
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (resource_type, resource_id, version),
  CHECK (version >= 1),
  CHECK (resource_type IN ('article', 'project')),
  CHECK (source_format IN ('markdown', 'tiptap', 'html'))
);

CREATE INDEX idx_content_versions_resource ON content_versions (resource_type, resource_id, version DESC);
```

**为什么不直接用 `article_histories`：** 该表被 `article_id` 硬绑定到文章，而项目详情（`projects.content_html`）同样需要版本能力。统一成 `resource_type + resource_id` 后，后续接入 `pages`、`doc_series` 无需再建表。`article_histories` 保留为空表，避免改动 `schema.sql` 已有 DDL 引发导入风险。

### 5.4 改造：`articles`

```sql
ALTER TABLE articles ADD COLUMN draft_version_id BIGINT;
ALTER TABLE articles ADD COLUMN released_version_id BIGINT;
ALTER TABLE articles ADD COLUMN version_lock INTEGER NOT NULL DEFAULT 1;   -- 乐观锁
ALTER TABLE articles ADD COLUMN publish_error TEXT;                        -- 发布失败原因
ALTER TABLE articles ADD COLUMN trashed_at TIMESTAMPTZ;                    -- 回收站时间
ALTER TABLE articles ADD COLUMN trashed_by BIGINT;

-- 扩展生命周期状态
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;
ALTER TABLE articles ADD CONSTRAINT articles_status_check CHECK (
  status IN ('draft', 'scheduled', 'publishing', 'published', 'publish_failed', 'unpublished', 'archived')
);
```

**状态模型（对应内容平台 PRD §8.4.1"意图与结果必须分开"）：**

| 状态 | 含义 | 触发 |
| --- | --- | --- |
| `draft` | 从未发布 | 新建 |
| `scheduled` | 已排定未来发布时间，等待执行（意图） | 设置 `scheduled_at` |
| `publishing` | 发布任务执行中（结果未知） | 发起发布 |
| `published` | 存在可访问的发布版本 | 发布成功 |
| `publish_failed` | 发布校验或处理失败，`publish_error` 有原因 | 发布失败 |
| `unpublished` | 曾发布，当前已下线 | 主动下线 |
| `archived` | 归档，不在正常列表中 | 主动归档 |

**"有未发布修改"是派生状态，不落库：** `draft_version_id IS NOT NULL AND draft_version_id <> released_version_id`。响应体中作为 `has_unpublished_changes: boolean` 返回。

**`articles.content_md` / `content_html` / `excerpt` / `word_count` / `reading_time_minutes` 的语义变更：**

这些列**降级为"已发布版本的物化投影"**，只在发布成功时由发布版本写入，编辑草稿时不再更新。

> 取舍说明：更"干净"的设计是让公开端 JOIN 版本表读正文。这里选择物化投影，理由有三：
> ① 公开端读取路径保持零 JOIN，`content/repository.go` 的现有公开查询几乎不用改；
> ② 首页与文章详情是本站最热路径，避免每次请求都走版本表；
> ③ 投影只在发布这一个写入点更新，一致性边界清晰。
> 代价是数据冗余，必须由发布事务保证同步——测试用例需覆盖"发布后投影与 `released_version_id` 指向的版本内容一致"。

### 5.5 改造：`projects`

```sql
ALTER TABLE projects ADD COLUMN draft_version_id BIGINT;
ALTER TABLE projects ADD COLUMN released_version_id BIGINT;
ALTER TABLE projects ADD COLUMN version_lock INTEGER NOT NULL DEFAULT 1;
ALTER TABLE projects ADD COLUMN publish_error TEXT;
ALTER TABLE projects ADD COLUMN trashed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN trashed_by BIGINT;
ALTER TABLE projects ADD COLUMN cover_file_id BIGINT;
ALTER TABLE projects ADD COLUMN audience TEXT NOT NULL DEFAULT '';   -- 使用对象/场景，首页 PRD §9.2 收录条件

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (
  status IN ('draft', 'publishing', 'published', 'publish_failed', 'unpublished', 'archived')
);
```

项目不支持定时发布（无此需求），故状态少一个 `scheduled`。

### 5.6 改造：`observatory_notes`

首页 PRD §8.4 要求每条观测包含背景、假设、行动、观察、结论、下一步。当前表只有 `content_md` 一个正文字段，摘要无法结构化投影到首页卡片（首页需要"问题 + 关键观察 + 当前结论"三段）。

```sql
ALTER TABLE observatory_notes ADD COLUMN public_slug TEXT;
ALTER TABLE observatory_notes ADD COLUMN question TEXT NOT NULL DEFAULT '';    -- 问题 / 背景
ALTER TABLE observatory_notes ADD COLUMN observation TEXT NOT NULL DEFAULT ''; -- 关键观察
ALTER TABLE observatory_notes ADD COLUMN conclusion TEXT NOT NULL DEFAULT '';  -- 当前结论
ALTER TABLE observatory_notes ADD COLUMN next_step TEXT NOT NULL DEFAULT '';   -- 下一步，仅 active 需要
ALTER TABLE observatory_notes ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE observatory_notes ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;  -- 首页精选
ALTER TABLE observatory_notes ADD COLUMN related_build_id BIGINT;
ALTER TABLE observatory_notes ADD COLUMN related_project_id BIGINT;
ALTER TABLE observatory_notes ADD COLUMN observed_at TIMESTAMPTZ;

ALTER TABLE observatory_notes ADD CONSTRAINT observatory_notes_visibility_check
  CHECK (visibility IN ('public', 'private'));

CREATE UNIQUE INDEX ux_observatory_slug_active ON observatory_notes (public_slug)
  WHERE deleted_at IS NULL AND public_slug IS NOT NULL;
```

**`note_type` 与 `status` 的枚举保持不变**（首页 PRD §8.3 明确要求"与现有模型一致，不修改代码枚举"）：

- `note_type`：`fragment` / `failure` / `idea` / `tool_idea` / `tech_debt`
- `status`：`active` / `resolved` / `abandoned`

新增 `visibility` 是必要的：观测台大量内容是内部记录，不能因为写了就自动公开。**默认 `private`，必须显式公开。**

`is_featured` 支撑首页 PRD §8.5 的"首页精选 3 条，优先展示能体现不同结果的记录"——纯时间排序无法满足，需要人工标记。

### 5.7 改造：`files`

```sql
ALTER TABLE files ADD COLUMN lifecycle_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE files ADD COLUMN thumb_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE files ADD COLUMN last_error TEXT;
ALTER TABLE files ADD COLUMN display_name TEXT;        -- 可编辑显示名，原文件名留在 name
ALTER TABLE files ADD COLUMN width INTEGER;
ALTER TABLE files ADD COLUMN height INTEGER;

ALTER TABLE files ADD CONSTRAINT files_lifecycle_check
  CHECK (lifecycle_status IN ('active', 'deleting', 'delete_failed'));
ALTER TABLE files ADD CONSTRAINT files_thumb_check
  CHECK (thumb_status IN ('none', 'pending', 'ready', 'failed', 'unsupported'));

CREATE INDEX idx_files_owner_created ON files (owner_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_lifecycle ON files (lifecycle_status) WHERE lifecycle_status <> 'active';
```

`lifecycle_status` 是内容平台 PRD §10.5"删除失败可重试"的落点：`deleted_at` 只能表达"已删除"，无法表达"删到一半失败了"。

**媒体分组决策：** 复用 `files` 的树结构做单层分组——`type='folder'` 且 `parent_id IS NULL` 为分组，附件的 `parent_id` 指向分组，`parent_id IS NULL` 的 file 即"未分组"。不再新建分组表。删除分组时把子文件的 `parent_id` 置 NULL，不删文件。

### 5.8 新增：`file_references`（引用追踪）

```sql
CREATE TABLE file_references (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  file_id BIGINT NOT NULL,
  resource_type TEXT NOT NULL,           -- article | project | build | observatory_note | setting
  resource_id BIGINT NOT NULL,
  field TEXT NOT NULL,                   -- cover | body | gallery | branding
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (file_id, resource_type, resource_id, field)
);

CREATE INDEX idx_file_references_file ON file_references (file_id);
CREATE INDEX idx_file_references_resource ON file_references (resource_type, resource_id);
```

**写入时机：** 保存草稿版本时，后端解析 `content_json`（TipTap 文档）中所有 `image` / `gallery` / `fileLink` 节点的 `attrs.fileId`，加上 `cover_file_id`，全量重算该资源的引用行（先删后插，在同一事务内）。

**读取用途：** 附件详情展示"被 N 个内容引用"；删除附件时按已决策的策略处理（见 §12 待决策 Q-04，默认"提示后仍可删除，正文降级为失效占位"）。

### 5.9 新增：`schema_migrations` 与迁移机制

当前**没有迁移工具**，靠手工导入单个 `schema.sql`。本设计需要十余条 `ALTER TABLE`，继续手工执行不可接受。

```sql
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checksum TEXT NOT NULL
);
```

**方案：不引入第三方迁移库**，在 `internal/platform/database/migrate.go` 写约 120 行的顺序执行器：

- 迁移文件放 `database/migrations/postgres/` 与 `database/migrations/sqlite/`，命名 `0001_xxx.sql`。
- 用 `//go:embed` 打包进二进制，避免部署时漏文件。
- 启动时自动执行未应用的迁移；也可通过 `go run main.go db migrate` 手动执行。
- 每个文件在单个事务内执行；执行前校验 checksum，已应用文件被改动则**拒绝启动并报错**，不静默跳过。

> 取舍说明：golang-migrate / goose 功能更全，但会引入依赖和 CLI 安装步骤。本项目迁移量小、只有一个部署环境，自研执行器成本更低。若后续需要 down migration，再换库。

**SQLite 兼容：** SQLite 不支持 `ALTER TABLE ... DROP CONSTRAINT`，也不支持部分 `ALTER`。两套迁移目录分别维护，SQLite 版可用"建新表 + 拷数据 + 改名"或直接在建表语句里写全。**同时必须把 SQLite schema 补齐到与本设计相关的表**（目前只有 7 张），否则本地开发跑不了媒体和版本链路。

---

## 6. 后端设计

### 6.1 模块划分

沿用现有 `handler.go` + `repository.go` + `model.go` 三件套约定（无 service 层），新增模块填入现有空目录：

```
internal/
├── modules/
│   ├── auth/          [已有]
│   ├── users/         [已有]
│   ├── settings/      [已有] 新增 public handler
│   ├── content/       [已有] 改造：版本、发布、回收站、定时
│   ├── projects/      [已有] 改造：版本、发布、公开接口
│   ├── observatory/   [已有] 改造：结构化字段、公开接口
│   ├── builds/        [新增] 正在构建
│   ├── home/          [新增] 首页聚合投影
│   ├── media/         [填充] 附件、分组、上传、转存、缩略图
│   └── storage/       [新增] 存储策略管理（HTTP 层）
├── platform/
│   ├── storage/       [填充] 驱动抽象 + local 驱动
│   ├── jobs/          [填充] 任务运行器
│   └── http/          [已有]
└── shared/
    ├── markdown/      [已有] 扩展 sanitizer 允许 gallery 标记
    ├── version/       [新增] 版本读写、发布事务、乐观锁
    ├── security/      [填充] SSRF 防护、MIME 嗅探、文件名净化、密钥加解密
    └── events/        [填充] outbox 写入
```

**`home` 模块的定位（重要）：** 它**不是**一个新的业务域，而是一个**只读投影层**——按首页 PRD 的收录规则从各模块仓储读数据、裁剪字段、拼成一个响应。它不持有表、不写数据、不做缓存失效逻辑。这是刻意避免"为了首页再造一套内容聚合框架"。

### 6.2 接口规约

遵循 `AGENTS.md` 的项目接口规范：

| 规则 | 说明 |
| --- | --- |
| 读取用 GET | 列表、详情、聚合 |
| **写入一律 POST** | 禁止 PUT / PATCH / DELETE |
| 路径参数用于强 id 资源 | `/api/articles/{slug}`、`/api/admin/articles/{id}` |
| 动作作为路径后缀 | `/api/admin/articles/{id}/publish` |
| 响应包体 | 直接返回业务对象，**无 `{status, data, msg}` 信封**（与现有 `apiJson<T>()` 一致） |
| 错误包体 | `{ code, message, request_id }`，见 `internal/platform/http/errors.go` |
| 列表包体 | `{ items, total, page, page_size, total_pages }` |

**必须修复：** `PUT /api/admin/settings` → `POST /api/admin/settings/save`，前端 `settings.ts` 同步改。

### 6.3 公开 API

全部无需 token，只返回已发布且 `visibility='public'` 的内容。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/home` | **首页聚合**：hero + builds + observations + projects + notes + about |
| GET | `/api/articles` | 文章列表，query：`page` `page_size` `category` `tag` `search` |
| GET | `/api/articles/{slug}` | 文章详情 |
| GET | `/api/projects` | 项目列表，query：`page` `page_size` |
| GET | `/api/projects/{slug}` | 项目详情 |
| GET | `/api/observatory` | 观测归档，query：`note_type` `status` `page` `page_size` |
| GET | `/api/observatory/{public_slug}` | 观测详情 |
| GET | `/api/builds` | 构建列表 |
| GET | `/api/builds/{slug}` | 构建详情 |
| GET | `/api/categories` | 分类列表（供文章筛选） |
| GET | `/api/settings/public` | 公开设置：站点名、Hero 文案、GitHub、联系方式 |
| GET | `/f/{public_id}` | 附件直链下载/展示（已在 `next.config.ts` 有代理规则） |
| GET | `/api/preview/{token}` | 草稿预览，token 短时效 |

#### `GET /api/home` 响应契约

这是首页 PRD 的直接技术化产物，字段与首页 PRD 的字段模板逐条对应：

```jsonc
{
  "hero": {
    "eyebrow": "独立研究 / 构建日志",       // 身份短句
    "title": "CRESCENT LAB",
    "claim": "构建想法。运行实验。发布留存成果。",
    "description": "...",                   // 站点说明 40-80 字
    "primary_cta": { "label": "正在构建", "section_id": "building" },
    "secondary_cta": { "label": "笔记", "section_id": "notes" },
    "facts": [{ "label": "关注点", "value": "自托管内容系统" }]  // 低频事实，非实时状态
  },
  "builds": [{                              // 2-4 条，超过 4 条按 sort_order + progressed_at 截断
    "slug": "quickbox",
    "name": "QuickBox",
    "one_liner": "...",
    "stage": "development",
    "round_goal": "...",
    "latest_progress": "...",
    "next_step": "...",
    "progressed_at": "2026-07-25T00:00:00Z",
    "entry": { "type": "demo", "url": "https://..." } | null,   // 首页 §12.2：最多 1 个主要入口
    "related_project": { "slug": "crescentlab", "name": "CrescentLab" } | null
  }],
  "observations": [{                        // 恰好 3 条，is_featured 优先
    "public_slug": "pg-recovery-refuses-connection",
    "title": "...",
    "note_type": "failure",
    "status": "resolved",
    "question": "...",
    "observation": "...",
    "conclusion": "...",
    "next_step": "",                        // 仅 active 时非空
    "tags": ["postgres", "docker"],
    "observed_at": "2026-07-28T00:00:00Z",
    "related": { "type": "build", "slug": "crescentlab", "name": "CrescentLab" } | null
  }],
  "projects": [{                            // 3 条
    "slug": "crescentlab",
    "name": "CrescentLab",
    "tagline": "...",
    "description": "...",
    "audience": "...",
    "tech_stack": ["Go", "Next.js"],        // 前端最多渲染 5 个
    "cover_url": "/f/abc123",
    "demo_url": null,                       // null 时前端不渲染入口
    "repo_url": "https://github.com/...",
    "updated_at": "2026-07-20T00:00:00Z"
  }],
  "notes": [{                               // 6 篇：置顶优先，其余按 published_at 倒序
    "slug": "...",
    "title": "...",
    "excerpt": "...",
    "category": { "slug": "engineering", "name": "工程" } | null,
    "cover_url": null,
    "reading_time_minutes": 8,
    "published_at": "2026-07-26T00:00:00Z",
    "is_pinned": false,
    "related_project": { "slug": "...", "name": "..." } | null
  }],
  "about": {
    "identity": "...",
    "principle": "...",
    "links": [{ "label": "GitHub", "url": "https://github.com/..." }]  // 无真实地址时数组为空
  }
}
```

**服务端强制的内容规则（首页 PRD 的收录条件在这里落地，不交给前端）：**

| 规则 | 来源 | 实现 |
| --- | --- | --- |
| builds 最多 4 条 | §7.3 | SQL `LIMIT 4` |
| builds 少于 2 条时如实返回，不补位 | §7.3 | 不做任何填充 |
| builds 超 30 天无进展需处理 | §7.2 / §13.2 | 不自动隐藏，但在**管理端列表**标红提醒；公开端照常展示（内容责任在人，不由系统伪装） |
| observations 恰好 3 条，精选优先 | §8.5 | `ORDER BY is_featured DESC, observed_at DESC LIMIT 3` |
| observations 同项目连续记录只留一条 | §8.5 | 按 `related_build_id` / `related_project_id` 去重，保留最新 |
| projects 3 条，只展示已发布 | §9.3 | `status='published' ORDER BY sort_order, published_at DESC LIMIT 3` |
| notes 6 篇，置顶优先 | §10.6 | `ORDER BY is_pinned DESC, pin_sort, published_at DESC LIMIT 6`（**现实现请求 10 篇，需改为 6**） |
| 入口不存在时不返回字段 | §5.4 / §12.2 | URL 为空时返回 `null`，前端据此不渲染 |

**缓存：** `GET /api/home` 加 `Cache-Control: public, max-age=60, stale-while-revalidate=300`，并在发布/下线时通过 outbox 事件递增内存版本号使 ETag 失效。V1 不引入 Redis。

### 6.4 管理 API

全部位于 `/api/admin/*`，经 `RequireAuth` + `RequireAdmin`。

#### 内容（articles，projects 同构）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/articles` | 列表。query：`page` `page_size` `status` `category` `tag` `search` `visibility` `trashed`(bool) `sort` |
| GET | `/api/admin/articles/{id}` | 详情，含 `draft_version`、`has_unpublished_changes`、`version_lock` |
| POST | `/api/admin/articles` | 新建，返回 201 |
| POST | `/api/admin/articles/{id}/save` | 保存草稿。**必须携带 `base_version_lock`**，冲突返回 409 |
| POST | `/api/admin/articles/{id}/autosave` | 轻量草稿保存，不生成新历史版本（见 §6.6） |
| POST | `/api/admin/articles/{id}/publish` | 立即发布 |
| POST | `/api/admin/articles/{id}/schedule` | 定时发布，body `{ scheduled_at }` |
| POST | `/api/admin/articles/{id}/cancel-schedule` | 取消定时 |
| POST | `/api/admin/articles/{id}/unpublish` | 下线 |
| POST | `/api/admin/articles/{id}/trash` | 移入回收站 |
| POST | `/api/admin/articles/{id}/restore` | 从回收站恢复 |
| POST | `/api/admin/articles/{id}/purge` | 彻底删除 |
| POST | `/api/admin/articles/{id}/preview-token` | 生成预览短令牌 |
| POST | `/api/admin/articles/preview` | 无状态正文渲染预览（现有接口保留） |
| POST | `/api/admin/articles/batch` | 批量操作，body `{ ids[], action }`，返回 `{ succeeded, failed[] }` |
| GET | `/api/admin/articles/{id}/versions` | 版本列表 |
| GET | `/api/admin/articles/{id}/versions/{version}` | 版本详情 |
| GET | `/api/admin/articles/{id}/versions/diff` | 版本比较，query `from` `to` |
| POST | `/api/admin/articles/{id}/versions/{version}/restore` | 恢复为新草稿 |

#### 媒体

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/media/files` | 附件列表。query：`page` `page_size` `kind`(image/audio/video/file) `mime` `folder_id` `tag` `search` `policy_id` `sort` |
| GET | `/api/admin/media/files/{id}` | 附件详情，含缩略图、引用关系 |
| POST | `/api/admin/media/upload` | 直传（multipart），小文件路径 |
| POST | `/api/admin/media/upload/init` | 分片上传初始化，返回 `session_key` |
| POST | `/api/admin/media/upload/chunk` | 上传分片 |
| POST | `/api/admin/media/upload/complete` | 合并完成，返回附件 |
| POST | `/api/admin/media/upload/cancel` | 取消上传会话 |
| POST | `/api/admin/media/import-url` | URL 转存 |
| POST | `/api/admin/media/files/{id}/update` | 修改显示名、分组、标签 |
| POST | `/api/admin/media/files/{id}/delete` | 删除附件 |
| POST | `/api/admin/media/files/{id}/retry-delete` | 重试删除 |
| POST | `/api/admin/media/files/{id}/retry-thumbnail` | 重试缩略图 |
| POST | `/api/admin/media/files/batch` | 批量删除 / 移动分组 / 增删标签 |
| GET | `/api/admin/media/folders` | 分组列表 |
| POST | `/api/admin/media/folders` | 新建分组 |
| POST | `/api/admin/media/folders/{id}/update` | 重命名 |
| POST | `/api/admin/media/folders/{id}/delete` | 删除分组（子文件置为未分组） |

#### 存储策略

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/storage/policies` | 列表，含在用附件数；**密钥字段永不回显** |
| POST | `/api/admin/storage/policies` | 新建 |
| POST | `/api/admin/storage/policies/{id}/update` | 修改 |
| POST | `/api/admin/storage/policies/{id}/test` | 测试连通性 |
| POST | `/api/admin/storage/policies/{id}/set-default` | 设为默认 |
| POST | `/api/admin/storage/policies/{id}/disable` | 停用 |

#### 构建 / 观测 / 设置 / 任务

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET / POST | `/api/admin/builds` `…/{id}` `…/{id}/update` `…/{id}/publish` `…/{id}/trash` `…/{id}/restore` | 构建项管理 |
| GET / POST | `/api/admin/observatory` … | 现有接口改造为 `{id}` 风格 + `publish`（设 `visibility='public'`）+ `feature` |
| GET | `/api/admin/settings` | 现有 |
| POST | `/api/admin/settings/save` | **替代现有 PUT** |
| GET | `/api/admin/jobs/runs` | 任务执行记录，query：`status` `handler` |
| POST | `/api/admin/jobs/runs/{id}/retry` | 重试失败任务 |
| GET | `/api/admin/trash` | 跨类型回收站聚合列表 |

### 6.5 发布事务

发布是本设计中一致性要求最高的操作，必须在**单个数据库事务**内完成：

```
POST /api/admin/articles/{id}/publish
  1. SELECT ... FOR UPDATE 锁定 articles 行
  2. 校验（任一失败 → 400 VALIDATION_ERROR，状态不变，线上版本不受影响）
     - title 非空
     - slug 合法且在未删除记录中唯一
     - draft_version_id 存在且对应版本正文非空
     - visibility 合法
     - 定时时间合法（若为定时发布）
     - 正文引用的必需附件 lifecycle_status = 'active'
  3. UPDATE articles SET status = 'publishing'          -- 结果未定态
  4. 物化投影：把 draft_version 的 title/excerpt/content_md/content_html/
     word_count/reading_time_minutes 写入 articles 对应列
  5. UPDATE articles SET released_version_id = draft_version_id,
                         status = 'published',
                         published_at = COALESCE(published_at, now()),
                         publish_error = NULL,
                         version_lock = version_lock + 1
  6. UPDATE content_versions SET is_release_point = true WHERE id = draft_version_id
  7. 重算 file_references
  8. INSERT event_outbox ('article.published')          -- 触发索引、缓存失效、摘要
  9. INSERT audit_logs
  COMMIT

失败路径：ROLLBACK，随后单独 UPDATE status='publish_failed', publish_error=<原因>
```

**关键点：** 第 3 步的 `publishing` 在同一事务内会被第 5 步覆盖，对同步发布而言是瞬态。它的真正用途是**定时发布**——任务运行器先置 `publishing` 并提交，再执行后续步骤，使得中途崩溃后能被识别为"卡在发布中"并重试。

`event_outbox` 与业务写在同一事务，保证"发布成功但事件丢失"不会发生（内容平台 PRD §12.3 的最终一致要求）。

### 6.6 保存与并发控制

**乐观锁：** 编辑器打开时拿到 `version_lock`，保存时原样回传。

```sql
UPDATE articles SET version_lock = version_lock + 1, ... 
WHERE id = $1 AND version_lock = $2
-- 影响行数为 0 → 409 CONFLICT
```

409 响应体额外带上服务端最新状态，供前端展示对比：

```jsonc
{
  "code": "CONFLICT",
  "message": "内容已被其他会话更新",
  "request_id": "...",
  "current": { "version_lock": 8, "updated_at": "...", "editor": "admin" }
}
```

**V1 冲突处理范围：拒绝覆盖 + 保留本地副本。** 不做可视化合并（内容平台 PRD §8.2.4 允许 V1 降级）。前端提供"查看最新版本"和"另存为新草稿"。

**`save` 与 `autosave` 的区别（避免版本表被自动保存刷爆）：**

| 接口 | 触发 | 是否新建版本行 |
| --- | --- | --- |
| `save` | 用户主动保存 / Ctrl+S | **是**，`content_versions` 新增一行，`version + 1` |
| `autosave` | 输入停止 30s、失焦 | **否**，直接更新当前草稿版本行的内容 |

这样"历史版本"列表只包含用户认为有意义的保存点。对应内容平台 PRD §16 的待决策问题 8，本设计**选择"按每次手动保存生成"**。

### 6.7 存储抽象

`internal/platform/storage/driver.go`：

```go
// Capabilities 声明驱动支持的能力，不支持的能力必须显式降级，不得伪造成功。
type Capabilities struct {
    SignedURL       bool
    ServerThumbnail bool  // 驱动侧图片处理（如 OSS 样式），false 时由本地生成
    Multipart       bool
}

type ObjectInfo struct {
    Key       string
    SizeBytes int64
    SHA256    string
    MIME      string
}

type Driver interface {
    Name() string
    Capabilities() Capabilities

    Put(ctx context.Context, key string, r io.Reader, size int64, mime string) (ObjectInfo, error)
    Delete(ctx context.Context, keys ...string) error
    Open(ctx context.Context, key string) (io.ReadCloser, error)

    // PublicURL 返回公开直链；ok=false 表示该策略不支持公开读。
    PublicURL(key string) (url string, ok bool)
    // SignedURL 在 Capabilities().SignedURL 为 false 时必须返回 ErrUnsupported。
    SignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
    // ThumbnailURL 在 Capabilities().ServerThumbnail 为 false 时返回 ErrUnsupported，
    // 调用方转而使用 file_thumbnails 中本地生成的结果。
    ThumbnailURL(key string, style ThumbStyle) (string, error)
}

var ErrUnsupported = errors.New("storage: capability not supported by driver")
```

**V1 只实现 `local` 驱动**，落盘到 `data/uploads/`，通过 `GET /f/{public_id}` 提供访问。S3 / OSS / OneDrive 留到 V2，但接口形状已定，届时只需新增实现。

**存储路径规则：** `{root_prefix}/{yyyy}/{mm}/{sha256[:2]}/{sha256}{ext}`。内容寻址意味着相同文件天然去重（`entities.sha256` 唯一约束），`entities.ref_count` 决定物理文件何时可真正删除。

**密钥加密：** `storage_policies.secrets_ciphertext` 用 AES-256-GCM 加密，密钥从 `conf.ini` 的 `[security] secret_key` 读取（新增配置项）。**接口永不回显明文**，修改时前端传空字符串表示"保持不变"。

### 6.8 任务运行器

`internal/platform/jobs/`，进程内运行，不引入外部队列（单机自托管场景不需要）。

```go
type Handler interface {
    Code() string
    Run(ctx context.Context, payload json.RawMessage) error
}
```

| handler code | 触发方式 | 职责 |
| --- | --- | --- |
| `publish_scheduled` | cron，每分钟 | 扫描 `status='scheduled' AND scheduled_at <= now()` 执行发布 |
| `thumbnail_generate` | outbox 事件 | 生成多尺寸缩略图，写 `file_thumbnails`，更新 `files.thumb_status` |
| `file_delete` | outbox 事件 | 删物理文件 + 缩略图，成功后清记录；失败置 `delete_failed` |
| `url_import` | outbox 事件 | 下载外部 URL 并转存 |
| `outbox_dispatch` | 每 5s | 派发 `event_outbox` 中 `pending` 事件 |
| `version_prune` | cron，每日 | 按保留策略清理历史版本 |
| `home_cache_bust` | outbox 事件 | 递增首页缓存版本号 |

**并发控制：**

- PostgreSQL：`SELECT ... FROM event_outbox WHERE status='pending' AND available_at <= now() ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED`
- SQLite：单进程 + 互斥锁；**明确记录此限制**，SQLite 仅用于本地开发。

**重试：** `attempts` 递增，退避 `min(2^attempts, 300)` 秒，超过 8 次置 `failed` 并停止自动重试，等待管理员在 `/admin/jobs` 手动重试。

**幂等：** 所有 handler 必须幂等。`publish_scheduled` 先检查 `status` 仍为 `scheduled`；`file_delete` 对已不存在的物理文件视为成功。

**定时发布的权限时点（内容平台 PRD §11 的待决策项）：** **本设计选择"执行时重新校验"**——任务执行时若发起人已被禁用，任务失败并记录原因。理由是单人站点场景下"按创建时授权"没有收益，反而留下越权窗口。

### 6.9 正文格式与图片集

现有链路：TipTap 输出 HTML → 前端 `htmlToMarkdown()` → `content_md` → 后端 goldmark → `content_html`。

**问题：** 图片集是一个带布局属性（每行数量、间距、比例）的结构化块，无法在 Markdown 往返中无损保存。

**决策：TipTap 内容以 `content_json` 为唯一真实来源。**

| `source_format` | 真实来源 | 渲染 |
| --- | --- | --- |
| `markdown` | `content_md` | 后端 goldmark 渲染 → `content_html` |
| `tiptap` | `content_json` | **前端 TipTap 渲染 HTML 一并提交**，后端用 bluemonday 净化后存 `content_html` |

后端**不信任**客户端 HTML：净化策略在现有 `internal/shared/markdown` 的 sanitizer 基础上扩展允许列表——`figure`、`figcaption`、`div[data-gallery]`、`img[data-file-id][width][height]`、以及 `class` 的白名单前缀 `cl-`。任何不在允许列表的标签和属性一律剥离。

> 取舍说明：理想做法是后端自己渲染 TipTap JSON（客户端 HTML 完全不可信）。但 Go 生态没有可靠的 TipTap schema 渲染器，自己实现是一个独立项目级的工作量。当前方案的安全边界由 bluemonday 保证——即便客户端提交恶意 HTML，净化后也不会包含可执行内容。这个取舍需要在评审时明确接受。

**图片集节点数据结构（存于 `content_json`）：**

```jsonc
{
  "type": "gallery",
  "attrs": { "columns": 3, "gap": 8, "ratio": "auto" },   // ratio: auto | square
  "content": [{
    "type": "galleryItem",
    "attrs": {
      "fileId": 42,                    // 必存，支撑引用追踪与链接迁移
      "src": "/f/abc123",              // 保留 URL，附件失效时降级展示
      "alt": "...",
      "width": 1600, "height": 900     // 原始宽高，避免加载前布局跳动
    }
  }]
}
```

内容平台 PRD §8.12.3 指出"只存 URL 实现简单但无法做引用追踪"。**本设计要求必存 `fileId`。**

### 6.10 审计与可观测

- 现有 `request_id` 中间件保留，所有错误响应已携带。
- `audit_logs` 记录：发布、下线、彻底删除、附件删除、存储策略变更、设置变更。记录 `actor_id`、`action`、`target_type`、`target_id`、`before_data`、`after_data`。
- 健康检查 `GET /healthz/ready` 扩展检查项：新增 `content_versions`、`files`、`storage_policies` 表可读 + 默认存储策略可写探测。

---

## 7. 前端设计

### 7.1 路由

| 路径 | 类型 | 现状 | 变更 |
| --- | --- | --- | --- |
| `/` | 公开 | 已有，跑 mock | **改为 RSC 服务端取 `/api/home`** |
| `/articles/[slug]` | 公开 | 已有 | 保留 |
| `/articles` | 公开 | 无 | **新增**：文章归档 + 分类筛选 |
| `/projects` `/projects/[slug]` | 公开 | 无 | **新增** |
| `/observatory` `/observatory/[slug]` | 公开 | 无 | **新增**：观测归档 |
| `/builds/[slug]` | 公开 | 无 | **新增**（仅在 `detail_url` 指向站内时需要） |
| `/preview/[token]` | 公开受限 | 无 | **新增**：草稿预览 |
| `/login` | 公开 | 已有 | 补反向守卫 |
| `/admin` | 管理 | 已有，mock 指标 | 接真实统计 |
| `/admin/postManagement` | 管理 | **缺失** | **新增文章列表页**（`listAdminArticles` 已存在但无 UI） |
| `/admin/postManagement/new` | 管理 | 已有 | 改造为版本化编辑器 |
| `/admin/postManagement/[id]` | 管理 | **缺失** | **新增编辑页** |
| `/admin/projects` | 管理 | 已有 | 加版本、发布、回收站 |
| `/admin/observatory` | 管理 | 已有 | 加结构化字段、公开开关、精选 |
| `/admin/builds` | 管理 | 无 | **新增** |
| `/admin/media` | 管理 | **占位页** | **实现媒体库** |
| `/admin/storage` | 管理 | 无 | **新增存储策略** |
| `/admin/trash` | 管理 | 无 | **新增回收站** |
| `/admin/jobs` | 管理 | 无 | **新增任务与失败重试** |
| `/admin/settings` | 管理 | 已有 | 接品牌图片选择器 |

**守卫改造：** 当前鉴权只在 `adminShell.tsx:53-63` 客户端做，未登录时会先渲染再跳转。新增 `frontend/src/middleware.ts` 做边缘侧拦截，客户端守卫保留作为兜底。

> 注意：JWT 现存于 `localStorage`，Next.js middleware 读不到。需要在登录成功时**同时**写一个 `httpOnly=false` 的短标记 cookie（仅用于路由判断，不用于鉴权），真正的鉴权仍在后端。或改为把 refresh token 存 httpOnly cookie——后者更安全但改动更大，列为待决策 Q-06。

### 7.2 首页改造

**取数方式从客户端改为服务端：**

```tsx
// frontend/src/app/page.tsx
export const revalidate = 60;

export default async function HomePage() {
  const home = await getHomeSummary();   // 服务端 fetch /api/home
  return <HomeLayout data={home} />;
}
```

理由：首页是内容站的门面，服务端渲染消除加载闪烁、利于 SEO、去掉 `labNotes.tsx` 里的 `useEffect` 取数。三维 Hero 视觉（`crescentScene.tsx`）保持 `dynamic({ ssr: false })` 不变。

**组件与数据契约映射：**

| 组件 | 数据来源 | 改造 |
| --- | --- | --- |
| `labHero.tsx` | `data.hero` | 硬编码文案改为 props；`facts` 为空时不渲染该行 |
| `nowBuildingSection.tsx` | `data.builds` | 从 3 个字段扩展为 7 个字段的卡片；`entry` 为 null 时不渲染按钮 |
| `experimentsSection.tsx` | `data.observations` | 卡片摘要改为「问题 + 关键观察 + 当前结论」三段结构 |
| `labProjects.tsx` | `data.projects` | `demo_url` / `repo_url` 为 null 时不渲染入口；`tech_stack` 截断 5 个 |
| `labNotes.tsx` | `data.notes` | 删除 `useEffect` + `listPublicArticles`；条数 10 → 6；分类用真实 `category`，不再用发布状态代替 |
| `labFooter.tsx` | `data.about` | `links` 为空数组时**隐藏整个入口区**，不展示不可点击的联系项（首页 PRD §11.3） |

**待删除的 mock：**

- `frontend/src/lib/labHomeContent.ts` — 保留 `labNavigation`（导航是前端配置，不是内容），删除 `nowBuilding`、`labExperiments`、项目/笔记再导出。
- `frontend/src/lib/mockData.ts` — 删除 `sharedLabModules`、`projectSites`、文章 mock。管理端 dashboard 指标 mock 待接真实接口后一并删除。
- `frontend/src/lib/homeContent.ts` — 当前已无引用，属于遗留死代码，**本次一并清理**（改动直接源于本需求所触及的首页数据链路）。
- 遗留未使用组件 `heroSection.tsx` / `homeHeader.tsx` / `articleSection.tsx` / `activitySection.tsx` / `projectSection.tsx` / `announcementBar.tsx` / `contentObjectsPanel.tsx`：**本次不删**，仅在文档中记录，交由站点所有者确认后单独清理。

### 7.3 API 层

`frontend/src/lib/api/` 新增模块，沿用现有 `apiFetch` / `apiJson<T>` 包装与 `ApiError` 形状：

```
lib/api/
├── client.ts        [已有] 401 自动刷新、token 管理
├── home.ts          [新增] getHomeSummary
├── articles.ts      [改造] 版本、回收站、定时、批量
├── projects.ts      [改造] + 公开接口
├── observatory.ts   [改造] + 公开接口
├── builds.ts        [新增]
├── media.ts         [新增] 附件、分组、上传、转存
├── storage.ts       [新增] 存储策略
├── jobs.ts          [新增] 任务与重试
└── settings.ts      [改造] PUT → POST
```

**react-query 的使用边界：** 依赖已装但零使用。**本设计只在管理端引入** `useQuery` / `useMutation`（列表分页、媒体库无限滚动、上传进度、失败重试都能直接受益）。公开端走 RSC，不引入 react-query，避免同一套数据两种取数范式。

### 7.4 管理端关键组件

#### 文章编辑器（`articleEditorWorkspace.tsx` 改造）

```
ArticleEditorWorkspace
├── EditorHeader          标题、状态徽标、has_unpublished_changes 提示
├── TipTapEditor          + GalleryNode + ImageNode(接选择器)
├── SidePanel
│   ├── PublishPanel      立即发布 / 定时发布 / 下线 / 预览链接
│   ├── SettingsPanel     slug、摘要（自动/手工）、封面（选择器）、分类、标签、可见性
│   └── VersionPanel      历史版本列表、查看、比较、恢复
├── LocalDraftBanner      本地恢复副本提示
├── ConflictDialog        409 时弹出
└── SaveStatusIndicator   已保存 / 保存中 / 保存失败 / 有未发布修改
```

**本地恢复副本逻辑：**

```
localStorage key: `cl-draft:article:{id}`
value: { content_json, title, base_version_lock, saved_at }

写入：输入停止 2s / visibilitychange 隐藏 / beforeunload
读取（打开编辑器时）：
  副本不存在 → 正常加载
  副本存在 且 副本.base_version_lock === 服务器.version_lock
      → 提示「检测到未提交的本地修改，是否恢复？」
  副本存在 且 base_version_lock 不一致
      → **不得自动覆盖**，提示「服务器版本已更新」，提供「查看本地副本」「丢弃本地副本」
成功 save 后清除副本
```

界面文案必须区分三个概念（§4.2），禁止把本地副本称为"草稿"。

#### 附件选择器 `AttachmentPicker`

全站唯一的文件选择入口，服务于封面、正文单图、图片集、音视频、文件链接、设置页品牌图。

```tsx
type AttachmentPickerProps = {
  open: boolean;
  mode: "single" | "multiple";
  min?: number;
  max?: number;
  accept?: string[];          // MIME 前缀，如 ["image/"]
  selected?: number[];        // 已选 fileId
  onConfirm: (files: MediaFile[]) => void;
  onClose: () => void;
};
```

内含：搜索、分组筛选、类型筛选、分页/无限滚动、拖拽上传区、已选态、网格/列表切换（选择记忆到 `uiStore`）。

**第三方来源接入点：** 内容平台 PRD §8.11 要求可插拔来源。V1 只有"媒体中心"一个来源，但选择器内部按 `MediaSource` 接口组织，返回统一最小资源信息 `{ id, name, url, thumbnailUrl, kind, sizeBytes? }`。**V1 不实现第二个来源**，只留接口，不建注册中心、不做插件框架。

#### 媒体库页 `/admin/media`

替换现有 `AdminModulePlaceholder`。左侧分组树（单层）+ 右侧附件网格/列表 + 顶部搜索筛选 + 拖拽上传 + 右侧详情抽屉（预览、复制链接、改名、改分组、标签、缩略图、引用关系、下载、删除）。

处理中状态必须可见：`thumb_status='pending'` 显示占位与进度，`lifecycle_status='delete_failed'` 显示错误徽标 + 重试按钮。

#### 图片集节点 `GalleryNode`

TipTap `Node` 扩展 + `NodeViewRenderer`。编辑态支持拖动排序（dnd）、删除单图、继续添加、设置每行数量/间距/比例。编辑器内使用缩略图 URL 降低加载量，前台使用适配尺寸。图片未加载出宽高时用 `attrs.width/height` 占位，避免布局跳动。

### 7.5 样式与设计约束

- 颜色一律使用 `frontend/src/app/globals.css` 的 CSS 变量；首页专属令牌在 `lab-home.css` 的 `.lab-home` 作用域内。**新增管理端组件用 `globals.css` 令牌，不要跨用首页令牌。**
- 图标统一 `lucide-react`，显式指定尺寸。
- 所有动效支持 `prefers-reduced-motion`。
- 图片必须有稳定宽高，禁止布局跳动。
- 内部跳转用 Next `Link`。
- 遵循 `docs/develop-guides/design.md`。

---

## 8. 关键流程

### 8.1 新建并发布

```text
新建内容（POST /api/admin/articles）
  → 编辑标题与正文
  → 本地恢复副本持续更新（localStorage）
  → autosave 更新草稿版本行（不产生历史）
  → 用户 Ctrl+S → save 生成新历史版本，version_lock+1
  → 完善发布设置（slug、摘要、封面、可见性）
  → 发起发布 → 服务端校验 → 单事务物化投影 + 切 released_version_id
  → outbox 事件：缓存失效、搜索索引、首页版本号递增
  → 前端显示发布成功，状态徽标 published
```

### 8.2 修改已发布内容

```text
打开已发布内容 → 加载 draft_version（若无则由 released_version 克隆一份）
  → 修改并保存 → draft_version_id ≠ released_version_id
  → 后台显示「有未发布修改」
  → 访客继续看到旧的 released_version（articles 投影列未变）
  → 再次发布 → 投影更新，released_version_id 前移
```

### 8.3 并发保存冲突

```text
会话 A 打开（version_lock = 5）
会话 B 打开（version_lock = 5）
会话 B 保存成功 → version_lock = 6
会话 A 保存（携带 5）
  → UPDATE ... WHERE version_lock = 5 影响 0 行
  → 409 CONFLICT + current.version_lock = 6
  → 前端 ConflictDialog：
      「查看最新版本」（新标签打开）
      「另存为新草稿」（以当前内容创建新版本行，附 change_summary）
      「放弃我的修改」
  → 绝不静默覆盖
```

### 8.4 恢复历史版本

```text
版本列表 → 查看或比较 → 恢复 → 二次确认
  → 以目标版本内容创建**新的**草稿版本（version = max+1）
  → 恢复点之后的历史**不删除**
  → released_version_id **不变**，线上内容不受影响
  → 返回编辑器，由用户决定是否发布
```

### 8.5 上传并插入图片集

```text
编辑器插入图片集 → 打开 AttachmentPicker(mode=multiple, accept=["image/"])
  → 拖拽上传或从媒体中心多选
  → 上传：< 8MB 走 /upload；≥ 8MB 走 init/chunk/complete
  → 服务端：MIME 嗅探 → 大小/类型校验 → 计算 sha256 → entities 去重
           → 写 files + file_entities → 返回附件
           → outbox: thumbnail_generate
  → 选择器返回统一资源信息
  → 生成 gallery 节点（含 fileId、原始宽高）
  → 调整顺序/每行数量/间距/比例
  → 保存到草稿版本 → 重算 file_references
```

### 8.6 删除附件

```text
请求删除 → 检查权限 → 查 file_references
  → 有引用：提示「被 N 处引用」，用户确认后继续（策略见 Q-04）
  → UPDATE files SET lifecycle_status='deleting'
  → INSERT event_outbox('file.delete')
  → 立即返回，前端展示「删除中」
任务执行：
  → entities.ref_count - 1；为 0 时删物理文件
  → 删 file_thumbnails 及其物理文件
  → 删 direct_links
  → UPDATE files SET deleted_at=now(), lifecycle_status='active'
任一步失败：
  → lifecycle_status='delete_failed'，last_error=<原因>
  → 媒体库展示错误徽标，可重试
  → **不允许出现「记录已删但物理文件残留且无人知晓」的静默失败**
```

### 8.7 URL 转存（SSRF 防护）

```text
POST /api/admin/media/import-url { url }
  → 解析 URL：仅允许 http/https
  → DNS 解析 → 逐个 IP 检查，拒绝：
      127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 169.254/16,
      ::1, fc00::/7, fe80::/10, 0.0.0.0/8
  → 使用固定解析结果建连（防 DNS rebinding）
  → 跟随跳转 ≤ 3 次，**每次跳转后重新执行上述全部检查**
  → 响应大小上限 50MB，超出即中断
  → 总耗时上限 30s
  → 从 Content-Disposition 或 URL 推断文件名并净化
  → 后续与普通上传完全一致
```

---

## 9. 异常与边界场景

| 场景 | 期望行为 |
| --- | --- |
| 保存时服务器版本已变化 | 409，拒绝覆盖，本地内容保留 |
| 发布时 `draft_version_id` 指向的版本不存在 | 发布失败，`publish_failed` + 原因；线上旧版本不受影响 |
| 上传物理文件成功但 `files` 记录写入失败 | 事务回滚后由 `orphan_cleanup` 补偿任务清理孤立对象 |
| `files` 记录删除但存储删除失败 | `delete_failed`，可重试，不留静默残留 |
| 缩略图生成失败 | 原文件可用，`thumb_status='failed'`，展示默认预览并允许重试 |
| 上传非图片文件却请求缩略图 | `thumb_status='unsupported'`，用文件类型图标，不算失败 |
| 外部 URL 指向内网 | 拒绝转存，返回 `VALIDATION_ERROR` |
| 存储驱动不可用 | 上传失败并显示明确原因，不落半个记录 |
| 用户离开未保存页面 | 本地副本已存，下次打开提示恢复 |
| slug 与系统路由冲突（`admin`/`api`/`login`/`f`/`preview`） | 发布前阻止并提示；保留字列表在后端维护 |
| slug 与其他未删除内容重复 | 409 CONFLICT（现有 slug 409 逻辑已实现，需覆盖到 projects/builds） |
| 图片集引用的附件被删除 | 用节点内保留的 `src` 降级展示；加载失败时显示"资源已失效"占位，不破坏布局 |
| 定时发布时发起人已被禁用 | 执行时重新校验，任务失败并记录原因，通知管理员 |
| 定时发布时间已过（服务停机期间） | 恢复后立即补发；若已过 24h 则置 `publish_failed` 要求人工确认 |
| 观测记录 `visibility='private'` 却被标为 `is_featured` | 首页聚合忽略它，管理端列表提示矛盾状态 |
| 首页某区块无合格内容 | 返回空数组，前端**隐藏整个区块**而非展示空状态占位（首页 PRD §7.3 不虚构补位） |

---

## 10. 技术需求（非功能）

### 10.1 性能

| 指标 | 目标 |
| --- | --- |
| `GET /api/home` P95 | < 300ms（冷）/ < 50ms（命中缓存） |
| 管理端内容列表首屏 | < 1s |
| 常规保存给出明确结果 | < 2s |
| 附件列表 | 必须分页，默认 24 条 |
| 图片网格 | 使用缩略图 + 懒加载，禁止直出原图 |
| 大文件上传 | 流式处理，**不得整体读入内存**；分片默认 5MB |
| 历史版本增长 | 读取当前版本性能不随历史条数线性下降（投影列保证 O(1)） |

**必需索引：** §5 中每张改造表已列出。特别注意 `content_versions (resource_type, resource_id, version DESC)`——版本列表是管理端高频查询。

### 10.2 安全

| 项 | 要求 |
| --- | --- |
| 权限 | **一律服务端校验**；前端隐藏按钮只是体验，不是安全措施 |
| 上传大小 | 默认单文件 100MB，可配置 |
| 上传类型 | 允许/禁止列表 + **magic number 嗅探**，不信任扩展名与 `Content-Type` |
| 文件名 | 净化非法字符，拒绝 `..`、绝对路径、控制字符；存储键由服务端生成，与用户文件名解耦 |
| URL 转存 | SSRF 防护见 §8.7 |
| 私有文件 | 通过 `direct_links` 的短时效签名访问，不放公开目录 |
| 存储密钥 | AES-256-GCM 加密存储，接口不回显明文 |
| 正文渲染 | bluemonday 净化；TipTap HTML 走同一净化器（§6.9） |
| 预览链接 | 短时效令牌（默认 15 分钟），一次性或限次；**不得永久公开**；私有内容不可通过猜测链接访问 |
| 审计 | 发布、下线、彻底删除、附件删除、存储策略与设置变更全部落 `audit_logs` |
| 限流 | 登录、上传、URL 转存接口加基础限流 |

### 10.3 可靠性

- 内容保存使用**乐观并发控制**（`version_lock`）。
- 发布、转存、删除、缩略图、索引任务全部**幂等**。
- 异步任务可重试，失败任务可在 `/admin/jobs` 查询。
- 数据记录与物理文件之间有**补偿机制**（孤立对象清理、`delete_failed` 重试）。
- **派生任务失败不得导致正文或原附件丢失**——这是硬约束，需要专门的测试用例覆盖。

### 10.4 可扩展性（只留接口，不建框架）

| 扩展点 | 形式 |
| --- | --- |
| 新内容类型 | 复用 `content_versions` 的 `resource_type` |
| 新编辑器 | 声明 `source_format`，走对应渲染分支 |
| 新存储驱动 | 实现 `storage.Driver` + `Capabilities` |
| 新媒体来源 | 实现 `MediaSource`，返回统一最小资源信息 |
| 新权限模型 | 替换 `RequireAdmin()` 为 `RequirePermission(code)` |

**明确不做：** 插件系统、主题系统、事件总线抽象层。这些在 62 张表的 schema 里有位置，但 V1 不实现任何代码，避免为想象中的需求建框架。

---

## 11. 分期与任务拆解

即便本次确定做完整平台，交付仍必须有顺序——每一期结束时系统都应处于可用、可验收状态。

### P0：可编译 + 首页跑真实数据（阻塞项 + 首页闭环）

| # | 任务 | 验证 |
| --- | --- | --- |
| 0-1 | 解决 `cmd/server/app.go`、`README.md`、`docs/ARCHITECTURE.md` 合并冲突 | `go build ./...` 通过 |
| 0-2 | 实现迁移执行器 + `schema_migrations`；补齐 SQLite schema | `go run main.go db migrate` 在两种库上成功 |
| 0-3 | 新建 `builds` 表 + `builds` 模块（admin CRUD + 公开读） | 单元 + 集成测试 |
| 0-4 | `observatory_notes` 结构化字段 + `visibility` + 公开读 | 集成测试：private 不出现在公开接口 |
| 0-5 | `projects` 公开列表/详情接口 | 集成测试 |
| 0-6 | `settings` 公开接口 + `PUT → POST` 修正 | 集成测试 |
| 0-7 | `home` 聚合模块 `GET /api/home` | 集成测试覆盖 §6.3 全部收录规则 |
| 0-8 | 前端首页改为 RSC 取数，删除 mock | Docker 中肉眼验证六个区块 |
| 0-9 | 管理端 `builds` 页面 + 观测台新字段表单 | 手工验证 |

**P0 出口标准：`mockData.ts` 与 `labHomeContent.ts` 不再出现在首页渲染链路中。**

### P1：草稿/发布分离 + 版本历史 + 回收站

| # | 任务 |
| --- | --- |
| 1-1 | `content_versions` 表 + `internal/shared/version` |
| 1-2 | `articles` / `projects` 版本指针、乐观锁、状态扩展 |
| 1-3 | 存量数据迁移：为每篇现有文章生成 version 1 并回填指针 |
| 1-4 | save / autosave / 版本列表 / 比较 / 恢复接口 |
| 1-5 | 回收站：trash / restore / purge + `/api/admin/trash` |
| 1-6 | 预览令牌 + `/preview/[token]` |
| 1-7 | 前端：文章列表页、编辑页、VersionPanel、ConflictDialog、LocalDraftBanner |
| 1-8 | outbox + 任务运行器骨架 + `/admin/jobs` |

### P2：媒体中心 + 存储 + 图片集 + 定时发布

| # | 任务 |
| --- | --- |
| 2-1 | `storage.Driver` 抽象 + local 驱动 + 密钥加密 |
| 2-2 | `media` 模块：上传（直传 + 分片）、entities 去重、`GET /f/{public_id}` |
| 2-3 | 缩略图任务 + `file_thumbnails` |
| 2-4 | 分组、标签、`file_references` 引用追踪 |
| 2-5 | URL 转存 + SSRF 防护 |
| 2-6 | 删除流程 + `delete_failed` 重试 |
| 2-7 | 存储策略管理接口 + `/admin/storage` |
| 2-8 | 前端：媒体库页、`AttachmentPicker`、上传组件 |
| 2-9 | TipTap `GalleryNode` + `content_json` 为源 + sanitizer 扩展 |
| 2-10 | 封面/正文图/品牌图全部改用选择器，移除 URL 文本框 |
| 2-11 | 定时发布 `publish_scheduled` + 前端定时面板 |

### P3（可选，非本次承诺）

文章归档页与分类筛选、观测归档页、搜索、多存储驱动、私有附件签名分享、第三方媒体来源。

---

## 12. 待决策问题

内容平台 PRD 第 16 章列了 12 个问题。以下是**本设计已做的选择**与**仍需站点所有者确认**的部分。

### 12.1 本设计已决策（评审时确认即可）

| # | 问题 | 决策 | 理由 |
| --- | --- | --- | --- |
| Q-01 | 单站点还是多租户 | **单站点** | 自托管个人实验室 |
| Q-02 | 是否需要发布审批 | **不需要** | 单人站点 |
| Q-03 | 历史版本按手动保存还是时间聚合 | **按手动保存**，autosave 不产生版本 | 历史列表只留有意义的节点 |
| Q-05 | 是否引入 RBAC | **V1 不引入**，保留替换点 | 只有一个管理员 |
| Q-07 | 定时发布权限时点 | **执行时重新校验** | 避免越权窗口 |
| Q-08 | 图片集是否必存 `fileId` | **必存** | 否则无法做引用追踪与链接迁移 |
| Q-09 | 编辑者能否选存储策略 | **不开放**，使用默认策略 | 单人站点无收益 |
| Q-10 | 评论是否在范围内 | **不在**（首页 PRD §2.3 已排除） | — |
| Q-11 | 搜索是否 MVP | **不是**，V1 用数据库模糊匹配 | 避免先建空归档 |
| Q-12 | "文档"内容类型 | **V1 不做**，`pages` / `doc_series` 表保持空置 | 无实际需求 |

### 12.2 需要确认

| # | 问题 | 选项 | 影响 |
| --- | --- | --- | --- |
| **Q-04** | 删除仍被引用的附件时怎么处理？ | (a) 强制阻止；(b) 提示后允许删除，正文降级为失效占位；(c) 静默允许 | 决定 `file_references` 是硬约束还是提示信息。**建议 (b)** |
| **Q-06** | 是否把 refresh token 改存 httpOnly cookie？ | (a) 保持 localStorage + 标记 cookie；(b) 改 httpOnly cookie | (b) 更安全但需改造登录链路与 CSRF 防护。**建议 P1 阶段做 (b)** |
| **Q-13** | slug 修改后是否自动建立旧地址跳转？ | (a) 不跳转；(b) 用 `seo_redirects` 表自动建 301 | 表已存在。**建议 (b)**，成本低 |
| **Q-14** | 历史版本保留策略 | 数量上限 / 时间上限 / 不清理 | 影响 `version_prune` 任务。**建议：保留最近 50 个 + 全部发布节点** |
| **Q-15** | `builds` 是否需要草稿/发布双版本 | 本设计选择"仅 status"，与 articles 不一致 | 若要求一致性，需为 builds 也接版本表 |
| **Q-16** | 首页 PRD §14.1 的真实内容何时补齐？ | — | **这是 P0 的前置**：`builds` 表建好但没有真实的 QuickBox / NextVibe / Tarot Oracle / Crescent Blog 信息，首页仍然是空的。**建表不等于有内容。** |

---

## 13. 验收标准

### 13.1 首页（继承首页内容 PRD §16）

- [ ] 首页六个区块的数据全部来自 `GET /api/home`，无 mock 引用。
- [ ] 访问者能明确区分「正在构建」「实验观测台」「项目」「笔记」，四者无完全重复的标题和摘要。
- [ ] 每个「正在构建」项包含一句话定义、当前阶段、最新进展或下一步、更新时间。
- [ ] 每条观测记录包含问题、观察、当前结论；`active` 状态额外有下一步。
- [ ] 观测的 `note_type` 与 `status` 使用现有枚举，未新增值。
- [ ] 项目只展示 `status='published'`；`demo_url` / `repo_url` 为空时不渲染入口。
- [ ] 笔记展示 6 篇已发布文章，分类为真实分类而非发布状态。
- [ ] 页脚在无真实 GitHub / 联系方式时隐藏入口，不展示不可点击项。
- [ ] 首页出现的每个动作入口都指向真实可访问内容。
- [ ] 某区块无合格内容时整块隐藏，不虚构补位。

### 13.2 内容与版本

- [ ] 可创建、编辑、预览、发布、下线文章与项目。
- [ ] 编辑已发布内容时，公开端持续返回旧的发布版本。
- [ ] 再次发布后公开端切换到新版本，且 `articles` 投影列与 `released_version_id` 指向的版本内容一致。
- [ ] 下线不丢失草稿与历史。
- [ ] 可移入回收站、恢复、彻底删除；回收内容立即从公开端消失。
- [ ] 彻底删除内容默认不删除其引用的附件。
- [ ] 可查看、比较、恢复历史版本；恢复只创建新草稿，不改变线上。
- [ ] 当前草稿与当前发布版本不可被删除；第一个版本不可删除。
- [ ] 并发保存返回 409 且不静默覆盖。
- [ ] 意外关闭页面后可恢复本地副本；服务器版本已变时不自动覆盖。
- [ ] 定时发布到点自动执行，失败有原因记录且可重试。

### 13.3 媒体

- [ ] 可多文件上传并显示进度、可取消、可重试。
- [ ] 上传受大小与类型限制，类型基于真实文件内容判定。
- [ ] 可用列表与网格浏览，视图选择被记住。
- [ ] 可按关键词、类型、分组、标签搜索筛选。
- [ ] 可创建分组并移动附件；删除分组不删文件。
- [ ] 封面、正文图片、图片集、品牌图全部通过同一个选择器完成。
- [ ] 删除附件会清理物理文件与缩略图；失败时状态明确且可重试。
- [ ] 缩略图生成失败不影响原附件可用性。
- [ ] URL 转存拒绝内网地址与超大响应。

### 13.4 图片集

- [ ] 可上传或多选插入图片。
- [ ] 可拖动排序，保存后顺序不变。
- [ ] 可设置每行数量、布局比例、间距，切换布局不丢图。
- [ ] 保存并重新打开后结构不变。
- [ ] 图片未加载出宽高时不破坏布局。
- [ ] 删除图片集中的图片不会删除媒体中心附件。

### 13.5 安全与前台

- [ ] 无权限用户不能通过直接请求绕过限制（绕过前端直接打接口验证）。
- [ ] 草稿与私有内容不出现在任何公开列表、详情或聚合接口。
- [ ] 预览链接过期后失效；私有内容不可通过猜测链接访问。
- [ ] slug 唯一且不与系统路由冲突。
- [ ] 上传恶意扩展名文件被拒绝。
- [ ] 正文中的脚本标签被净化。

---

## 14. 测试计划

**遵循 `docs/develop-guides/testing-guidelines.md` 的实际约定：Go 测试与源码同包（`*_test.go`）。**

> 冲突提示：`AGENTS.md` 要求测试放在 `backend/test/unit|integration|e2e`，但本仓库**没有 `backend/` 目录**，现有 13 个测试文件全部与源码同包。本设计按仓库现状执行，并建议修正 `AGENTS.md` 的这一条。

| 层级 | 位置 | 覆盖重点 |
| --- | --- | --- |
| 单元 | `internal/modules/*/repository_test.go`、`model_test.go` | 校验规则、状态机流转、SQL 过滤条件、slug 保留字 |
| 单元 | `internal/shared/version/*_test.go` | 版本号递增、投影一致性 |
| 单元 | `internal/shared/security/*_test.go` | SSRF 判定、MIME 嗅探、文件名净化 |
| 集成 | `internal/modules/*/integration_test.go` | HTTP 层：鉴权、错误码、分页、409 冲突、事务回滚 |
| 集成 | `internal/modules/home/integration_test.go` | §6.3 全部收录规则；private 观测不泄露 |
| 集成 | `internal/platform/jobs/*_test.go` | 幂等、重试退避、失败状态落库 |
| E2E | Docker 环境手工 + 脚本 | 发布闭环、并发冲突、上传删除闭环 |

**必须有的回归用例（对应硬约束）：**

1. 编辑已发布文章并保存 → 公开接口返回内容**不变**。
2. 发布后 `articles.content_html` 与 `content_versions` 中 `released_version_id` 行的 `content_html` **完全一致**。
3. 恢复历史版本后 `released_version_id` **未改变**。
4. 缩略图任务失败后原附件仍可下载。
5. 附件删除任务失败后 `lifecycle_status='delete_failed'` 且记录未被清除。
6. `visibility='private'` 的观测不出现在 `/api/home` 与 `/api/observatory`。
7. 两个会话并发保存，后者收到 409 且前者内容未被覆盖。

**低价值测试的处理：** 不为"给出靶子后评估靶子"的用例写测试（例如断言常量文案）。首页文案类内容通过验收清单人工核对，不写自动化断言。

**执行命令：**

```bash
go vet ./...
go test ./...
cd frontend && pnpm lint && pnpm typecheck && pnpm build
docker compose up -d --build   # 关键链路在 Docker 中验证
```

---

## 15. 数据指标

上线后建议观察（V1 通过 `audit_logs` + `job_runs` 直接查询，不建独立埋点系统）：

- 发布成功率、发布失败原因分布
- 有未发布修改的内容占比
- 版本恢复次数、保存冲突次数
- 上传成功率、URL 转存成功率、平均上传耗时
- 缩略图生成成功率、删除失败数量
- 孤立附件数量、每个内容平均引用附件数
- 存储占用量

---

## 16. 设计原则（贯穿全文的判断依据）

1. **草稿永不直接污染线上版本。**
2. **用户内容优先于自动处理结果**，派生任务失败不得造成正文丢失。
3. **媒体只管理一次，到处复用。**
4. **图片集是内容表现形式，不是第二套附件系统。**
5. **异步过程必须对用户可见，失败必须可恢复。**
6. **不用防御性回退掩盖设计缺陷**——宁可明确报错，也不要静默降级成看起来成功。
7. **建表不等于有内容**：schema 里躺着 62 张表不代表能力存在，首页有区块不代表有东西可看。
8. **只留扩展接口，不建扩展框架**：驱动、来源、权限都留了替换点，但 V1 不实现第二个实现。

---

## 17. 本次任务 Checklist

- [x] 核对两份来源文档并识别其层级关系。
- [x] 实测代码现状，标出"已实现 / 仅有表结构 / 不存在"。
- [x] 确定合并主线：首页内容契约 ← 内容平台发布版本。
- [x] 设计 `builds` 表以承载首页"正在构建"的 7 个字段。
- [x] 设计统一版本模型与发布事务，含投影一致性取舍说明。
- [x] 设计媒体中心（复用现有 schema）、存储抽象与任务运行器。
- [x] 给出完整公开 / 管理 API 清单，遵循 POST-only 接口规约。
- [x] 给出前端路由、首页取数改造、编辑器与选择器组件设计。
- [x] 给出性能、安全、可靠性、可扩展性技术需求。
- [x] 给出 P0/P1/P2 分期、验收标准与测试计划。
- [x] 列出已决策项与待确认项。
- [ ] **评审确认 §12.2 的 Q-04、Q-06、Q-13、Q-14、Q-15。**
- [ ] **站点所有者补齐首页内容 PRD §14.1 的真实内容（Q-16，P0 前置）。**
- [ ] 评审通过后按 §11 拆分开发任务。
