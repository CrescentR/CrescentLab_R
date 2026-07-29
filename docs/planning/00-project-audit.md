# CrescentLab_R 项目现状审阅

> 审阅基线：2026-07-18 当前工作树  
> 事实来源：代码、配置、SQL、测试、Git 历史和现有文档  
> 说明：本文件中的“当前”描述已实现状态；“建议”不代表已实现。

## 1. 项目基本信息

| 项目项 | 当前结论 | 证据 |
| --- | --- | --- |
| 项目名称 | CrescentLab_R / CrescentLab | `go.mod`、`README.md`、前后端界面文案 |
| 项目定位 | 自托管的个人技术实验室博客与内容管理系统，将文章、项目、实验记录和后台工作台收束在同一站点 | `README.md`、`AGENTS/docs/DEVELOPMENT_PLAN.md`、`frontend/src/lib/mockData.ts` |
| 目标用户 | 当前可确认访客与站点管理员；“读者成员”只存在于前端原型，真实账号能力待实现 | `frontend/src/lib/personas.ts`、`frontend/src/store/uiStore.ts` |
| 主要场景 | 公开展示实验室内容；管理员维护文章和站点设置；后续扩展媒体与评论 | 首页组件、后台路由、content/settings 模块 |
| 当前技术栈 | Go 1.26、Gin、`database/sql`、Viper、SQLite/PostgreSQL；Next.js 16、React 19、TypeScript、Zustand、TanStack Query、Motion、R3F | `go.mod`、`frontend/package.json` |
| 当前运行方式 | 后端读取 `data/conf.ini`，缺失时读取 `default_files/conf.ini`；前端独立运行并通过 Next rewrites 转发 `/api/*` | `cmd/server/app.go`、`frontend/next.config.ts` |
| 当前部署方式 | Docker Compose 分别运行 PostgreSQL、后端和 Next.js；未实现 Go 进程托管前端 | `docker-compose.yml`、`Dockerfile` |
| 当前主要模块 | platform/config、database、http、logger；modules/content、settings、users；shared/auth；公开首页与后台壳 | `internal/`、`frontend/src/` |
| 当前完成度 | MVP 开发阶段：技术骨架和部分 API 已存在，但核心发布链路未闭环 | 见第 5 节 |

## 2. 仓库与运行结构

```text
浏览器
  └─ Next.js :3000
      ├─ /                         静态实验室首页，读取 mockData
      ├─ /admin/*                  静态后台壳与原型页面
      └─ /api/* rewrites
          └─ Gin :8091
              ├─ /api/articles*    公开文章读接口
              ├─ /api/admin/articles* 文章管理接口（当前无鉴权）
              └─ /api/admin/settings* 设置接口（当前无鉴权）
                  └─ database/sql
                      ├─ SQLite：4 张表
                      └─ PostgreSQL：71 张表
```

后端当前是边界清楚的模块化单体。前端与后端通过同源转发解耦部署，但尚未形成统一的登录态、错误契约和数据加载策略。

## 3. 当前产品能力

