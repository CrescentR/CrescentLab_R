# CrescentLab 类似项目开发计划

> 基于对 CrescentLab 项目的深度分析，制定的从零开始开发同类型博客/CMS 系统的完整路径。
> 技术栈：前端 Next.js + 后端 Go（沿用原项目架构）

---

## 一、项目目标

开发一个功能完整的自托管博客 & 内容管理系统（CMS），具备以下核心能力：

- 公开博客前端（文章展示、分类、标签、归档、相册、友链、音乐播放）
- 管理后台（文章编辑、文件管理、评论管理、用户管理、系统设置）
- 多数据库支持（SQLite / MySQL / PostgreSQL）
- 多云存储支持（本地 / OneDrive / 阿里云 OSS / AWS S3 / 腾讯 COS / 七牛）
- 插件系统、主题系统、定时任务、搜索、RSS / Sitemap、统计分析

---

## 二、技术栈选型

### 后端

| 类别 | 技术选型 | 版本 | 理由 |
|---|---|---|---|
| 语言 | Go | 1.22+ | 高性能、单二进制部署 |
| Web 框架 | Gin | v1.10+ | 最流行的 Go Web 框架，生态成熟 |
| ORM | Ent | v0.14+ | 类型安全的 ORM，Schema-first 设计 |
| 配置管理 | Viper | v1.19+ | 支持多格式、环境变量覆盖 |
| 认证 | JWT (golang-jwt) | v5 | 无状态认证，前后端分离友好 |
| 定时任务 | robfig/cron | v3 | 灵活的 Cron 表达式支持 |
| API 文档 | swaggo/swag | v1.16+ | 从代码注释自动生成 Swagger |
| 搜索 | 内置全文搜索 + 可选 Meilisearch | — | 渐进式搜索方案 |
| 缓存 | go-redis / 内存缓存 | — | Redis 可选，降级为内存 |
| Markdown | Goldmark | v1.7+ | 可扩展的 Markdown 解析器 |
| HTML 净化 | Bluemonday | v1.0+ | 防 XSS 攻击 |
| 图片处理 | disintegration/imaging | — | 纯 Go 图片处理 |
| ID 编码 | Sqids | — | 短 ID、不可猜测 |

### 前端

| 类别 | 技术选型 | 版本 | 理由 |
|---|---|---|---|
| 框架 | Next.js (App Router) | 15+ | SSR/SSG 支持，React 生态最成熟 |
| React | React | 19+ | 最新并发特性 |
| TypeScript | TypeScript | 5.x | 类型安全 |
| UI 组件库 | HeroUI（或 shadcn/ui） | v2+ | 现代化、可定制 |
| 富文本编辑器 | Tiptap | v3 | 可扩展、所见即所得 |
| 状态管理 | Zustand | v5 | 轻量、简洁 |
| 数据请求 | TanStack React Query | v5 | 缓存、乐观更新、自动重试 |
| 样式 | Tailwind CSS + SASS | v4 | 原子化 CSS，开发效率高 |
| HTTP 客户端 | Axios | — | 拦截器、请求取消 |
| 图标 | Lucide React | — | 树摇优化、风格统一 |

### 基础设施

| 类别 | 技术选型 |
|---|---|
| 数据库 | PostgreSQL 17（生产）/ SQLite（开发）/ MySQL（可选） |
| 缓存 | Redis（可选） |
| 容器 | Docker + Docker Compose |
| 发布 | GoReleaser v2 |
| 反向代理 | Nginx（生产可选） |

---

## 三、项目目录结构规划

```
your-blog/
├── main.go                          # 应用入口
├── cmd/
│   └── server/
│       └── app.go                   # App 结构体，8 阶段初始化，依赖注入
├── internal/
│   ├── app/
│   │   ├── bootstrap/               # 数据库初始化（默认用户、用户组、设置）
│   │   ├── middleware/              # 中间件（JWT、CORS、限流、统计、SSR 代理）
│   │   ├── task/                    # 定时任务（备份、清理、缩略图、同步、统计聚合）
│   │   └── listener/               # 事件监听器（文件后处理、缓存 revalidation）
│   ├── frontend/                    # Next.js 启动器 & 反向代理中间件
│   └── infra/
│       ├── persistence/
│       │   ├── database/            # 多数据库连接工厂 + Redis 连接
│       │   └── ent/                 # Ent ORM 仓储实现（每个实体一个文件）
│       ├── router/                  # Gin 路由注册（router.go 拆分多 register 方法）
│       └── storage/                 # 存储提供者抽象（本地、OneDrive、OSS、S3、COS、七牛）
├── pkg/
│   ├── config/                      # Viper 配置封装
│   ├── constant/                    # 枚举常量（StoragePolicyType、SettingKey 等）
│   ├── domain/
│   │   ├── model/                   # 领域模型（Article、User、File 等）
│   │   └── repository/             # 仓储接口（纯 interface，解耦 ORM）
│   ├── handler/                     # HTTP 处理器（每模块一个包，含 handler.go）
│   ├── service/                     # 业务逻辑（每模块一个包）
│   ├── plugin/                      # 插件系统（运行时二进制加载）
│   ├── ssr/                         # SSR 主题管理器
│   ├── idgen/                       # Sqids ID 生成器
│   ├── event/                       # 进程内事件总线
│   ├── version/                     # 版本注入（ldflags）
│   ├── parser/                      # Markdown/HTML 解析器
│   ├── security/                    # 密码哈希（bcrypt）
│   ├── auth/                        # JWT 工具（生成、验证、刷新）
│   └── util/                        # 通用工具函数
├── ent/
│   └── schema/                      # Ent Schema 定义（30 个实体）
├── frontend/                        # Next.js 前端应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── (frontend)/          # 公开博客页面路由组
│   │   │   ├── (album)/             # 相册路由组
│   │   │   ├── (auth)/              # 认证路由组（登录、激活、找回密码）
│   │   │   ├── (music)/             # 音乐播放路由组
│   │   │   └── admin/               # 管理后台路由组
│   │   ├── components/
│   │   │   ├── layout/              # 全局布局组件（Header、Footer）
│   │   │   ├── crescent/            # 博客壳组件（CrescentShell）
│   │   │   ├── admin/               # 管理后台组件（Sidebar、DataTable、Editor）
│   │   │   └── ui/                  # 通用 UI 原子组件
│   │   ├── lib/
│   │   │   ├── api/                 # API 客户端封装（每模块一个文件）
│   │   │   └── utils.ts             # 工具函数
│   │   ├── store/                   # Zustand 状态管理
│   │   │   ├── auth-store.ts        # 认证状态（token、用户信息）
│   │   │   ├── site-config-store.ts # 站点配置缓存
│   │   │   ├── ui-store.ts          # UI 状态（侧边栏、弹窗）
│   │   │   └── page-store.ts        # 页面状态
│   │   ├── hooks/                   # 自定义 Hooks
│   │   └── types/                   # TypeScript 类型定义
│   ├── public/                      # 静态资源
│   ├── next.config.ts               # Next.js 配置（standalone、rewrites）
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── package.json
├── data/
│   └── conf.ini                     # 运行时配置
├── default_files/
│   └── conf.ini                     # 默认配置模板
├── docs/                            # 项目文档 + Swagger
├── Makefile                         # 构建脚本
├── Dockerfile                       # 多阶段 Docker 构建
├── docker-compose.yml               # 生产 Compose
├── docker-compose.dev.yml           # 开发 Compose
├── .goreleaser.yml                  # 发布配置
├── go.mod / go.sum
└── README.md
```

