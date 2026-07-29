# 第 01 期：可重复构建与安全门禁

> 路线图基线：`docs/planning/02-roadmap.md` 阶段 01
> 审阅基线：2026-07-18 当前工作树
> 前置决策：见 `05-decisions-and-open-questions.md` 中 Q-001 ~ Q-005

---

## 1. 阶段概述

### 1.1 本期解决什么问题

当前项目存在三个阻塞项：

1. `/api/admin/articles` 和 `/api/admin/settings` 无认证中间件，任何能访问后端的人可直接读写管理数据。
2. `go.sum` 缺少 `golang-jwt/jwt/v5 v5.3.1` 的模块内容校验，干净环境下 `go test` / `go vet` 无法通过。
3. 本地 SQLite 文件为 0 字节，README 未说明初始化步骤，新环境启动后业务查询失败。

此外还缺少健康检查、统一错误响应、请求超时和最小 CI，无法支撑后续业务开发的安全验证。

### 1.2 为什么安排在这一期

所有后续管理功能（文章管理、媒体管理、评论审核）都依赖真实身份和后端授权。在未建立安全门禁前扩展业务，只会放大安全风险和返工成本。构建可重复性则是质量门禁的基础。

### 1.3 本期完成后的产品状态

- 管理员可通过登录页以真实身份进入后台。
- 所有 `/api/admin/*` 接口未认证返回 401、无权限返回 403。
- 干净环境下 Go test/vet/build 和前端 lint/typecheck/build 全部通过。
- 本地开发可按文档完成数据库初始化。
- 存在存活和就绪健康检查。

### 1.4 本期对整个项目的价值

为阶段 02 ~ 04 的全部管理能力提供安全前置和构建基线。本期完成后，后续开发可以专注于业务逻辑，而不用反复处理依赖、鉴权和错误契约问题。

---

## 2. 阶段目标

| 编号 | 目标 | 可验收条件 |
| --- | --- | --- |
| G-01-01 | 修复依赖锁定和包管理器漂移 | 干净工作区 `go mod verify` 通过；`go test ./...` 和 `go vet ./...` 通过；前端使用统一包管理器 |
| G-01-02 | 提供数据库初始化文档与就绪检查 | 新环境按文档初始化 SQLite/PostgreSQL 后后端可正常查询；`/healthz/ready` 能识别缺表和数据库不可达 |
| G-01-03 | 实现管理员登录、刷新和退出 | 登录成功返回 access/refresh token；刷新成功返回新 access token；退出后 refresh token 不可用 |
| G-01-04 | 保护全部管理 API | 未认证请求 `/api/admin/*` 返回 401；已认证但非管理员返回 403 |
| G-01-05 | 建立统一错误响应和请求限制 | 所有接口错误返回 `{code, message}` 结构；内部错误不回传详情；HTTP 超时和 body 上限可测试 |
| G-01-06 | 建立最小 CI | 每次提交自动执行 Go test/vet 和前端 lint/typecheck/build |

---

## 3. 用户角色

| 角色 | 本期参与方式 | 备注 |
| --- | --- | --- |
| 站点管理员 | 通过登录页认证，进入后台 | 当前唯一需要真实身份的角色 |
| 访客 | 不受本期直接影响 | 公开读接口不要求认证 |

---

## 4. 功能范围

| 模块 | 功能 |
| --- | --- |
| 构建基线 | 依赖锁定、包管理器统一、go.sum 修复 |
| 数据库基线 | SQLite/PostgreSQL 初始化文档、schema 就绪检查 |
| 认证 | 管理员初始化、登录、刷新、退出 |
| 授权 | JWT 中间件、管理员权限校验 |
| HTTP 基线 | 统一错误响应、请求超时、body 上限、request_id |
| 健康检查 | liveness、readiness |
| CI | GitHub Actions 工作流 |
| 文档 | 更新 README 现状、部署说明 |

---

## 5. 详细功能需求

### 5.1 依赖锁定与包管理器统一

#### 5.1.1 功能目的

修复 `go.sum` 缺失的 JWT v5.3.1 模块内容校验，统一前端包管理器为 pnpm，确保干净环境下构建可重复。

#### 5.1.2 使用角色

开发者、CI 环境。

#### 5.1.3 功能入口

- 后端：`go.mod`、`go.sum`
- 前端：`frontend/package.json`、`frontend/pnpm-lock.yaml`、`frontend/package-lock.json`、`Dockerfile`、`Makefile`

#### 5.1.4 页面展示内容

无页面，属于工程配置。

#### 5.1.5 操作流程

1. 开发者执行 `go mod tidy` 补全 `go.sum` 中 `golang-jwt/jwt/v5 v5.3.1` 的内容校验项。
2. 删除 `frontend/package-lock.json`，保留 `pnpm-lock.yaml`。
3. 将 `Dockerfile` 前端构建阶段从 `npm ci` 改为 `pnpm install --frozen-lockfile`。
4. 将 `Makefile` 中前端命令从 `npm` 改为 `pnpm`。
5. 在干净工作区验证 `go mod verify`、`go test ./...`、`go vet ./...`、`pnpm install`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 全部通过。

