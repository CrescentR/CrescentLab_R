# CrescentLab_R

CrescentLab_R 是一个自托管博客 / CMS 的开发骨架。当前阶段参考了 Figma 原型和 `AGENTS/docs/DEVELOPMENT_PLAN.md`，优先完成前端框架、后台信息架构、基础工具选型和 Go 项目边界；业务接口暂不设计。

## 已完成

- Go 入口与后端目录分层，当前不注册业务 API
- Next.js App Router 前端工程
- 公开首页框架与后台 Admin Shell
- 文章编辑器、用户权限、站点设置三个 Figma 方向页面
- Tailwind CSS 4 设计 token、基础 UI 组件、静态 mock 数据
- README、架构文档、`.gitignore`、`Makefile`

## 技术栈

| 模块 | 选型 |
|---|---|
| 前端 | Next.js 16、React 19、TypeScript |
| 样式 | Tailwind CSS 4、CSS Variables |
| 图标 | lucide-react |
| 状态 | Zustand、TanStack Query |
| 请求 | Axios，接口边界已预留但未设计 |
| 后端 | Go 1.26，后续接 Gin、Ent、Viper |

## 快速开始

```bash
# 后端壳
go run main.go

# 前端
cd frontend
npm install
npm run dev
```

默认前端地址是 `http://localhost:3000`。

## 常用命令

```bash
go test ./...
go fmt ./...
go vet ./...

cd frontend && npm run typecheck
cd frontend && npm run build
```

也可以使用 `Makefile`：

```bash
make run
make frontend-install
make frontend-dev
make frontend-build
```

## 目录结构

```text
.
├── cmd/server/                 # Go 应用 composition root
├── internal/                   # 后端内部应用与基础设施
├── pkg/                        # 领域、服务、工具、handler 边界
├── ent/schema/                 # Ent schema 预留
├── frontend/                   # Next.js 前端
├── docs/ARCHITECTURE.md        # 当前架构说明
├── AGENTS/docs/                # 原始开发计划文档
├── default_files/conf.ini      # 默认配置模板
└── main.go
```

## 当前边界

本阶段只做框架与前端静态页面。`frontend/src/lib/api/` 仅作为未来 API 客户端边界；`pkg/handler/` 和 `internal/infra/router/` 也暂时为空，避免在业务模型未确认前提前锁死接口。