---

## 四、数据库设计（30 个实体）

### 用户与权限
| 表名                          | 说明      | 关键字段                                                                            |
| --------------------------- | ------- | ------------------------------------------------------------------------------- |
| `users`                     | 用户表     | id, username, password_hash, nickname, avatar, email, website, status, group_id |
| `user_groups`               | 用户组表    | id, name, description, is_admin                                                 |
| `user_installed_themes`     | 用户已安装主题 | user_id, theme_name                                                             |
| `user_notification_configs` | 用户通知配置  | user_id, notification_type_id, enabled                                          |

### 文章与内容
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `articles` | 文章表 | id, owner_id, title, content_md, content_html, cover_url, status, view_count, word_count, pin_sort, home_sort |
| `article_histories` | 文章历史版本 | article_id, version, content_md, content_html, title |
| `pages` | 自定义页面表 | id, title, slug, content_md, content_html, status |
| `post_categories` | 文章分类 | id, name, slug, description, cover, sort |
| `post_tags` | 文章标签 | id, name, slug |
| `doc_series` | 文档系列 | id, title, description, sort |

### 评论系统
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `comments` | 评论表 | id, article_id, parent_id, nickname, email, content, status, ip, ua |

### 相册系统
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `albums` | 相册表 | id, title, description, cover_url, category_id, sort |
| `album_categories` | 相册分类 | id, name, sort |

### 友链系统
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `links` | 友链表 | id, name, url, logo, description, category_id, status, sort |
| `link_categories` | 友链分类 | id, name, sort |
| `link_tags` | 友链标签 | id, name |

### 文件与存储
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `files` | 文件/文件夹表 | id, name, uri, type, size, storage_policy_id |
| `file_entities` | 文件实体（物理文件） | id, file_id, entity_id, storage_policy_id |
| `entities` | 实体（去重存储） | id, hash, size |
| `metadata` | 文件元数据 | file_id, key, value |
| `storage_policies` | 存储策略 | id, name, type, bucket, endpoint, access_key |
| `direct_links` | 文件直链 | id, file_id, public_id, signed_token |

### 系统配置
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `settings` | 系统设置表 | key (唯一), value |
| `tags` | 通用标签 | id, name |
| `subscribers` | 邮件订阅者 | id, email, status, verify_token |
| `notification_types` | 通知类型 | id, name, description |

### 统计分析
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `visitor_stats` | 访客统计（按天聚合） | date, pv, uv |
| `visitor_logs` | 访客访问日志 | id, ip, ua, path, referer, country, city |
| `url_stats` | URL 统计 | path, total_views |

---

## 五、API 接口规划

### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/auth/login` | 登录 | 公开（限流） |
| POST | `/api/auth/register` | 注册 | 公开（限流） |
| POST | `/api/auth/refresh-token` | 刷新 Token | 公开 |
| POST | `/api/auth/activate` | 激活用户 | 公开 |
| POST | `/api/auth/forgot-password` | 忘记密码 | 公开（限流） |
| POST | `/api/auth/reset-password` | 重置密码 | 公开（限流） |