| 模块 | 用途与角色 | 入口 | 已实现 | 未完成与限制 | 关系 |
| --- | --- | --- | --- | --- | --- |
| 公开首页 | 访客查看实验室内容 | `/` | Hero、构建中项目、实验、项目、笔记、响应式和 reduced-motion 降级 | 内容来自 `mockData.ts`；无文章详情路由；导航多为页内锚点 | 应消费公开文章与站点设置 |
| 后台壳 | 管理员进入各模块 | `/admin` | 导航、主题切换、仪表盘视觉原型 | “管理员”由 localStorage persona 模拟；指标、活动和内容均为静态数据 | 应接真实身份与各管理模块 |
| 文章 API | 访客读取、管理员维护文章 | `/api/articles`、`/api/admin/articles` | 列表、搜索、分类筛选、分页、详情、创建、完整替换、软删除；SQLite/PostgreSQL 占位符兼容 | 管理接口无认证；无后台文章列表页；编辑器未接 API；`content_html` 不生成；分类/标签无管理能力 | content Repository、articles/post_categories 表 |
| 文章编辑器原型 | 管理员写文章 | `/admin/postManagement/new` | 编辑器布局、元数据区、工具栏、预览/发布按钮外观 | 字段是静态值；按钮不保存；没有加载、冲突、失败或离开保护 | 应接文章管理 API |
| 设置管理 | 管理员维护品牌资源 URL | `/admin/settings` | 读取与批量保存 5 个 branding 设置；有加载、保存、错误、撤销状态 | 后端无鉴权；保存结果没有驱动首页/后台品牌资源；`is_encrypted` 只是字段，没有加密实现 | settings Repository 与设置页 |
| 用户与鉴权核心 | 为登录和权限提供底层能力 | 当前无页面和 HTTP 入口 | users Repository；bcrypt；access/refresh JWT 签发与解析 | 没有注册/登录/刷新接口、认证中间件、会话撤销、管理员初始化和真实前端登录态 | 应保护 `/api/admin/*` |
| 用户权限原型 | 展示用户和角色矩阵 | `/admin/users` | 角色卡、静态用户表、静态权限矩阵 | 用户、角色、保存动作均为 mock；与后端 users/permissions 未连接 | 依赖身份与权限决策 |
| 媒体/评论/插件/主题 | 后续模块入口 | 对应 `/admin/*` | 统一占位页 | 无 handler、repository、交互和运行逻辑 | PostgreSQL 仅有超前 schema |

## 4. 当前技术能力

| 能力 | 当前状态 | 评价 |
| --- | --- | --- |
| 前端架构 | App Router；页面组件、UI 组件、数据和状态有基本分层 | 可保留；存在新旧首页组件并存和 API 接入不足 |
| 后端架构 | `cmd/server` 组装，`internal/modules` 按业务划分，`internal/platform` 承载基础能力 | 适合当前体量，应继续保持模块化单体 |
| 数据库 | `database/sql` 双驱动；SQLite 4 表、PostgreSQL 71 表；人工导入 schema | 已实现模块可用，但两套 schema 能力差距极大，缺少版本化变更与启动前校验 |
| 接口设计 | Gin Handler 直接调用 Repository；JSON 响应；文章分页结构已明确 | 主路径简单；错误响应、鉴权、请求限制和服务层规则尚缺 |
| 权限与登录 | JWT/bcrypt 仅为库级能力 | 运行态没有任何权限保护 |
| 状态管理 | Zustand 只管理主题、persona 和弹窗；QueryClient 已挂载 | persona 是原型状态，不得作为权限依据；TanStack Query 尚未用于业务数据 |
| 配置 | INI 文件 + 默认值；支持 SQLite/PostgreSQL | 没有环境变量绑定、密钥配置或环境隔离规范 |
| 文件存储 | 仅 PostgreSQL 表设计 | 未实现 |
| 缓存与消息 | 无运行时实现；schema 含 outbox/jobs | 当前无需引入 Redis 或消息队列 |
| 日志 | `slog` 文本日志 + HTTP method/path/status/latency | 缺 request_id、结构化环境区分、敏感字段策略和错误关联 |
| 异常处理 | Gin Recovery；各 Handler 局部返回 `{error}` | 直接返回内部错误文本，缺统一错误码和前后端错误分类 |
| 定时任务 | 仅表设计 | 未实现，当前主链路不依赖 |
| 测试 | Go 仓储/Handler/auth/platform 单元测试较完整；无前端业务测试 | 已实现 Go 模块有价值；缺 PostgreSQL 集成、前端组件和端到端测试 |
| CI/CD | `.github` 无工作流 | 未实现 |
| Docker | 多阶段镜像 + Compose，配置解析通过 | Docker Desktop 当前未运行，实际镜像构建未验证；Compose 使用固定开发凭据 |
| 监控与备份 | 无健康端点、指标、告警、备份执行或恢复演练 | 未达到生产要求 |
| 安全 | bcrypt、JWT 算法限制和过期校验已实现 | 管理接口裸露、无密钥注入、限流、上传校验和日志脱敏 |

## 5. 验证结果