#### 5.1.6 业务规则

- 前端只保留 `pnpm-lock.yaml` 作为唯一锁文件。
- Docker 构建和 Makefile 必须使用 pnpm。
- `go.sum` 必须包含直接依赖和间接依赖的完整校验。

#### 5.1.7 状态设计

无状态流转。

#### 5.1.8 数据要求

无数据持久化。

#### 5.1.9 权限要求

无运行时权限。

#### 5.1.10 异常情况

| 场景 | 处理 |
| --- | --- |
| `go mod tidy` 仍无法补全校验 | 检查 GOPROXY 配置，或升级到 JWT v5 的下一个可用版本 |
| pnpm 在 Docker 中不可用 | 在 Node 镜像中安装 `corepack enable && corepack prepare pnpm@latest --activate` |

#### 5.1.11 验收标准

- Given 干净工作区，When 执行 `go mod verify`，Then 返回成功。
- Given 干净工作区，When 执行 `go test ./...`，Then 全部测试通过。
- Given `frontend/` 目录，When 检查锁文件，Then 只存在 `pnpm-lock.yaml`，不存在 `package-lock.json`。
- Given Docker 构建环境，When 执行 `docker compose build`，Then 前端阶段使用 pnpm 安装依赖。

---

### 5.2 数据库初始化与就绪检查

#### 5.2.1 功能目的

提供清晰的数据库初始化命令，让新开发者能按文档完成 SQLite/PostgreSQL 的建表导入；在运行时通过 readiness 检查识别数据库是否可用且核心表是否存在。

#### 5.2.2 使用角色

开发者、运维人员、CI 环境。

#### 5.2.3 功能入口

- 文档：`README.md` 快速开始章节
- 运行时：`GET /healthz/ready`

#### 5.2.4 页面展示内容

无业务页面。健康检查端点返回 JSON：

```json
{
  "status": "ok" | "degraded",
  "database": "connected" | "disconnected" | "schema_missing",
  "checks": {
    "articles_table": true,
    "settings_table": true,
    "users_table": true
  }
}
```

#### 5.2.5 操作流程

1. 开发者创建 SQLite 文件目录 `data/`。
2. 执行 `sqlite3 data/crescentlab.db < database/sqlite/schema.sql`。
3. 启动后端。
4. 访问 `GET /healthz/ready`，确认 `status` 为 `ok`。
5. 如果 schema 未导入，readiness 返回 `schema_missing`，后端日志记录缺失的表名。

#### 5.2.6 业务规则

- 不在启动时自动建表或自动迁移。
- readiness 只检查当前已实现模块依赖的表（`users`、`settings`、`articles`、`post_categories`）。
- liveness 只检查进程存活，不检查数据库。

#### 5.2.7 状态设计

| 状态 | 含义 | 进入条件 | 下一状态 |
| --- | --- | --- | --- |
| ok | 数据库连接正常且核心表存在 | ping 成功 + 表检查通过 | degraded（表被删除时） |
| degraded | 数据库不可达或核心表缺失 | ping 失败或表检查失败 | ok（恢复后） |

#### 5.2.8 数据要求

无新增数据表。就绪检查结果不持久化。

#### 5.2.9 权限要求

- `GET /healthz/live`：公开，不需要认证。
- `GET /healthz/ready`：公开，不泄露敏感信息（只返回表名是否存在，不返回表内容）。

#### 5.2.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 数据库连接失败 | readiness 返回 `database: disconnected`，HTTP 503 |
| 核心表不存在 | readiness 返回 `database: schema_missing`，HTTP 503 |
| 数据库慢响应 | readiness 有 3 秒超时，超时后返回 503 |

#### 5.2.11 验收标准

- Given 已导入 schema 的 SQLite，When 访问 `GET /healthz/ready`，Then 返回 200 且 `status: ok`。
- Given 未导入 schema 的 SQLite，When 访问 `GET /healthz/ready`，Then 返回 503 且 `database: schema_missing`。
- Given 数据库进程未启动，When 访问 `GET /healthz/ready`，Then 返回 503 且 `database: disconnected`。
- Given 后端进程存活，When 访问 `GET /healthz/live`，Then 返回 200。
- Given `README.md`，When 阅读快速开始章节，Then 能找到 SQLite 和 PostgreSQL 的初始化命令。

---

### 5.3 管理员初始化

#### 5.3.1 功能目的

在首次启动时创建一个可用的管理员账号，让管理员能够登录后台。不依赖自动迁移，而是通过受控的初始化命令完成。

#### 5.3.2 使用角色

开发者、部署人员。

#### 5.3.3 功能入口