### 文章模块 `/api/articles` & `/api/public/articles`

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/public/articles` | 公开文章列表 | 公开 |
| GET | `/api/public/articles/home` | 首页文章列表 | 公开 |
| GET | `/api/public/articles/:id` | 文章详情 | 公开 |
| GET | `/api/public/articles/archives` | 归档列表 | 公开 |
| GET | `/api/public/articles/random` | 随机文章 | 公开 |
| GET | `/api/articles` | 后台文章列表 | 登录用户 |
| POST | `/api/articles` | 创建文章 | 登录用户 |
| PUT | `/api/articles/:id` | 更新文章 | 登录用户 |
| DELETE | `/api/articles/:id` | 删除文章 | 登录用户 |
| GET | `/api/articles/:id/history` | 文章历史版本 | 登录用户 |
| POST | `/api/articles/export` | 导出文章 | 管理员 |
| POST | `/api/articles/import` | 导入文章 | 管理员 |

### 评论模块 `/api/comments` & `/api/public/comments`

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/public/comments` | 按路径获取评论 | 公开 |
| POST | `/api/public/comments` | 发表评论 | 可选登录 |
| POST | `/api/public/comments/:id/like` | 点赞 | 公开 |
| GET | `/api/comments` | 后台评论列表 | 管理员 |
| PUT | `/api/comments/:id/status` | 更新状态 | 管理员 |
| DELETE | `/api/comments` | 删除评论 | 管理员 |

### 文件管理模块 `/api/file` & `/api/folder`

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/file` | 文件列表 | 登录用户 |
| GET | `/api/file/:id` | 文件信息 | 登录用户 |
| PUT | `/api/file/upload` | 创建上传会话 | 登录用户 |
| POST | `/api/file/upload/:sessionId/:index` | 上传分块 | 登录用户 |
| DELETE | `/api/file` | 删除文件 | 登录用户 |
| PUT | `/api/file/rename` | 重命名 | 登录用户 |
| POST | `/api/folder/move` | 移动文件 | 登录用户 |
| POST | `/api/folder/copy` | 复制文件 | 登录用户 |

### 用户管理 `/api/user` & `/api/admin/users`

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/user/info` | 当前用户信息 | 登录用户 |
| PUT | `/api/user/profile` | 更新资料 | 登录用户 |
| GET | `/api/admin/users` | 用户列表 | 管理员 |
| POST | `/api/admin/users` | 创建用户 | 管理员 |
| PUT | `/api/admin/users/:id` | 更新用户 | 管理员 |
| DELETE | `/api/admin/users/:id` | 删除用户 | 管理员 |

### 系统设置 `/api/settings` & `/api/config`

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/settings/get-by-keys` | 获取配置 | 登录用户 |
| POST | `/api/settings/update` | 更新配置 | 管理员 |
| GET | `/api/config/export` | 导出配置 | 管理员 |
| POST | `/api/config/import` | 导入配置 | 管理员 |
| POST | `/api/config/backup/create` | 创建备份 | 管理员 |
| GET | `/api/config/backup/list` | 备份列表 | 管理员 |

### 其他公开接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/public/site-config` | 站点配置（公开） |
| GET | `/api/public/albums` | 公开相册列表 |
| GET | `/api/public/links` | 公开友链列表 |
| GET | `/api/public/pages/*path` | 自定义页面 |
| GET | `/api/search?q=` | 全文搜索 |
| GET | `/api/public/statistics/basic` | 基础统计 |
| GET | `/sitemap.xml` | Sitemap |
| GET | `/robots.txt` | Robots |
| GET | `/rss.xml` | RSS Feed |

---

## 六、前端页面规划

### 公开前端页面 `(frontend)/`

| 路由                       | 页面   | 说明                 |
| ------------------------ | ---- | ------------------ |
| `/`                      | 首页   | 文章列表、置顶文章、推荐文章、侧边栏 |
| `/posts/[id]`            | 文章详情 | 渲染后 HTML、评论区、相关文章  |
| `/categories`            | 分类列表 | 所有分类及文章数           |
| `/categories/[name]`     | 分类文章 | 按分类筛选，支持分页         |
| `/tags`                  | 标签云  | 所有标签及文章数           |
| `/tags/[name]`           | 标签文章 | 按标签筛选，支持分页         |
| `/archives`              | 归档页  | 按时间线排列所有文章         |
| `/link`                  | 友链页  | 友链列表、申请友链表单        |
| `/about`                 | 关于页  | 自定义页面内容            |
| `/user-center`           | 用户中心 | 个人资料、修改密码          |
| `/doc/[id]`              | 文档系列 | 文档系列阅读页面           |
| `/equipment`             | 装备页  | 自定义装备展示            |
| `/air-conditioner`       | 空调页  | 趣味功能页              |
| `/random-post`           | 随机跳转 | 跳转到随机文章            |
| `/recentcomments`        | 最新评论 | 展示最新评论列表           |
| `/article-statistics`    | 文章统计 | 文章统计数据展示           |
| `/update`                | 更新日志 | 版本更新记录             |
| `/external-link-warning` | 外链警告 | 外部链接跳转确认           |

### 相册页面 `(album)/`

| 路由 | 页面 | 说明 |
|---|---|---|
| `/album` | 相册列表 | 所有相册、分类筛选、瀑布流布局 |

### 认证页面 `(auth)/`

| 路由 | 页面 | 说明 |
|---|---|---|
| `/login` | 登录 | 用户名/邮箱 + 密码，验证码 |
| `/activate` | 激活 | 邮箱激活链接落地页 |
| `/forgot-password` | 找回密码 | 邮箱发送重置链接 |

### 音乐页面 `(music)/`

| 路由 | 页面 | 说明 |
|---|---|---|
| `/music` | 音乐播放器 | 播放列表、播放控制、歌词 |

### 管理后台 `admin/`

