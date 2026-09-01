# CrescentLab 项目目录结构

这版目录不再照搬开发计划中的抽象分层，而是按“入口、平台能力、业务模块、共享能力、前端、数据库”来组织。目标是让开发时能直接知道代码应该放哪里。

```text
.
├── cmd/
│   └── server/                  # Go 服务入口组装，负责启动 HTTP、任务、前端代理等
├── internal/
│   ├── modules/                 # 业务模块，每个模块自带 handler/service/repository/dto
│   │   ├── users/               # 用户、用户组、权限、登录态
│   │   ├── content/             # 文章、页面、分类、标签、文档系列
│   │   ├── media/               # 文件、上传、存储策略、缩略图、直链
│   │   ├── comments/            # 评论、审核、点赞、附件
│   │   ├── albums/              # 相册、图片集合
│   │   ├── links/               # 友链、申请、健康检查
│   │   ├── settings/            # 系统设置、备份、导航、侧边栏组件
│   │   ├── themes/              # 主题安装、切换、配置
│   │   ├── plugins/             # 插件发现、进程管理、插件配置
│   │   ├── notifications/       # 通知、订阅、邮件/Pushoo 投递
│   │   ├── analytics/           # 访问日志、聚合统计、热门页面
│   │   └── music/               # 播放列表、歌曲、歌词
│   ├── platform/                # 技术平台能力，不包含业务规则
│   │   ├── config/              # 配置读取与环境变量映射
│   │   ├── database/            # 数据库连接、事务、手写 SQL/Ent 客户端封装
│   │   ├── http/                # Gin 路由、HTTP 中间件、错误响应
│   │   ├── logger/              # 日志
│   │   ├── storage/             # 本地/OneDrive/OSS/S3/COS/Qiniu 适配
│   │   ├── search/              # 内置搜索与外部搜索插件适配
│   │   └── jobs/                # 定时任务调度器和任务运行器
│   └── shared/                  # 可被多个模块复用的小能力
│       ├── auth/                # JWT、密码、会话工具
│       ├── events/              # 进程内事件与 outbox 事件模型
│       ├── idgen/               # Sqids/Public ID
│       ├── markdown/            # Markdown、HTML 净化、目录提取
│       ├── security/            # 加密、哈希、脱敏
│       └── validate/            # 通用校验器
├── frontend/                    # Next.js App Router 公开前台
│   └── src/
│       ├── app/                 # 路由
│       ├── components/          # 页面组件与 UI 组件
│       ├── lib/                 # 公开 API client、前端工具、mock 数据
│       ├── store/               # Zustand store
│       └── types/               # TypeScript 类型
├── admin/                       # Next.js App Router 独立管理后台
│   └── src/
│       ├── app/admin/           # 后台路由
│       ├── app/login/           # 管理员登录
│       ├── components/admin/    # 后台页面组件
│       └── lib/api/             # 管理 API client 与认证拦截器
├── database/
│   └── postgres/
│       └── schema.sql           # 手动导入的 PostgreSQL 建表 SQL
├── docs/                        # 架构、数据库、开发说明
├── data/                        # 本地运行时数据，不提交业务内容
├── default_files/               # 默认配置模板
└── main.go
```

## 模块内部建议

每个 `internal/modules/<module>/` 后续按需要添加：

```text
<module>/
├── handler.go       # HTTP handler
├── service.go       # 业务编排
├── repository.go    # 仓储接口
├── postgres.go      # PostgreSQL 仓储实现
├── dto.go           # 请求/响应 DTO
└── model.go         # 模块内领域模型
```

简单模块可以只有一个文件；不要为了“标准结构”强行拆文件。

## 数据库约定

- `database/postgres/schema.sql` 只负责建表和索引。
- 不在 Go 启动流程中自动建表或自动迁移。
- 不使用物理外键、触发器、视图、数据库函数。
- 跨表一致性由模块 service/repository 层维护。