- 命令行：`crescentlab admin init --username <name> --password <pass>`（或通过环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`）
- 配置文件：`conf.ini` 中可选 `[admin]` 段

#### 5.3.4 页面展示内容

无页面，命令行输出初始化结果：

```
admin user created: username=admin, status=active, group=admin
```

#### 5.3.5 操作流程

1. 部署者导入数据库 schema。
2. 部署者执行初始化命令或设置环境变量后启动后端。
3. 系统检查 `users` 表中是否已存在 `is_system = true` 的管理员。
4. 如果不存在，创建管理员用户：状态 `active`，密码使用 bcrypt 哈希，关联 `user_groups` 中 `is_admin = true` 的组。
5. 如果已存在，跳过并输出提示。

#### 5.3.6 业务规则

- 管理员用户名不区分大小写（使用 `username_key` 做唯一约束）。
- 密码长度不少于 8 个字符。
- 初始化只执行一次；重复执行不会覆盖已有管理员。
- 初始化不创建 `user_groups` 记录；管理员组由 schema 中的约定或手动 SQL 提供。
  - 如果 SQLite schema 没有 `user_groups` 表，则管理员的 `group_id` 为 NULL，`is_admin` 判断通过 `users.is_system` 或独立字段。
  - **待确认**：SQLite 是否需要补建 `user_groups` 表？见 Q-004。

#### 5.3.7 状态设计

| 状态 | 含义 | 进入条件 | 下一状态 |
| --- | --- | --- | --- |
| not_initialized | 系统中无管理员 | 首次部署 | initialized |
| initialized | 管理员已创建 | 执行初始化命令 | not_initialized（管理员被删除后） |

#### 5.3.8 数据要求

| 字段 | 含义 | 必填 | 类型 | 默认值 | 来源 | 校验 |
| --- | --- | --- | --- | --- | --- | --- |
| username | 登录用户名 | 是 | TEXT | — | 命令行/环境变量 | 非空，2~32 字符 |
| username_key | 小写唯一键 | 是 | TEXT | — | 由 username 转小写 | 唯一 |
| password_hash | bcrypt 哈希 | 是 | TEXT | — | 由密码生成 | bcrypt cost ≥ 10 |
| nickname | 显示名 | 是 | TEXT | 同 username | 命令行 | 非空 |
| status | 用户状态 | 是 | TEXT | `active` | 系统 | 枚举 |
| is_system | 系统用户 | 是 | BOOLEAN | `true` | 系统 | — |

#### 5.3.9 权限要求

- 初始化命令不需要认证（因为此时系统无管理员）。
- 初始化命令应在部署环境本地执行，不暴露为 HTTP 接口。

#### 5.3.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 密码不满足长度要求 | 返回错误，不创建用户 |
| 用户名已存在 | 返回提示，不覆盖 |
| `users` 表不存在 | 返回错误：请先导入 schema |
| 数据库不可达 | 返回错误：数据库连接失败 |

#### 5.3.11 验收标准

- Given 空 `users` 表，When 执行初始化命令，Then `users` 表中出现一条 `status=active`、`is_system=true` 的记录。
- Given 已有管理员，When 再次执行初始化命令，Then 输出提示且不创建新记录。
- Given 密码为 5 个字符，When 执行初始化命令，Then 返回错误且不创建用户。
- Given 初始化后的管理员，When 用该凭据登录，Then 登录成功并返回 token。

---

### 5.4 管理员登录

#### 5.4.1 功能目的

让管理员通过用户名和密码获取 JWT access/refresh token，建立可验证的登录态。

#### 5.4.2 使用角色

站点管理员。

#### 5.4.3 功能入口

- HTTP 接口：`POST /api/auth/login`
- 前端页面：`/login`（新增）

#### 5.4.4 页面展示内容

登录页 `/login`：

- 页面标题："CrescentLab 登录"
- 用户名输入框（label：用户名，placeholder：输入用户名）
- 密码输入框（label：密码，type：password，placeholder：输入密码）
- 登录按钮（primary，全宽）
- 错误提示区域（用户名或密码错误时显示）
- 返回前台链接

#### 5.4.5 操作流程

1. 管理员进入 `/login`。
2. 输入用户名和密码，点击登录。
3. 前端发送 `POST /api/auth/login`，body：`{username, password}`。
4. 后端按 `username_key` 查找用户。
5. 如果用户不存在或密码不匹配，返回 401，错误消息为"用户名或密码错误"（不区分两种情况）。
6. 如果用户状态不是 `active`，返回 403，错误消息为"账号已被禁用"。
7. 如果验证通过，生成 access token（TTL 2h）和 refresh token（TTL 7d）。
8. 更新 `last_login_at` 和 `last_login_ip`。
9. 返回 `{access_token, refresh_token, user: {id, username, nickname, is_admin}}`。
10. 前端存储 token（httpOnly cookie 或 localStorage，**待确认** Q-002），跳转到 `/admin`。

#### 5.4.6 业务规则

- 登录不区分用户名大小写。
- 密码验证使用 `bcrypt.CompareHashAndPassword`。
- 登录失败不泄露用户是否存在。
- 同一用户名连续失败 5 次后锁定 15 分钟（**建议**，如本期不实现需在 Q-005 中确认）。
- access token 过期后由前端使用 refresh token 刷新。
- 用户状态为 `pending`、`disabled`、`locked`、`deleted` 时不允许登录。

#### 5.4.7 状态设计

| 状态 | 含义 | 进入条件 | 下一状态 |
| --- | --- | --- | --- |
| unauthenticated | 未登录 | 进入登录页 | authenticated（登录成功） |
| authenticating | 正在提交 | 点击登录按钮 | authenticated / login_failed |
| login_failed | 登录失败 | 后端返回 401/403 | unauthenticated（重新输入） |
| authenticated | 已登录 | 后端返回 token | unauthenticated（退出或 token 失效） |

#### 5.4.8 数据要求

登录接口不产生新数据表。更新 `users.last_login_at` 和 `users.last_login_ip`。

Token claims：

| 字段 | 含义 | 类型 |
| --- | --- | --- |
| user_id | 用户 ID | int64 |
| username | 用户名 | string |
| is_admin | 是否管理员 | bool |
| token_type | access / refresh | string |
| exp | 过期时间 | timestamp |

#### 5.4.9 权限要求

- `POST /api/auth/login`：公开，不需要认证。
- 登录成功后 access token 可访问 `/api/admin/*`。

#### 5.4.10 异常情况

| 场景 | 前端处理 | 后端处理 |
| --- | --- | --- |
| 网络异常 | 显示"网络异常，请稍后重试" | — |
| 用户名或密码错误 | 显示"用户名或密码错误" | 返回 401 |
| 账号被禁用 | 显示"账号已被禁用" | 返回 403 |
| 用户名为空 | 前端校验拦截，不发请求 | — |
| 密码为空 | 前端校验拦截，不发请求 | — |
| 数据库不可达 | 显示"服务暂时不可用" | 返回 503 |
| 请求频率过高 | 显示"请稍后再试" | 返回 429（**建议**） |

#### 5.4.11 验收标准

- Given 已初始化的管理员，When 提交正确用户名和密码，Then 返回 200 且包含 `access_token` 和 `refresh_token`。
- Given 不存在的用户名，When 提交任意密码，Then 返回 401 且错误消息为"用户名或密码错误"。
- Given 正确用户名和错误密码，When 提交，Then 返回 401 且错误消息为"用户名或密码错误"。
- Given 状态为 `disabled` 的用户，When 提交正确凭据，Then 返回 403 且错误消息为"账号已被禁用"。
- Given 登录成功后，When 检查 `users` 表，Then `last_login_at` 已更新。
- Given 登录页，When 用户名为空时点击登录，Then 前端显示用户名必填提示且不发送请求。

---

### 5.5 Token 刷新

#### 5.5.1 功能目的

在 access token 过期后，使用 refresh token 获取新的 access token，避免管理员频繁重新登录。

#### 5.5.2 使用角色

站点管理员。

#### 5.5.3 功能入口

- HTTP 接口：`POST /api/auth/refresh`

#### 5.5.4 页面展示内容

无独立页面。由前端 Axios/fetch 拦截器在 access token 过期时自动调用。

#### 5.5.5 操作流程

1. 前端请求 `/api/admin/*` 时收到 401。
2. 前端拦截器检查是否有 refresh token。
3. 如果有，发送 `POST /api/auth/refresh`，body：`{refresh_token}`。
4. 后端验证 refresh token 的签名、类型和过期时间。
5. 如果有效，生成新的 access token，返回 `{access_token}`。
6. 如果无效或已过期，返回 401，前端清除 token 并跳转到 `/login`。
7. 前端用新 access token 重试原始请求。

#### 5.5.6 业务规则

- refresh token 不可用于访问 `/api/admin/*`。
- access token 不可用于刷新。
- 刷新不轮换 refresh token（本期不实现 refresh token 轮换，**待确认** Q-003）。

#### 5.5.7 状态设计

| 状态 | 含义 | 进入条件 | 下一状态 |
| --- | --- | --- | --- |
| valid | refresh token 有效 | 登录成功 | expired / revoked |
| expired | refresh token 过期 | 超过 7d | — |
| revoked | refresh token 已撤销 | 执行退出 | — |

#### 5.5.8 数据要求

本期不持久化 refresh token。退出操作通过前端的 `user_sessions` 表标记（如本期实现退出撤销，需写 `auth_tokens` 表）。

#### 5.5.9 权限要求

- `POST /api/auth/refresh`：公开，不需要认证。

#### 5.5.10 异常情况

| 场景 | 处理 |
| --- | --- |
| refresh token 签名无效 | 返回 401 |
| refresh token 已过期 | 返回 401 |
| refresh token 为空 | 返回 400 |
| 用户已被禁用 | 返回 403 |

#### 5.5.11 验收标准

- Given 有效的 refresh token，When 调用 `POST /api/auth/refresh`，Then 返回 200 且包含新的 `access_token`。
- Given 过期的 refresh token，When 调用刷新，Then 返回 401。
- Given access token 类型的 token，When 用它调用刷新，Then 返回 401（token_type 不匹配）。
- Given 刷新返回的新 access token，When 用它访问 `/api/admin/settings`，Then 返回 200。

---

### 5.6 管理员退出

#### 5.6.1 功能目的

让管理员主动终止登录态，使当前 refresh token 失效。

#### 5.6.2 使用角色

站点管理员。

#### 5.6.3 功能入口

- HTTP 接口：`POST /api/auth/logout`
- 前端：后台头部"退出"按钮

#### 5.6.4 页面展示内容

后台头部新增"退出"按钮（当前 AdminShell 头部只有"返回前台"和主题切换，需增加退出入口）。

#### 5.6.5 操作流程

1. 管理员点击"退出"按钮。
2. 前端发送 `POST /api/auth/logout`，header 携带 access token，body 携带 refresh token。
3. 后端将 refresh token 标记为已撤销（写入 `auth_tokens` 表或内存黑名单）。
4. 返回 204。
5. 前端清除本地 token，跳转到 `/login`。

#### 5.6.6 业务规则

- 退出后 refresh token 不可用于刷新。
- 退出后 access token 在过期前仍可用（本期不实现 access token 黑名单，**待确认** Q-003）。
- 未认证时调用退出返回 401。

#### 5.6.7 状态设计

| 状态 | 含义 |
| --- | --- |
| active | refresh token 可用 |
| revoked | refresh token 已撤销，不可用于刷新 |

#### 5.6.8 数据要求

如使用 `auth_tokens` 表持久化撤销状态：

| 字段 | 含义 | 类型 |
| --- | --- | --- |
| user_id | 用户 ID | BIGINT |
| token_hash | token 的 SHA256 哈希 | TEXT |
| purpose | `refresh` | TEXT |
| revoked_at | 撤销时间 | TIMESTAMPTZ |

#### 5.6.9 权限要求

- `POST /api/auth/logout`：需要认证。

#### 5.6.10 异常情况

| 场景 | 处理 |
| --- | --- |
| refresh token 为空 | 返回 400 |
| refresh token 已被撤销 | 返回 204（幂等） |
| 数据库写入失败 | 返回 500 |

#### 5.6.11 验收标准

- Given 已登录管理员，When 调用退出，Then 返回 204 且 refresh token 不可再用于刷新。
- Given 已退出的 refresh token，When 尝试刷新，Then 返回 401。
- Given 未认证请求，When 调用退出，Then 返回 401。

---

### 5.7 JWT 认证中间件与管理员授权

#### 5.7.1 功能目的

保护全部 `/api/admin/*` 接口，要求请求携带有效的 access token 且用户为管理员。

#### 5.7.2 使用角色

站点管理员。

#### 5.7.3 功能入口

- 代码：`internal/platform/http/middleware/auth.go`（新增）
- 路由注册：`cmd/server/app.go` 中对 `/api/admin` group 应用中间件

#### 5.7.4 页面展示内容

无页面。未认证时返回 JSON：

```json
{
  "code": "UNAUTHORIZED",
  "message": "请先登录"
}
```

无权限时返回：

```json
{
  "code": "FORBIDDEN",
  "message": "无权限访问"
}
```

#### 5.7.5 操作流程

1. 请求到达 `/api/admin/*`。
2. 中间件从 `Authorization: Bearer <token>` 提取 access token。
3. 如果 header 缺失或格式错误，返回 401。
4. 中间件调用 `auth.Service.ParseAccessToken` 验证签名和过期。
5. 如果验证失败，返回 401。
6. 中间件检查 `claims.IsAdmin`。
7. 如果非管理员，返回 403。
8. 将 `Identity` 写入 `gin.Context`，供后续 handler 使用。

#### 5.7.6 业务规则

- 中间件只应用于 `/api/admin/*` 前缀。
- `/api/articles`（公开读）和 `/api/auth/*` 不受中间件保护。
- access token 过期返回 401，前端应尝试刷新。

#### 5.7.7 状态设计

| 中间件结果 | HTTP 状态 | code |
| --- | --- | --- |
| token 缺失 | 401 | UNAUTHORIZED |
| token 无效 | 401 | INVALID_TOKEN |
| token 过期 | 401 | TOKEN_EXPIRED |
| 非管理员 | 403 | FORBIDDEN |
| 通过 | — | — |

#### 5.7.8 数据要求

无新增数据。中间件从 token claims 读取身份信息。

#### 5.7.9 权限要求

- 中间件本身是权限检查的执行者。

#### 5.7.10 异常情况

| 场景 | 处理 |
| --- | --- |
| Authorization header 格式不是 `Bearer <token>` | 返回 401 |
| token 签名算法不是 HS256 | 返回 401 |
| token claims 中 token_type 不是 access | 返回 401 |

#### 5.7.11 验收标准

- Given 无 Authorization header，When 请求 `/api/admin/settings`，Then 返回 401。
- Given 过期的 access token，When 请求 `/api/admin/settings`，Then 返回 401。
- Given refresh token 类型的 token，When 请求 `/api/admin/settings`，Then 返回 401。
- Given 有效管理员 access token，When 请求 `/api/admin/settings`，Then 返回 200。
- Given 有效但非管理员 access token（未来场景），When 请求 `/api/admin/settings`，Then 返回 403。

---

### 5.8 统一错误响应与 HTTP 基线

#### 5.8.1 功能目的

统一所有接口的错误返回格式，避免内部错误细节泄露；补充 HTTP 超时、body 上限和 request_id 关联。

#### 5.8.2 使用角色

开发者、前端、运维。

#### 5.8.3 功能入口

- 代码：`internal/platform/http/errors.go`（新增）、`internal/platform/http/server.go`（修改）

#### 5.8.4 页面展示内容

无页面。所有错误响应统一为：

```json
{
  "code": "ERROR_CODE",
  "message": "用户可读的错误消息",
  "request_id": "req_abc123"
}
```

#### 5.8.5 操作流程

1. 定义 `AppError` 接口和具体错误类型（如 `ValidationError`、`NotFoundError`、`AuthError`、`InternalError`）。
2. 定义错误码常量（如 `UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION_ERROR`、`INTERNAL_ERROR`）。
3. 实现 `ErrorHandler` 中间件，捕获 handler 返回的错误并统一格式化。
4. 在 `server.go` 中补充 `ReadTimeout`、`WriteTimeout`、`IdleTimeout` 和 `MaxHeaderBytes`。
5. 添加 `request_id` 中间件，为每个请求生成唯一 ID 并写入 context 和响应 header `X-Request-ID`。
6. 将日志中的 method/path/status 关联 request_id。
7. 修改现有 content/settings handler 中的 `errorResponse` 为统一错误结构。

#### 5.8.6 业务规则

- 内部错误（数据库异常、panic）只返回通用消息"服务暂时不可用"，详细错误写日志。
- 参数校验错误返回具体字段和原因。
- 404 错误不泄露资源是否曾存在。
- request_id 在日志、响应 header 和响应 body 中保持一致。

#### 5.8.7 状态设计

| 错误码 | HTTP 状态 | 使用场景 |
| --- | --- | --- |
| UNAUTHORIZED | 401 | 未认证 |
| TOKEN_EXPIRED | 401 | token 过期 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数校验失败 |
| CONFLICT | 409 | 状态冲突 |
| RATE_LIMITED | 429 | 请求频率过高 |
| INTERNAL_ERROR | 500 | 服务内部错误 |
| SERVICE_UNAVAILABLE | 503 | 数据库不可达 |

#### 5.8.8 数据要求

无新增数据。

#### 5.8.9 权限要求

无额外权限。

#### 5.8.10 异常情况

| 场景 | 处理 |
| --- | --- |
| handler panic | Recovery 中间件捕获，返回 500 + INTERNAL_ERROR |
| 请求体超过上限 | 返回 413 |
| 请求超时 | 返回 408 |

#### 5.8.11 验收标准

- Given 任意错误响应，When 检查响应体，Then 包含 `code`、`message` 和 `request_id` 字段。
- Given 数据库异常，When 接口返回错误，Then `message` 不包含数据库连接字符串或 SQL 语句。
- Given 任意请求，When 检查响应 header，Then 包含 `X-Request-ID`。
- Given 任意请求，When 检查后端日志，Then 日志行包含相同 request_id。
- Given 请求体超过 10MB，When 发送 POST 请求，Then 返回 413。

---

### 5.9 最小 CI

#### 5.9.1 功能目的

在每次提交和 PR 时自动执行构建和测试，防止回归。

#### 5.9.2 使用角色

开发者、CI 环境。

#### 5.9.3 功能入口

- 配置文件：`.github/workflows/ci.yml`（新增）

#### 5.9.4 页面展示内容

无页面。GitHub Actions 状态显示在 PR 检查中。

#### 5.9.5 操作流程

1. 开发者提交代码或创建 PR。
2. CI 工作流触发，执行以下 job：
   - Go：`go mod verify` → `go vet ./...` → `go test ./...` → `go build ./...`
   - Frontend：`pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm build`
3. 任一步骤失败则 CI 失败。
4. CI 在 Ubuntu latest 上运行，Go 1.26，Node 24。

#### 5.9.6 业务规则

- CI 不依赖外部数据库（Go 测试使用 SQLite 临时文件）。
- CI 不构建 Docker 镜像（本期不包含 CD）。

#### 5.9.7 状态设计

| 状态 | 含义 |
| --- | --- |
| pending | CI 正在运行 |
| success | 全部步骤通过 |
| failure | 有步骤失败 |

#### 5.9.8 数据要求

无数据持久化。

#### 5.9.9 权限要求

CI 使用默认 `GITHUB_TOKEN`，不需要额外密钥。

#### 5.9.10 异常情况

| 场景 | 处理 |
| --- | --- |
| Go 依赖下载失败 | 重试 1 次 |
| pnpm 依赖下载失败 | 使用 npm registry mirror |
| 测试超时 | 单 job 超时 10 分钟 |

#### 5.9.11 验收标准

- Given 向 main 分支提交，When CI 触发，Then Go 和 Frontend job 都执行。
- Given 测试失败，When CI 完成，Then PR 检查显示 failure。
- Given 全部通过，When CI 完成，Then PR 检查显示 success。

---

### 5.10 文档更新

#### 5.10.1 功能目的

更新 README 和架构文档，使其反映当前实际状态而非旧开发计划。

#### 5.10.2 使用角色

开发者、新加入的维护者。

#### 5.10.3 功能入口

- `README.md`
- `docs/ARCHITECTURE.md`

#### 5.10.4 页面展示内容

文档内容更新。

#### 5.10.5 操作流程

1. 更新 README "已完成"章节，反映认证、健康检查等新能力。
2. 更新 README "快速开始"，增加数据库初始化和管理员初始化命令。
3. 更新 ARCHITECTURE.md "后续接入顺序"，标记已完成项。
4. 将 `AGENTS/docs/DEVELOPMENT_PLAN.md` 中的旧计划标注为"历史参考，非当前实施路径"。

#### 5.10.6 业务规则

- 文档中的"当前"描述必须与代码一致。
- 旧计划不删除，但必须标注为历史参考。

#### 5.10.7 状态设计

无状态。

#### 5.10.8 数据要求

无数据。

#### 5.10.9 权限要求

无。

#### 5.10.10 异常情况

无。

#### 5.10.11 验收标准

- Given 新开发者阅读 README，When 按快速开始操作，Then 能完成数据库初始化、管理员初始化和后端启动。
- Given 阅读架构文档，When 查看后续接入顺序，Then 已完成项有明确标记。

---

## 6. 页面和交互清单

| 操作 | 页面/组件 | 入口 | 用途 |
| --- | --- | --- | --- |
| 新增 | `/login` 页面 | 导航栏"登录"链接或访问 `/admin` 时未认证跳转 | 管理员登录 |
| 修改 | `AdminShell` 头部 | 后台所有页面 | 增加"退出"按钮 |
| 修改 | `AdminShell` 权限检查 | 后台所有页面 | 从 localStorage persona 改为检查真实 token |
| 无变化 | `/` 首页 | — | 不修改 |
| 无变化 | `/admin` 仪表盘 | — | 不修改（仍为静态数据，阶段 02 接入） |

---

## 7. 接口能力清单

| 接口 | 用途 | 调用方 | 主要入参 | 主要出参 | 权限 | 现有状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /api/auth/login` | 管理员登录 | 前端登录页 | username, password | access_token, refresh_token, user | 公开 | 新增 |
| `POST /api/auth/refresh` | 刷新 token | 前端拦截器 | refresh_token | access_token | 公开 | 新增 |
| `POST /api/auth/logout` | 退出 | 后台退出按钮 | refresh_token | 204 | 需认证 | 新增 |
| `GET /healthz/live` | 存活检查 | 容器/运维 | — | 200 | 公开 | 新增 |
| `GET /healthz/ready` | 就绪检查 | 容器/运维 | — | 200/503 + 状态 | 公开 | 新增 |
| `GET /api/admin/settings` | 读取设置 | 设置页 | scope, group_key | settings[] | 需认证+管理员 | 扩展（加鉴权） |
| `PUT /api/admin/settings` | 保存设置 | 设置页 | settings[] | settings[] | 需认证+管理员 | 扩展（加鉴权） |
| `GET /api/articles` | 公开文章列表 | 前端首页 | page, page_size, search, category | ListResult | 公开 | 无变化 |
| `GET /api/articles/:slug` | 公开文章详情 | 前端文章页 | slug | ArticleDetail | 公开 | 无变化 |
| `GET /api/admin/articles` | 后台文章列表 | 后台文章页 | page, page_size, status, search | ListResult | 需认证+管理员 | 扩展（加鉴权） |
| `POST /api/admin/articles` | 创建文章 | 编辑器 | CreateInput | ArticleDetail | 需认证+管理员 | 扩展（加鉴权） |
| `PUT /api/admin/articles/:id` | 更新文章 | 编辑器 | CreateInput | ArticleDetail | 需认证+管理员 | 扩展（加鉴权） |
| `DELETE /api/admin/articles/:id` | 删除文章 | 后台文章页 | id | 204 | 需认证+管理员 | 扩展（加鉴权） |

---

## 8. 数据能力清单

| 操作 | 实体/表 | 说明 |
| --- | --- | --- |
| 新增 | `auth_tokens`（SQLite） | 如本期实现退出撤销，需在 SQLite schema 中补建此表 |
| 无变化 | `users` | 现有表已满足登录需求 |
| 无变化 | `settings` | 现有表无变化 |
| 无变化 | `articles` | 现有表无变化 |
| 无变化 | `post_categories` | 现有表无变化 |
| 待确认 | `user_groups` | SQLite 是否需要补建，见 Q-004 |

本期不涉及数据迁移。现有 SQLite 和 PostgreSQL schema 不做结构变更（除非 Q-004 确认需要补建 `auth_tokens` / `user_groups`）。

---

## 9. 非功能需求

| 维度 | 要求 |
| --- | --- |
| 性能 | 登录接口 p99 < 200ms（本地 SQLite）；健康检查 p99 < 50ms |
| 安全 | JWT secret 从环境变量注入，不硬编码；密码使用 bcrypt cost ≥ 10 |
| 可用性 | 后端启动失败时输出明确错误（数据库不可达、配置缺失等） |
| 响应速度 | 公开文章列表接口保持现有性能 |
| 浏览器兼容 | 登录页支持 Chrome 120+、Firefox 120+、Safari 17+ |
| 数据一致性 | 登录成功后 token 立即可用于管理接口 |
| 日志 | 登录成功/失败、退出、健康检查异常均写日志，关联 request_id |
| 异常追踪 | panic 由 Recovery 捕获并记录完整堆栈 |
| 可维护性 | 认证中间件与业务 handler 解耦 |
| 可扩展性 | 中间件设计支持后续增加可选认证（评论场景） |
| 测试要求 | auth 中间件、登录/刷新/退出 handler 有单元测试；登录→访问管理接口→退出有集成测试 |

---

## 10. 开发任务拆分

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-01-01 | 修复 go.sum | 补全 JWT v5.3.1 校验 | go.mod, go.sum | — | go.sum 更新 | `go mod verify` 通过 | P0 | 是 |
| T-01-02 | 统一包管理器 | 删除 package-lock.json，Dockerfile/Makefile 改用 pnpm | frontend, Dockerfile, Makefile | — | 锁文件和构建配置更新 | Docker build 使用 pnpm | P0 | 是 |
| T-01-03 | 实现 request_id 中间件 | 每个请求生成唯一 ID | platform/http | — | middleware/request_id.go | 响应 header 和日志包含 request_id | P1 | 是 |
| T-01-04 | 实现统一错误响应 | 定义 AppError 和错误码 | platform/http | T-01-03 | errors.go, middleware | 错误响应格式统一 | P1 | 否（需先完成 T-01-03） |
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

## 11. 推荐开发顺序

```
1. T-01-01 修复 go.sum + T-01-02 统一包管理器  → 验证：干净环境 test/vet/build 通过
2. T-01-03 request_id + T-01-04 统一错误 + T-01-05 HTTP 超时  → 验证：错误响应格式统一
3. 确认 Q-004（SQLite 是否补建 user_groups/auth_tokens）
4. T-01-06 健康检查 + T-01-07 管理员初始化  → 验证：healthz/ready 可用，管理员可创建
5. T-01-08 登录 + T-01-09 刷新 + T-01-10 退出  → 验证：完整认证流程
6. T-01-11 JWT 中间件 + T-01-12 路由注册  → 验证：/api/admin/* 受保护
7. T-01-13 修改现有 handler + T-01-17 前端 API 客户端  → 验证：前后端错误契约一致
8. T-01-14 登录页 + T-01-15 AdminShell 修改 + T-01-16 退出按钮  → 验证：前端登录流程完整
9. T-01-18 集成测试  → 验证：登录→访问→退出测试通过
10. T-01-19 CI + T-01-20 文档  → 验证：CI 运行，文档准确
```

---

## 12. 阶段完成定义

| 维度 | 完成条件 |
| --- | --- |
| 功能完成 | 登录、刷新、退出全部可用；管理员初始化命令可用 |
| 页面完成 | 登录页可提交；AdminShell 检查真实 token；退出按钮可用 |
| 接口完成 | `/api/auth/*` 三个接口可用；`/healthz/*` 两个接口可用 |
| 数据完成 | 管理员可初始化；登录更新 last_login_at；退出撤销 refresh token |
| 权限完成 | 全部 `/api/admin/*` 未认证返回 401；非管理员返回 403 |
| 异常处理完成 | 统一错误响应；内部错误不泄露详情；超时和 body 上限生效 |
| 测试完成 | auth 单元测试通过；登录→访问→退出集成测试通过 |
| 文档完成 | README 快速开始可操作；ARCHITECTURE 反映现状 |
| 部署验证完成 | Docker compose build 成功；干净环境 CI 通过 |