| 路由 | 页面 | 说明 |
|---|---|---|
| `/admin` | 仪表盘 | 概览卡片、访问趋势、最近评论、热门文章 |
| `/admin/post-management` | 文章管理 | 文章列表、筛选、批量操作 |
| `/admin/post-management/new` | 新建文章 | Tiptap 富文本编辑器、SEO 设置、发布设置 |
| `/admin/post-management/[id]/edit` | 编辑文章 | 编辑已有文章 |
| `/admin/post-management/[id]/history` | 文章历史 | 版本对比、版本恢复 |
| `/admin/page-management` | 页面管理 | 自定义页面列表 |
| `/admin/page-management/new` | 新建页面 | 页面编辑 |
| `/admin/page-management/[id]/edit` | 编辑页面 | 编辑已有页面 |
| `/admin/comments` | 评论管理 | 评论列表、审核、删除 |
| `/admin/friends` | 友链管理 | 友链列表、分类管理、健康检查 |
| `/admin/albums` | 相册管理 | 相册列表、分类管理 |
| `/admin/file-management` | 文件管理 | 文件树、上传、移动、复制、预览 |
| `/admin/storage` | 存储策略 | 多云存储配置 |
| `/admin/storage/[id]` | 存储详情 | 存储策略编辑 |
| `/admin/users` | 用户管理 | 用户列表、创建、编辑、禁用 |
| `/admin/settings` | 系统设置 | 多 Tab 设置面板（详见下表） |
| `/admin/plugins` | 插件管理 | 插件列表、安装、卸载 |
| `/admin/themes` | 主题管理 | 主题切换、主题商城 |
| `/admin/doc-series` | 文档系列 | 文档系列管理 |

### 系统设置子模块（Tab 切换）

| Tab | 组件 | 说明 |
|---|---|---|
| 站点基础 | `SiteBasicForm` | 站点标题、描述、Logo |
| 外观皮肤 | `AppearanceSkinForm` | 主题色、Token 颜色 |
| 首页配置 | `HomePageForm` | 首页顶部、导航菜单、置顶文章 |
| 文章设置 | `PostSettingsForm` | 文章相关全局配置 |
| 评论设置 | `CommentSettingsForm` | 评论审核、通知、表情包 |
| 邮件设置 | `EmailSettingsForm` | SMTP 配置、测试发送 |
| 文件设置 | `FileSettingsForm` | 上传限制、缩略图配置 |
| 友链设置 | `FriendLinkSettingsForm` | 友链申请配置 |
| SEO 设置 | `SeoSettingsForm` | Meta 标签、Sitemap、Robots |
| 验证码设置 | `CaptchaSettingsForm` | 验证码类型选择和配置 |
| 侧边栏 | `SidebarForm` | 侧边栏组件配置 |
| 关于页 | `AboutPageForm` | 关于页内容编辑 |
| 相册页 | `AlbumPageForm` | 相册页配置 |
| 音乐页 | `MusicPageForm` | 音乐播放器配置 |
| 装备页 | `EquipmentPageForm` | 装备展示配置 |
| 最新评论页 | `RecentCommentsPageForm` | 最新评论页配置 |
| 微信分享 | `WechatShareForm` | 微信 JS-SDK 分享配置 |
| 备份导入 | `BackupImportForm` | 配置备份与恢复 |

---

## 七、开发阶段规划（按模块逐步推进）

### 第一阶段：基础设施与骨架（第 1-2 周）

**目标**：搭建项目骨架，实现可运行的最小系统。

#### 后端

1. **初始化 Go 项目**
   - `go mod init github.com/YourName/YourBlog`
   - 安装核心依赖：Gin、Ent、Viper、JWT、go-redis、go-sql-driver/mysql、lib/pq、ncruces/go-sqlite3
   - 创建 `main.go`、`cmd/server/app.go` 骨架

2. **配置系统**（`pkg/config/`）
   - 定义配置结构体（System、Database、Redis）
   - 使用 Viper 加载 `data/conf.ini`
   - 支持环境变量覆盖（`YOURBLOG_DATABASE_HOST` 等）
   - 创建默认配置模板（`default_files/conf.ini`）

3. **数据库连接**（`internal/infra/persistence/database/`）
   - 实现 `NewSQLDB(cfg)`：根据 Type 字段自动选择 SQLite / MySQL / PostgreSQL
   - 连接池配置：MaxIdleConns=10, MaxOpenConns=100, ConnMaxLifetime=1h
   - 实现 `NewEntClient(sqlDB, cfg)`：创建 Ent 客户端
   - 实现 `NewRedisClient(ctx, cfg)`：Redis 连接，失败时返回 nil

4. **Ent Schema 设计**（`ent/schema/`）
   - 先实现核心 6 个表：`user`、`user_group`、`setting`、`article`、`post_category`、`post_tag`
   - 运行 `go generate ./ent` 生成代码
   - 实现 SoftDeleteMixin

5. **仓储层**（`internal/infra/persistence/ent/`）
   - 为每个 Schema 实现对应的 Repository
   - 定义仓储接口（`pkg/domain/repository/`）

6. **数据库初始化**（`internal/app/bootstrap/`）
   - 自动迁移：`entClient.Schema.Create(ctx, migrate.WithDropIndex(true), migrate.WithDropColumn(true))`
   - 默认数据初始化：管理员用户、用户组、默认设置

#### 前端

7. **初始化 Next.js 项目**
   ```bash
   npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
   ```
   - 安装依赖：HeroUI、Zustand、React Query、Axios、Lucide React、Framer Motion
   - 配置 `next.config.ts`：standalone 输出、API rewrites 到 Go 后端
   - 配置 `tsconfig.json`：路径别名 `@/*` → `./src/*`

8. **前端基础架构**
   - 创建 Zustand Store：`auth-store.ts`、`site-config-store.ts`、`ui-store.ts`
   - 创建 API 客户端：`lib/api/client.ts`（Axios 实例、拦截器、Token 刷新）
   - 创建根 Layout：`app/layout.tsx`（全局 Provider、字体、Tailwind）
   - 创建管理后台 Layout：`app/admin/layout.tsx`（Sidebar + 主内容区）