| 检查 | 结果 | 结论 |
| --- | --- | --- |
| `pnpm typecheck` | 通过 | 当前 TypeScript 类型可通过 |
| `pnpm lint` | 通过 | 当前前端 Lint 通过 |
| `pnpm build` | 通过 | 生成 `/` 与 9 个 `/admin` 业务路由，均为静态预渲染 |
| `docker compose config --quiet` | 通过 | Compose 语法与变量展开有效 |
| `docker compose build backend` | 未执行成功 | Docker Desktop Linux engine 未运行，无法验证镜像构建 |
| `go test ./...` | 失败 | content/settings/users/platform 测试通过；auth 因 `go.sum` 缺少 JWT v5.3.1 内容校验项而 setup failed |
| `go vet ./...` | 失败 | 与 Go 测试相同的依赖校验问题 |

## 6. 问题清单

### 6.1 P0：必须先处理

| 编号 | 问题与发现位置 | 影响 | 阻塞 | 推荐阶段 | 初步方向 |
| --- | --- | --- | --- | --- | --- |
| AUD-P0-01 | `/api/admin/articles` 与 `/api/admin/settings` 直接注册，无认证中间件；前端权限只是 `localStorage` persona | 任意可访问后端的人可读取/改写/删除管理数据 | 阻塞对外部署 | 阶段 1 | 落地登录、JWT 中间件、管理员授权；前端 persona 退出权限链 |
| AUD-P0-02 | `go.mod` 使用 `github.com/golang-jwt/jwt/v5 v5.3.1`，`go.sum` 只有 v5.3.1 的 go.mod 校验，没有模块内容校验 | 干净环境中 test/vet 不可重复；可能阻塞镜像/CI | 阻塞质量门禁 | 阶段 1 | 修复依赖锁定并在干净环境验证 test/vet/build |

### 6.2 P1：影响核心业务闭环

| 编号 | 问题与发现位置 | 影响 | 阻塞 | 推荐阶段 | 初步方向 |
| --- | --- | --- | --- | --- | --- |
| AUD-P1-01 | 没有登录、刷新、退出 HTTP 能力和管理员初始化流程 | 管理员无法以真实身份进入后台 | 是 | 阶段 1 | 先确认账号模型与初始化方式，再复用现有 users/auth 核心 |
| AUD-P1-02 | `data/crescentlab.db` 为 0 字节，README 快速开始未要求导入 SQLite schema | 本地后端可启动但业务查询失败 | 是 | 阶段 1 | 提供明确、可审阅的初始化命令和 readiness schema 检查；不自动迁移生产库 |
| AUD-P1-03 | 首页和后台文章区均读取 `mockData.ts`，编辑器按钮无行为 | “写作 → 发布 → 阅读”无法闭环 | 是 | 阶段 2 | 建立管理列表、编辑/保存/发布和公开详情页，并接现有 API |
| AUD-P1-04 | 设置页保存数据，但 `siteBranding` 是前端静态常量，页面不读取已保存设置 | 用户操作成功却看不到生效结果 | 否 | 阶段 3 | 增加公开设置读能力与统一加载策略 |
| AUD-P1-05 | `content_html` 从未生成，公开详情直接返回 Markdown/HTML 字段 | 无可靠正文展示；未经净化的 HTML 接入后有 XSS 风险 | 是 | 阶段 2 | 先确定单一正文源和渲染边界，再实现服务端转换/净化 |
| AUD-P1-06 | PostgreSQL 71 表、SQLite 4 表；大量实体没有代码消费 | 数据模型远超当前产品能力，双驱动无法等价验证 | 否 | 全阶段 | 只按阶段激活表；为已实现表建立版本化变更和双库集成测试 |

### 6.3 P2：体验、维护与生产风险

