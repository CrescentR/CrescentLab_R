# API Boundary

本目录存放前端 API 客户端边界。

当前已接入：

- `settings.ts`：后台设置读取与批量保存，路径为 `/api/admin/settings`。

后续模块按后台页面拆分为 `auth.ts`、`articles.ts`、`media.ts`、`users.ts` 等文件，再统一接入认证、错误归一化与缓存策略。