9. **Makefile 与 Docker**
   - 编写 Makefile：build、test、fmt、vet、frontend-build、docker 等目标
   - 编写 Dockerfile（多阶段：前端构建 → Go 编译 → 运行时镜像）
   - 编写 docker-compose.yml（Go + PostgreSQL + Redis）

---

### 第二阶段：认证与用户系统（第 2-3 周）

**目标**：实现完整的用户认证流程。

#### 后端

1. **JWT 认证服务**（`pkg/auth/`）
   - Token 生成（Access Token 2h + Refresh Token 7d）
   - Token 验证与刷新
   - Claims 结构：UserID、Username、IsAdmin

2. **认证中间件**（`internal/app/middleware/auth.go`）
   - `JWTAuth()`：强制认证
   - `JWTAuthOptional()`：可选认证（评论等场景）
   - `AdminAuth()`：管理员权限检查

3. **认证 Handler**（`pkg/handler/auth/`）
   - 登录：验证密码 → 生成 Token → 返回
   - 注册：创建用户 → 发送激活邮件
   - 激活：验证激活 Token → 更新状态
   - 忘记密码：发送重置邮件
   - 重置密码：验证 Token → 更新密码

4. **用户 Handler**（`pkg/handler/user/`）
   - 获取用户信息、更新资料、修改密码、上传头像
   - 管理员：用户列表、创建、更新、删除、重置密码

#### 前端

5. **登录页面**（`app/(auth)/login/page.tsx`）
   - 用户名/邮箱 + 密码表单
   - 图形验证码集成
   - 登录成功后存入 Zustand auth-store，重定向到 `/admin`

6. **管理后台认证守卫**
   - AdminLayout 中检查 auth-store 状态
   - 未登录重定向到 `/login`，非管理员重定向到 `/`
   - Token 过期自动刷新（Axios 拦截器）

7. **用户中心页面**（`app/(frontend)/user-center/page.tsx`）
   - 个人资料编辑、头像上传、密码修改

---

### 第三阶段：文章核心系统（第 3-5 周）

**目标**：实现文章的完整 CRUD、编辑器、分类标签。

#### 后端

1. **文章 Service**（`pkg/service/article/`）
   - 创建、更新、删除、列表、详情
   - Markdown → HTML 转换（Goldmark）
   - HTML 净化（Bluemonday）
   - 字数统计、阅读时长计算
   - 文章状态管理：DRAFT / PUBLISHED / ARCHIVED / SCHEDULED
   - 定时发布（Cron 任务扫描 SCHEDULED 状态文章）

2. **文章历史版本**（`pkg/service/article_history/`）
   - 每次更新保存历史快照
   - 版本列表、版本对比、版本恢复

3. **分类与标签**（`pkg/service/post_category/`、`pkg/service/post_tag/`）
   - 分类 CRUD + 文章计数
   - 标签 CRUD + 文章引用计数

4. **搜索服务**（`pkg/service/search/`）
   - 内置全文搜索：内存倒排索引
   - 启动时异步重建索引
   - 可选 Meilisearch 插件接管

#### 前端

5. **Tiptap 富文本编辑器**（`components/admin/article-editor/`）
   - 基础编辑器：标题、段落、加粗、斜体、链接、图片
   - 扩展组件：代码块、表格、任务列表、数学公式（KaTeX）、Mermaid 图
   - 工具栏：`EditorToolbar.tsx`
   - 气泡菜单：`EditorBubbleMenu.tsx`
   - 侧边栏：`EditorSidebar.tsx`（分类、标签、封面、SEO 设置）
   - 源码编辑：`SourceCodeEditor.tsx`（Monaco Editor）
   - Slash 命令：`slash-commands.tsx`

6. **文章管理页面**
   - 文章列表：`admin/post-management/page.tsx`（表格、筛选、批量操作）
   - 新建文章：`admin/post-management/new/page.tsx`
   - 编辑文章：`admin/post-management/[id]/edit/page.tsx`
   - 历史版本：`admin/post-management/[id]/history/page.tsx`

7. **公开文章页面**
   - 首页：`app/(frontend)/page.tsx`（文章列表、分页、侧边栏）
   - 文章详情：`app/(frontend)/posts/[id]/page.tsx`（渲染 HTML、目录导航、评论区占位）
   - 分类页：`app/(frontend)/categories/`（分类列表 + 分类文章）
   - 标签页：`app/(frontend)/tags/`（标签云 + 标签文章）
   - 归档页：`app/(frontend)/archives/`（时间线排列）

---

### 第四阶段：文件管理与存储系统（第 5-7 周）

**目标**：实现文件上传、管理、多云存储。

#### 后端

1. **存储策略抽象**（`internal/infra/storage/`）
   - 定义 `IStorageProvider` 接口：Upload、Download、Delete、GetURL
   - 实现本地存储提供者
   - 实现 OneDrive、阿里云 OSS、AWS S3、腾讯 COS、七牛存储提供者

2. **存储策略 Service**（`pkg/service/volume/`）
   - 策略管理：CRUD、连接测试
   - OneDrive OAuth 授权流程
   - 策略模式：`StrategyManager` 根据类型选择提供者

3. **文件 Service**（`pkg/service/file/`）
   - 虚拟文件系统（VFS）：文件夹/文件树
   - 分块上传：创建会话 → 上传分块 → 合并
   - 文件操作：重命名、移动、复制、删除
   - 文件去重：基于 SHA256 的 Entity 去重

