# Changelog

## 2026-07-11

- 前台首页重构为“Moonlit Research Console”：完成暗色实验室设计 Tokens、响应式 Bento/实验档案/错位项目/日志时间线，接入 Motion、Lenis 与仅限 Hero 的 R3F 月牙核心，并提供手机端和 `prefers-reduced-motion` 静态降级。
- 后端完成文章编辑与软删除 API、bcrypt/HS256 JWT 认证核心，以及与 PostgreSQL 字段对齐的 SQLite 用户表和 users Repository；同时修复 PostgreSQL 创建文章取 ID 和列表筛选占位符错误。

## 2026-07-09

- 前台首页根据参考稿调整为浅色 editorial 内容页：重做 Hero 左右排版、公告条、文章区、项目列表、实验记录时间线和页脚。

## 2026-07-07

- 前台首页视觉风格调整为内容优先的现代编辑型 Soft UI：更新全局色彩 token、暗色主题、卡片层级、按钮交互、焦点状态和首页背景纹理。
- 安装并参考 `ui-ux-pro-max` skill，为 CrescentLab 选择中性浅色背景、蓝色 CTA、克制阴影和阅读优先的排版方向。
