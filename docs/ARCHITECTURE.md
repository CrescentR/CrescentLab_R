# CrescentLab Architecture

## 当前阶段

本仓库当前已完成整体框架、前端信息架构、基础工具选型、项目边界和 PostgreSQL 首版数据库设计。HTTP API、认证协议、文件上传协议暂不设计。

## 技术选型

| 层级 | 选型 | 说明 |
|---|---|---|
| 前端框架 | Next.js App Router | 文档要求 Next.js 15+；当前脚手架使用 Next.js 16，仍满足 15+ 约束 |
| UI 运行时 | React 19 + TypeScript | 强类型组件与 Server/Client Component 分层 |
| 样式 | Tailwind CSS 4 + CSS Variables | Figma 原型的暗色、玻璃态、等宽标签、紫/青色强调全部沉淀为 token |
| 图标 | lucide-react | 统一后台操作图标 |
| 客户端状态 | Zustand | 侧栏、弹窗、局部 UI 状态 |
| 服务端状态 | TanStack Query | 后续 API 接入后的缓存、重试、失效控制 |
| HTTP 客户端 | Axios | 后续集中拦截器、认证刷新、错误归一化 |
| 后端入口 | Go | 当前仅保留服务入口组装，不注册业务 API |
| 数据库 | PostgreSQL | 手动创建数据库并导入 `database/postgres/schema.sql`，不做自动 migration |

## Figma 转译原则

原型包含三类关键后台界面：

- 文章编辑器：顶部发布栏、左侧元数据抽屉、中心编辑画布、悬浮工具栏
- 用户权限：固定侧栏、顶部搜索/标签、用户表格、角色矩阵
- 站点设置：侧栏导航、设置页标题区、分组表单、保存/撤销操作

落地时保留这些结构，但不逐字复制 Figma 生成代码。所有视觉都通过 `frontend/src/app/globals.css` 中的 token 和本地组件实现，避免被临时 Figma asset URL 绑定。

## 前端目录

```text
frontend/src/
├── app/                 # Next.js 路由
│   ├── admin/           # 管理后台
│   ├── layout.tsx       # 根布局和 Provider
│   └── page.tsx         # 公开博客首页框架
├── components/
│   ├── admin/           # 后台壳、编辑器、用户、设置等页面组件
│   ├── layout/          # 公开页布局组件
│   └── ui/              # Button、Panel、Badge、Field 等基础组件
├── lib/
│   ├── api/             # API 客户端边界，暂不设计接口
│   ├── mock-data.ts     # 静态演示数据
│   └── utils.ts
├── store/               # Zustand store
└── types/               # 前端类型
```

## 后端目录

Go 侧采用更直观的模块化目录：

- `cmd/server`：服务入口组装
- `internal/modules`：业务模块，如 users、content、media、comments、settings
- `internal/platform`：技术平台能力，如 database、http、logger、storage、search、jobs
- `internal/shared`：跨模块共享能力，如 auth、events、idgen、markdown、security、validate
- `database/postgres/schema.sql`：手动导入的 PostgreSQL 建表 SQL

完整说明见 `docs/PROJECT_STRUCTURE.md`。

## 数据库边界

- 不使用物理外键，跨表关系由 `*_id` 逻辑字段表达。
- 不使用触发器、数据库函数、视图。
- 不写 bootstrap 数据。
- 不做启动时自动迁移；数据库由人工创建和导入 SQL。

## 后续接入顺序

1. 配置系统与日志
2. Gin 路由壳与健康检查
3. 基于 `database/postgres/schema.sql` 落数据库访问层，迁移 SQL 仍保持人工执行
4. 认证与用户系统
5. 文章编辑器接入 Tiptap 与文章 API