4. **文件 Handler**（`pkg/handler/file/`）
   - 分离为 4 个文件：`handler.go`（总入口）、`query.go`（查询）、`upload.go`（上传）、`operation.go`（操作）、`download.go`（下载）

5. **直链与缩略图**
   - 直链服务：基于 Sqids 的公开 ID + 签名 Token
   - 缩略图服务：按需生成 + 磁盘缓存
   - 图片样式处理：裁剪、水印、格式转换

#### 前端

6. **文件管理器**（`components/admin/file-manager/`）
   - 文件树视图：`FileTreeView`（左侧文件夹树）
   - 网格视图：`FileGridView`（缩略图网格）
   - 列表视图：`FileListView`（详细信息表格）
   - 文件详情面板：`FileDetailsPanel`（右侧信息栏）
   - 上传组件：`UploadProgress`（上传进度条）
   - 右键菜单：`ContextMenu`（复制、移动、删除、重命名）
   - 面包屑导航：`FileBreadcrumb`
   - 搜索覆盖：`SearchOverlay`

7. **存储策略管理**（`admin/storage/page.tsx`）
   - 存储策略列表、创建、编辑
   - OneDrive OAuth 授权流程
   - 存储详情页：`admin/storage/[id]/page.tsx`

---

### 第五阶段：评论系统（第 7-8 周）

#### 后端

1. **评论 Service**（`pkg/service/comment/`）
   - 创建评论（支持嵌套回复）
   - 评论审核：待审 / 通过 / 拒绝
   - 评论点赞/取消点赞
   - IP 属地解析（GeoIP）
   - QQ 信息自动获取（昵称、头像）
   - 评论图片上传
   - 通知推送：新评论邮件通知、Pushoo 推送

2. **评论 Handler**（`pkg/handler/comment/`）
   - 公开接口：列表、创建、点赞、子评论
   - 管理接口：列表、删除、更新内容、更新状态、置顶

#### 前端

3. **评论组件**（前端文章详情页内嵌）
   - 评论列表：嵌套展示、头像、昵称、时间、内容
   - 评论表单：昵称、邮箱、内容、验证码
   - 回复框：点击"回复"展开子表单
   - 点赞按钮

4. **评论管理页面**（`admin/comments/page.tsx`）
   - 评论列表：筛选（全部/待审/通过）、搜索
   - 操作：通过、拒绝、删除、置顶、编辑内容

---

### 第六阶段：相册与友链系统（第 8-9 周）

#### 后端

1. **相册 Service**（`pkg/service/album/`）
   - 相册 CRUD + 分类管理
   - 批量导入/导出
   - 访问统计

2. **友链 Service**（`pkg/service/link/`）
   - 友链 CRUD + 分类 + 标签
   - 友链申请（带频率限制）
   - 友链健康检查（定期检测 URL 可用性）
   - 友链导入/导出
   - 新友链通知（Pushoo + 邮件）

#### 前端

3. **相册页面**
   - 公开相册页：瀑布流布局、分类筛选、点击查看大图
   - 后台相册管理：表格/卡片视图切换、批量导入导出

4. **友链页面**
   - 公开友链页：友链卡片展示、申请表单
   - 后台友链管理：列表/卡片视图、健康检查面板、分类标签管理

---

### 第七阶段：系统设置与配置管理（第 9-10 周）

#### 后端

1. **设置 Service**（`pkg/service/setting/`）
   - Key-Value 存储，启动时全量加载到内存
   - 按模块分组：站点基础、外观、文章、评论、邮件、文件、SEO 等
   - 配置变更事件总线通知

2. **配置备份 Service**（`pkg/service/config/`）
   - 导出：将所有 Setting 打包为 JSON 文件
   - 导入：解析 JSON 并覆盖写入
   - 备份：定时自动备份到 `data/backup/` 目录
   - 恢复：从备份文件恢复

3. **邮件 Service**（`pkg/service/utility/`）
   - SMTP 配置管理
   - 发送邮件（激活、重置密码、评论通知）
   - 邮件测试接口

#### 前端

4. **设置页面**（`admin/settings/page.tsx`）
   - 左侧 Tab 导航，右侧对应表单
   - 18 个设置表单组件（见第六章设置子模块）
   - 浮动保存按钮：`FloatingSaveButton`
   - 配置导入导出界面

5. **备份管理**（`admin/settings/BackupImportForm.tsx`）
   - 备份列表、创建备份、恢复备份、删除备份

---

### 第八阶段：统计分析与 SEO（第 10-11 周）

#### 后端

1. **访客统计 Service**（`pkg/service/statistics/`）
   - 访客记录中间件：IP、UA、路径、Referer
   - 按天聚合：PV、UV（基于 IP 去重）
   - URL 统计：每个页面的访问量
   - GeoIP 解析：国家、城市

2. **Sitemap & RSS**（`pkg/service/sitemap/`、`pkg/service/rss/`）
   - Sitemap.xml 自动生成
   - Robots.txt 生成
   - RSS/Atom/Feed.xml 生成

3. **统计 Cron 任务**
   - 每日访客聚合任务
   - 过期日志清理任务

#### 前端

4. **仪表盘**（`admin/dashboard/page.tsx`）
   - 概览卡片：总文章数、总评论数、今日 PV、总用户数
   - 访问趋势图：折线图（近 30 天 PV/UV）
   - 最近评论：快速预览
   - 热门文章：按浏览量排序

5. **统计页面**（`admin/statistics/` 或仪表盘内）
   - 访客分析：时间段筛选、趋势图表
   - 热门页面：Top 10 页面
   - 访客日志：详细访问记录

---