| 编号 | 问题与发现位置 | 影响 | 阻塞 | 推荐阶段 | 初步方向 |
| --- | --- | --- | --- | --- | --- |
| AUD-P2-01 | Handler 将底层错误文本直接返回，错误结构只有 `{error}` | 泄露内部细节，前端难稳定处理 | 否 | 阶段 1 | 统一错误码、HTTP 状态与安全消息；详细原因只写日志 |
| AUD-P2-02 | HTTP Server 只有 `ReadHeaderTimeout`，无 body 上限、Read/Write/Idle 超时 | 慢请求和大请求保护不足 | 否 | 阶段 1 | 补齐与当前接口匹配的超时和请求体限制 |
| AUD-P2-03 | 无 `/health`、readiness、request_id | 容器和运维无法判断存活与数据库可用性 | 否 | 阶段 1 | 分离存活与就绪检查，日志关联 request_id |
| AUD-P2-04 | `package-lock.json` 与 `pnpm-lock.yaml` 并存；Dockerfile/Makefile 用 npm，开发规范要求 pnpm | 本地与镜像可能安装不同依赖 | 否 | 阶段 1 | 统一包管理器、锁文件与构建命令 |
| AUD-P2-05 | 无前端测试、PostgreSQL 集成测试、认证集成测试和核心 E2E | 现有单元测试不能证明跨层链路 | 否 | 阶段 1-2 | 按真实主路径补集成与 E2E；不堆低价值快照 |
| AUD-P2-06 | README/ARCHITECTURE 仍称业务 API 未设计，旧开发计划又描述 Ent、Redis、MySQL、自动迁移等未采用方案 | 新开发者无法辨别现状与旧设想 | 否 | 阶段 1 | 以代码为准更新现状文档，将旧计划标为历史参考 |
| AUD-P2-07 | Compose 与 PostgreSQL 配置模板使用固定凭据，配置系统未绑定环境变量 | 直接照搬到生产会造成密钥风险 | 否 | 阶段 1/4 | 将开发默认与生产必填密钥分离，禁止生产默认值 |
| AUD-P2-08 | 后台 dashboard、users 和权限矩阵展示静态数据与可点击保存按钮 | 用户可能误认操作已持久化 | 否 | 阶段 2/4 | 未接入前明确标识演示，接入时补加载、空、失败和权限状态 |
| AUD-P2-09 | 测试规范要求 `backend/test/*`，当前 Go 测试全部与包同目录，且仓库没有 `backend` 目录 | 规范与实际 Go 项目结构冲突 | 否 | 阶段 1 | 决定是修订规范还是迁移测试；不在未确认前移动测试 |
| AUD-P2-10 | 无 CI、备份、回滚、监控、告警与恢复演练 | 无法声明生产就绪 | 否 | 阶段 4 | 建立最小生产门禁和演练记录 |

### 6.4 P3：普通优化与清理

| 编号 | 问题与发现位置 | 影响 | 推荐阶段 | 初步方向 |
| --- | --- | --- | --- | --- |
| AUD-P3-01 | 旧首页组件和 `homeContent.ts` 与新 Lab 首页并存，根目录另有 `labHomeContent.ts` | 增加阅读负担，可能形成重复维护 | 阶段 2 后 | 在引用图确认无消费方后单独清理，不与主功能混改 |
| AUD-P3-02 | Git 提交信息多为“前端+后端vN”“feat 111” | 历史难追踪需求和风险 | 持续 | 后续提交按中文 Conventional Commits 记录范围与原因 |

## 7. 当前阶段判断

当前最接近 **MVP 开发阶段**。

判断依据：

1. 可构建的公开首页、后台信息架构、Docker 配置和模块化后端已经超过“想法验证/原型”的纯静态阶段。
2. settings、content、users Repository 与 auth 核心有真实代码和测试，说明 MVP 已进入业务实现。
3. 真实身份、管理员保护、数据库初始化、前端业务接入和公开文章详情仍缺失，核心用户旅程无法完成，因此不能判断为“基础功能完成”或“可用版本”。
4. 当前高风险不是扩展性不足，而是安全门禁、构建可重复性和主链路未闭环。

## 8. 审阅结论

应保留模块化单体、Next.js/Gin 分层、SQLite/PostgreSQL 双驱动和人工审阅数据库变更的基本方向。下一步不应继续铺设插件、主题、通知、音乐等横向模块，而应先修复 P0/P1，完成真实管理员发布文章的最短闭环。PostgreSQL 中未被当前阶段使用的表只视为历史设计资产，不视为已完成产品能力。

