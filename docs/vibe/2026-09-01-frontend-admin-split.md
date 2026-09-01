# 前台与后台项目拆分

## 目标

将公开前台与管理后台拆成两个独立的 Next.js 项目，降低前台暴露面并让后台可以单独部署、单独扩容和单独设置访问策略。Go API 继续作为两者共享的后端服务，并保留 JWT 与管理员权限校验。

## 范围与边界

- `frontend/` 只保留公开页面、公开资源和面向访客的 API 调用。
- `admin/` 承载登录页、后台布局、文章/项目/媒体/存储/评论审核等管理能力，后台路由仍使用 `/admin/*`，但运行在独立项目与端口。
- 前台不再提供 `/login`、`/register`、`/admin/*` 和评论提交界面；前台顶部的后台入口跳转到独立后台地址。
- 两个项目分别通过自己的 Next rewrites 访问 Go API；数据库和业务数据不复制、不迁移。
- Docker Compose 分别构建并运行 `frontend`、`admin`、`backend`，宿主机仅暴露前台与后台端口，后端端口保持容器网络内可达。

## 验收 checklist

- [x] `frontend/` 与 `admin/` 各自拥有独立的 `package.json`、锁文件、Next 配置和 TypeScript 配置。
- [x] 后台页面与后台组件已从前台源码移出，前台不再包含后台登录、注册和评论提交入口。
- [x] 前台“后台登录”跳转到 `NEXT_PUBLIC_ADMIN_URL`，后台“返回前台”跳转到 `NEXT_PUBLIC_PUBLIC_SITE_URL`。
- [x] 前台默认运行在 3000，后台默认运行在 3001，Go API 不直接映射宿主机端口。
- [x] 两个项目分别通过 typecheck、production build 与定向 lint。
- [x] 路由检查确认前台 `/admin`、`/login` 返回 404，后台 `/login` 与 `/admin` 可访问，未登录后台由客户端鉴权送回后台登录页。