### 第九阶段：主题系统与插件系统（第 11-13 周）

#### 后端

1. **主题 Service**（`pkg/service/theme/`）
   - 主题安装（上传 ZIP 解压到 `data/themes/`）
   - 主题切换、卸载
   - 主题配置：Schema 定义 + 用户配置值
   - 主题商城：从远程获取可用主题列表

2. **SSR 主题管理器**（`pkg/ssr/`）
   - Node.js SSR 主题的启动、停止、状态管理
   - 反向代理中间件：检测 SSR 主题，将请求代理到 Node.js 进程

3. **插件系统**（`pkg/plugin/`）
   - 插件发现：扫描 `data/plugins/` 目录下的二进制文件
   - 插件加载：以子进程方式启动插件二进制
   - 插件通信：HTTP 或 gRPC
   - 搜索引擎插件接口：允许插件接管搜索功能

#### 前端

4. **主题管理页面**（`admin/themes/page.tsx`）
   - 当前主题展示、已安装主题列表
   - 主题商城：浏览、安装、切换
   - 主题配置编辑器

5. **插件管理页面**（`admin/plugins/page.tsx`）
   - 已安装插件列表、启用/禁用
   - 插件安装（上传二进制）

---

### 第十阶段：通知系统与其他功能（第 13-14 周）

#### 后端

1. **通知 Service**（`pkg/service/notification/`）
   - 通知类型管理（新评论、新友链申请、系统通知）
   - 用户通知配置（启用/禁用每种通知）
   - 通知发送：邮件 + Pushoo 推送

2. **订阅 Service**（`pkg/service/subscriber/`）
   - 邮件订阅：注册 → 邮箱验证 → 订阅成功
   - 退订：Token 链接退订
   - 新文章发布时自动通知订阅者

3. **验证码 Service**（`pkg/service/captcha/`、`pkg/service/turnstile/`、`pkg/service/geetest/`）
   - 图形验证码（base64Captcha）
   - Turnstile（Cloudflare）
   - Geetest 极验

4. **音乐 Service**（`pkg/service/music/`）
   - 播放列表获取（从配置读取）
   - 歌曲资源获取
   - 封面颜色提取

5. **Cron 任务汇总**（`internal/app/task/`）
   - 定时备份：每日自动备份配置
   - 缩略图清理：清理孤立缩略图
   - 文件同步：检测并修复存储不一致
   - 统计聚合：每日 PV/UV 聚合
   - 友链健康检查：定期检测友链可用性
   - 历史版本清理：清理过旧的历史版本
   - 定时发布：扫描 SCHEDULED 状态文章并发布
   - 订阅通知：发布后通知订阅者

#### 前端

6. **通知设置页面**（用户中心内）
   - 通知类型列表、启用/禁用开关

7. **其他页面**
   - 音乐播放页：`app/(music)/music/page.tsx`
   - 自定义页面渲染：`app/(frontend)/doc/[id]/page.tsx`
   - 最新评论页：`app/(frontend)/recentcomments/page.tsx`
   - 文档系列管理：`admin/doc-series/page.tsx`

---

### 第十一阶段：Docker 部署与发布（第 14-15 周）

1. **Docker 优化**
   - 多阶段 Dockerfile：前端构建 → Go 编译 → 最小运行时镜像
   - 支持 vips-tools、FFmpeg、LibRaw 等可选工具
   - entrypoint.sh：数据库等待、迁移、启动

2. **Docker Compose**
   - 生产环境：Go + PostgreSQL 17 + Redis
   - 开发环境：挂载本地二进制、热重载

3. **GoReleaser 配置**
   - 多平台构建：linux/amd64、linux/arm64、darwin/amd64、darwin/arm64、windows/amd64
   - Docker 多架构镜像（AMD64 + ARM64）
   - GitHub Release 自动生成

4. **API 文档**
   - 完善 Swagger 注释
   - 运行 `make swagger` 生成 `docs/swagger.json` 和 `docs/swagger.yaml`

---

### 第十二阶段：收尾与优化（第 15-16 周）

1. **前端性能优化**
   - 图片懒加载
   - 路由预加载
   - 骨架屏（Skeleton）组件
   - 首屏 SSR 优化

2. **后端性能优化**
   - 接口缓存策略（Redis / 内存缓存）
   - 数据库查询优化（N+1 检测）
   - 慢查询日志

3. **安全加固**
   - CSRF 防护
   - SQL 注入检查（Ent 已内置）
   - XSS 防护（Bluemonday 净化）
   - 速率限制（全局限流 + 关键接口限流）
   - 文件上传类型检查

4. **监控与日志**
   - 结构化日志
   - 错误上报
   - 健康检查接口

5. **文档完善**
   - README.md：安装、配置、部署
   - API_REFERENCE.md
   - DATABASE_SCHEMA.md
   - FRONTEND_GUIDE.md

---

## 八、关键技术实现要点

### 8.1 前后端一体化部署

Go 后端启动时以子进程方式拉起 Next.js 前端，并通过 Gin 中间件反向代理前端请求：

```
用户请求 → Go (Gin) :8091
  ├─ /api/*     → Go Handler 处理
  ├─ /f/*       → Go 文件直链
  ├─ /admin/*   → 代理到 Next.js 子进程
  └─ /*         → 代理到 Next.js 子进程（或 static/ 目录）
```

Next.js `next.config.ts` 中配置反向代理：

```typescript
rewrites: async () => ({
  beforeFiles: [
    { source: '/api/:path*', destination: 'http://localhost:8091/api/:path*' },
    { source: '/f/:path*', destination: 'http://localhost:8091/f/:path*' },
  ]
})
```

