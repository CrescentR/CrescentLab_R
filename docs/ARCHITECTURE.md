# CrescentLab Architecture

## 当前阶段

本仓库已完成构建基线、安全门禁和认证流程。管理员可通过登录页以真实身份进入后台，所有 `/api/admin/*` 接口受 JWT 中间件保护。健康检查、统一错误响应和请求超时已就绪；GitHub Actions 构建流程暂时移除，待项目完善后恢复。

## 技术选型

| 层级 | 选型 | 说明 |
|---|---|---|
| 前端框架 | Next.js App Router | Next.js 16，公开前台与管理后台分别构建 |
| UI 运行时 | React 19 + TypeScript | 强类型组件与 Server/Client Component 分层 |
| 样式 | Tailwind CSS 4 + CSS Variables | 暗色、玻璃态、紫/青色强调沉淀为 token |
| 图标 | lucide-react | 统一后台操作图标 |
| 客户端状态 | Zustand | 侧栏、弹窗、局部 UI 状态 |
| 服务端状态 | TanStack Query | 后续 API 接入后的缓存、重试、失效控制 |
| HTTP 客户端 | fetch（分别封装在两个项目的 `lib/api/client.ts`） | 后台客户端负责认证拦截与刷新，前台客户端只处理公开请求与错误归一化 |
| 后端框架 | Gin | 路由、中间件、JSON 序列化 |
| 认证 | JWT (HS256) + bcrypt | access token 2h、refresh token 7d、退出撤销 |
| 数据库 | SQLite / PostgreSQL | 手动导入 schema，不做自动 migration |

## 认证流程

```
登录                    刷新                     退出
POST /api/auth/login    POST /api/auth/refresh   POST /api/auth/logout
    │                       │                         │
    ▼                       ▼                         ▼
 验证密码              验证 refresh token         撤销 refresh token
 签发 access+refresh    签发新 access token       写入 auth_tokens 表
 更新 last_login        返回 access_token          返回 204
```

- access token 用于访问 `/api/admin/*`，放在 `Authorization: Bearer <token>` header
- refresh token 仅用于获取新 access token，不可用于管理接口
- 退出后 refresh token 被撤销，不可再用于刷新
- access token 在过期前仍可用（本期不实现 access token 黑名单）

## 授权中间件

```
请求 /api/admin/*
    │
    ▼
 RequireAuth 中间件
 ├─ 无 Authorization header → 401 UNAUTHORIZED
 ├─ token 无效 → 401 INVALID_TOKEN
 ├─ token 过期 → 401 TOKEN_EXPIRED
 └─ 通过 → 写入 Identity 到 context
    │
    ▼
 RequireAdmin 中间件
 ├─ 非管理员 → 403 FORBIDDEN
 └─ 通过 → 进入 handler
```

## 前端与后台目录

```text
frontend/src/
├── app/                 # Next.js 路由
│   ├── layout.tsx       # 根布局和 Provider
│   └── page.tsx         # 公开博客首页框架
├── components/
│   ├── home/            # 首页组件
│   ├── layout/          # 公开页布局组件
│   └── ui/              # Button、Panel、Badge、Field 等基础组件
├── lib/
│   ├── api/             # 公开 API 客户端
│   ├── mockData.ts      # 静态演示数据
│   └── utils.ts
├── store/               # Zustand store
└── types/               # 前端类型

admin/src/
├── app/
│   ├── admin/            # 管理后台路由
│   ├── login/            # 管理员登录页
│   └── layout.tsx        # 后台根布局
├── components/admin/    # 后台壳、编辑器、用户、设置等页面组件
└── lib/api/              # 管理 API 客户端与认证拦截器
```

两个 Next.js 项目分别部署。公开前台默认使用 3000 端口，后台默认使用 3001 端口；后台页面和 `/api/admin/*` 接口均由 JWT + 管理员权限保护。

## 后端目录

- `cmd/server`：服务入口组装、管理员初始化命令
- `internal/modules/auth`：认证 handler（登录、刷新、退出）、token 撤销仓库
- `internal/modules/users`：用户仓库、模型
- `internal/modules/content`：文章 CRUD
- `internal/modules/settings`：站点设置读写
- `internal/platform/http`：Gin 引擎、统一错误响应、request_id、健康检查 handler
- `internal/platform/http/middleware`：JWT 认证中间件、管理员授权中间件
- `internal/platform/database`：SQLite/PostgreSQL 连接管理
- `internal/platform/config`：Viper 配置加载
- `internal/shared/auth`：JWT 服务、bcrypt 密码哈希
- `database/sqlite/schema.sql`：手动导入的 SQLite 建表 SQL
- `database/postgres/schema.sql`：手动导入的 PostgreSQL 建表 SQL
- `database/sqlite/schema.sql`：本地开发用 SQLite SQL，当前覆盖设置表

完整说明见 `docs/PROJECT_STRUCTURE.md`。

## 数据库边界

- 不使用物理外键，跨表关系由 `*_id` 逻辑字段表达。
- 不使用触发器、数据库函数、视图。
- 不写 bootstrap 数据。
- 不做启动时自动迁移；数据库由人工创建和导入 SQL。
- `auth_tokens` 表存储已撤销的 refresh token 哈希（SHA256），不存储原始 token。

## 错误响应格式

所有错误响应统一为：

```json
{
  "code": "ERROR_CODE",
  "message": "用户可读的错误消息",
  "request_id": "req_abc123"
}
```

内部错误（数据库异常、panic）只返回通用消息"服务暂时不可用"，详细错误写日志。

## 后续接入顺序

1. ~~配置系统与日志~~ ✅ 已完成
2. ~~Gin 路由壳与健康检查~~ ✅ 已完成
3. ~~基于 schema 落数据库访问层~~ ✅ 已完成（users、content、settings）
4. ~~认证与用户系统~~ ✅ 已完成（登录、刷新、退出、JWT 中间件、管理员初始化）
5. 文章编辑器接入 Tiptap 与文章 API（阶段 02）
6. 媒体管理与文件上传（阶段 03）
7. 评论审核与通知系统（阶段 04）
