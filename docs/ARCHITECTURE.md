# CrescentLab Architecture

## 当前阶段

本仓库当前只完成整体框架、前端信息架构、基础工具选型与项目边界。HTTP API、数据库 schema、认证协议、文件上传协议暂不设计。

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
| 后端入口 | Go | 当前仅保留 composition root，不注册业务 API |

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

Go 侧按开发文档预留分层：

- `cmd/server`：应用 composition root
- `internal/app`：启动、任务、监听、中间件
- `internal/infra`：数据库、路由、存储等基础设施
- `pkg/domain`：领域模型和仓储接口
- `pkg/service`：业务逻辑
- `pkg/handler`：HTTP handler，当前为空

## 后续接入顺序

1. 配置系统与日志
2. Gin 路由壳与健康检查
3. Ent schema 与数据库连接工厂
4. 认证与用户系统
5. 文章编辑器接入 Tiptap 与文章 API