### 8.2 Ent ORM 多数据库支持

Ent Schema 定义一次，通过连接不同的 `dialect.Driver` 支持多数据库：

```go
// SQLite
sqlDB, _ = sql.Open("sqlite3", "data/blog.db")
// MySQL
sqlDB, _ = sql.Open("mysql", "user:pass@tcp(localhost:3306)/dbname")
// PostgreSQL
sqlDB, _ = sql.Open("postgres", "host=localhost port=5432 user=postgres dbname=blog")
```

### 8.3 事件总线模式

进程内事件总线，解耦文件上传后的处理流程：

```go
// 发布事件
eventBus.Publish(event.FileUploadedEvent{FileID: fileID})

// 监听事件
eventBus.Subscribe(event.FileUploadedEvent{}, func(e event.Event) {
    // 提取元数据、生成缩略图、更新搜索索引
})
```

### 8.4 插件系统

运行时二进制加载，插件以独立进程运行：

```go
// 扫描 data/plugins/ 目录
entries, _ := os.ReadDir("data/plugins/")
for _, entry := range entries {
    cmd := exec.Command(filepath.Join("data/plugins", entry.Name()))
    cmd.Start() // 子进程启动
}
```

### 8.5 ID 生成策略

使用 Sqids（原 Hashids）将数据库自增 ID 编码为短字符串，防止 ID 枚举：

```go
encoder, _ := sqids.New(sqids.Options{
    MinLength: 6,
    Alphabet:  "abcdefghijklmnopqrstuvwxyz0123456789",
})
publicID := encoder.Encode([]uint64{123}) // → "k4q8xr"
```

---

## 九、开发顺序建议（依赖关系图）

```
Phase 1:  基础设施（配置、DB、仓储、Makefile、Docker）
    ↓
Phase 2:  认证系统（JWT、中间件、登录注册）
    ↓
Phase 3:  文章系统（CRUD、编辑器、分类标签、搜索）    ← 核心功能，优先级最高
    ↓
Phase 4:  文件系统（上传、多云存储、直链、缩略图）    ← 文章编辑器需要图片上传
    ↓
Phase 5:  评论系统（嵌套评论、审核、通知）            ← 文章详情页需要评论区
    ↓
Phase 6:  相册 + 友链（独立模块，可并行开发）
    ↓
Phase 7:  系统设置（配置管理、备份、邮件）
    ↓
Phase 8:  统计 + SEO（Sitemap、RSS、访客统计）
    ↓
Phase 9:  主题 + 插件（高级功能，可选）
    ↓
Phase 10: 通知 + 订阅 + 验证码 + 音乐（收尾功能）
    ↓
Phase 11: 部署（Docker、GoReleaser、文档）
    ↓
Phase 12: 优化（性能、安全、监控）
```

---

## 十、里程碑检查清单

| 里程碑 | 完成标志 | 预计时间 |
|---|---|---|
| M1: 项目可启动 | `go run main.go` 启动成功，前端显示空白页 | 第 1 周末 |
| M2: 可登录 | 登录 → 进入管理后台仪表盘 | 第 2 周末 |
| M3: 可发文章 | 创建文章 → 前端可查看文章详情 | 第 4 周末 |
| M4: 可上传文件 | 文件管理器可用，图片上传到本地/云存储 | 第 6 周末 |
| M5: 可评论 | 文章详情页可发表评论，后台可管理评论 | 第 8 周末 |
| M6: 后台完整 | 所有管理后台页面可用（设置、相册、友链、用户） | 第 10 周末 |
| M7: 前台完整 | 所有公开页面可用（归档、标签、分类、相册、友链） | 第 12 周末 |
| M8: 高级功能 | 主题系统、插件系统、统计分析、搜索 | 第 14 周末 |
| M9: 可部署 | Docker 镜像构建成功，一键部署文档完成 | 第 15 周末 |
| M10: 生产就绪 | 安全加固、性能优化、文档完善 | 第 16 周末 |

---

## 十一、常用开发命令速查

```bash
# 后端
go run main.go                   # 启动开发服务器
go test ./...                    # 运行测试
go fmt ./...                     # 格式化代码
go vet ./...                     # 静态分析
go generate ./ent                # 重新生成 Ent 代码
make swagger                     # 生成 Swagger 文档

# 前端
cd frontend && npm run dev       # 启动 Next.js 开发服务器
npm run build                    # 生产构建
npm run lint                     # ESLint 检查
npm run test                     # Vitest 测试

# 构建与部署
make build                       # 当前平台构建
make build-all                   # 全平台构建
make frontend-build              # 构建前端
make docker                      # 构建 Docker 镜像
make dev                         # 启动 Docker 开发环境
make goreleaser-release-dry      # 发布预演
```

---

## 十二、注意事项

1. **Ent Schema 变更后必须重新生成**：修改 `ent/schema/` 后运行 `go generate ./ent`，启动时自动迁移数据库
2. **环境变量命名规范**：使用 `YOURBLOG_` 前缀，支持向后兼容旧前缀
3. **前端 API 代理**：开发时 Next.js 通过 rewrites 代理 `/api/*` 到 Go 后端；生产时由 Go 反向代理 Next.js
4. **软删除**：通过 Ent Mixin 实现，查询时自动过滤已删除记录
5. **ID 安全**：对外暴露 Sqids 编码的 PublicID，数据库使用自增 ID
6. **图片处理**：Docker 镜像中可选安装 vips-tools、FFmpeg、LibRaw 以支持更多格式
7. **缓存策略**：Settings 启动时全量加载到内存；热点数据使用 Redis 缓存；Redis 不可用时自动降级为内存缓存
