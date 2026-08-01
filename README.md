# CrescentLab_R

CrescentLab_R 是一个自托管博客 / CMS。当前阶段已完成构建基线、安全门禁和认证流程，管理员可通过登录页以真实身份进入后台，所有 `/api/admin/*` 接口受 JWT 中间件保护。

## 已完成

- Go 后端：Gin 路由、模块化目录（`internal/modules`、`internal/platform`、`internal/shared`）
- 认证系统：管理员登录、JWT access/refresh token、退出撤销、bcrypt 密码哈希
- 授权中间件：`/api/admin/*` 全部接口要求认证 + 管理员权限
- 管理员初始化命令：`crescentlab admin init`
- 健康检查：`GET /healthz/live`（存活）、`GET /healthz/ready`（就绪，含核心表检查）
- 统一错误响应：`{code, message, request_id}` 结构，内部错误不泄露详情
- HTTP 基线：请求超时、body 上限、request_id 关联
- Next.js App Router 前端工程，首页与后台 Admin Shell
- 登录页 `/login`，AdminShell 权限检查真实 token，退出按钮
- 前端 API 客户端（`frontend/src/lib/api/client.ts`）：封装 fetch、自动携带 token、刷新拦截器
- SQLite 与 PostgreSQL 双数据库支持，手动导入 schema

## 技术栈

| 模块 | 选型 |
|---|---|
| 前端 | Next.js 16、React 19、TypeScript |
| 样式 | Tailwind CSS 4、CSS Variables |
| 图标 | lucide-react |
| 状态 | Zustand、TanStack Query |
| 请求 | Axios / fetch，前端 API 客户端封装认证拦截器 |
| 后端 | Go 1.26、Gin、JWT（HS256）、bcrypt |
| 数据库 | SQLite / PostgreSQL，手动导入 schema |

## 快速开始

### 1. 数据库初始化

**SQLite（默认，适合开发）：**

```bash
mkdir -p data
sqlite3 data/crescentlab.db < database/sqlite/schema.sql
```

**PostgreSQL（生产推荐）：**

```bash
createdb crescentlab
psql crescentlab < database/postgres/schema.sql
```

### 2. 管理员初始化

```bash
# 方式一：命令行参数
go run main.go admin init --username admin --password your-password

# 方式二：环境变量
ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password go run main.go admin init
```

密码不少于 8 个字符。重复执行不会覆盖已有管理员。

### 3. 配置

编辑 `data/conf.ini`（从 `default_files/conf.ini` 复制），设置 JWT secret：

```ini
[auth]
jwt_secret = "your-secret-here"
```

如果 `jwt_secret` 为空，开发环境会自动生成随机 secret（生产环境必须设置固定值）。

### 4. 启动

```bash
# 后端
go run main.go

# 前端
cd frontend
pnpm install
pnpm dev
```

默认后端地址 `http://localhost:8091`，前端地址 `http://localhost:3000`。

### 5. 验证

- 访问 `http://localhost:8091/healthz/ready` 确认数据库就绪
- 访问 `http://localhost:3000/login` 使用管理员账号登录

## 常用命令

```bash
# Go
go test ./...
go vet ./...
go build ./...

# 前端
cd frontend && pnpm lint
cd frontend && pnpm typecheck
cd frontend && pnpm build
```

也可以使用 `Makefile`：

```bash
make run          # 启动后端
make test         # 运行 Go 测试
make vet          # 运行 go vet
make frontend-install  # 安装前端依赖
make frontend-dev      # 启动前端开发服务
make frontend-build    # 构建前端
```

## 设置模块本地联调

1. 初始化本地 SQLite 表结构：

```bash
sqlite3 data/crescentlab.db < database/sqlite/schema.sql
```

也可以使用：

```bash
make db-sqlite-init
```

2. 启动后端：

```bash
go run main.go
```

3. 另开终端验证健康检查：

```bash
curl http://localhost:8091/api/health
```

4. 另开终端启动前端：

```bash
cd frontend
npm run dev
```

5. 打开 `http://localhost:3000/admin/settings`，如果出现后台权限门，先点击“切换为管理员演示”。修改站点标志、后台标志、默认头像、首页主图或 favicon，保存后刷新页面，应能读回刚保存的值。

## 目录结构

```text
.
├── cmd/server/                 # Go 服务入口组装与管理员初始化命令
├── internal/modules/           # 业务模块（auth、content、settings、users 等）
├── internal/platform/          # 数据库、HTTP、日志、存储、搜索、任务等平台能力
├── internal/shared/            # 鉴权、事件、ID、Markdown、安全、校验等共享能力
├── frontend/                   # Next.js 前端
├── database/sqlite/schema.sql  # SQLite 建表 SQL
├── database/postgres/schema.sql # PostgreSQL 建表 SQL
├── default_files/conf.ini      # 默认配置模板
├── docs/ARCHITECTURE.md        # 架构说明
├── docs/PROJECT_STRUCTURE.md   # 项目目录设计
├── docs/DATABASE_SCHEMA.md     # 数据库表设计
└── docs/planning/              # 开发规划与分期需求文档
```

## API 接口

| 接口 | 用途 | 权限 |
|---|---|---|
| `POST /api/auth/login` | 管理员登录 | 公开 |
| `POST /api/auth/refresh` | 刷新 access token | 公开 |
| `POST /api/auth/logout` | 退出，撤销 refresh token | 公开 |
| `GET /healthz/live` | 存活检查 | 公开 |
| `GET /healthz/ready` | 就绪检查（数据库 + 核心表） | 公开 |
| `GET /api/articles` | 公开文章列表 | 公开 |
| `GET /api/articles/:slug` | 公开文章详情 | 公开 |
| `GET /api/admin/settings` | 读取站点设置 | 需认证 + 管理员 |
| `POST /api/admin/settings` | 保存站点设置 | 需认证 + 管理员 |
| `GET /api/admin/articles` | 后台文章列表 | 需认证 + 管理员 |
| `POST /api/admin/articles` | 创建文章 | 需认证 + 管理员 |
| `POST /api/admin/articles/:id` | 更新文章 | 需认证 + 管理员 |
| `POST /api/admin/articles/:id/delete` | 删除文章 | 需认证 + 管理员 |
