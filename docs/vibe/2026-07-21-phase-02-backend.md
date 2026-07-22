# 阶段 02 文章后端执行记录

> 日期：2026-07-21
> 阶段：文章发布闭环（后端第一批）
> 需求文档：`docs/planning/phases/phase-02-article-publishing.md`

## 目标

在阶段 01 鉴权基线通过后，完成文章发布 API 的后端基础闭环：服务端安全渲染 Markdown，持久化正文派生数据，支持后台按 ID 加载文章，并稳定返回 slug 冲突错误；同时提供前端统一文章 API 接口层。

## 验收标准

- Markdown 保存后生成经过白名单净化的 `content_html`。
- `<script>`、事件属性和 `javascript:` URL 不进入持久化 HTML。
- `word_count` 按 CJK 字符与英文单词统计，`reading_time_minutes` 按每分钟 300 字向下取整且非空正文最小为 1。
- `GET /api/admin/articles/:id` 可读取草稿和已归档文章，非法 ID 返回 400，不存在或软删除返回 404。
- 创建或更新文章发生 slug 冲突时返回 HTTP 409 和统一错误码 `CONFLICT`。
- 前端文章 API 封装覆盖公开列表/详情及后台列表/详情/创建/更新/删除。

## Checklist

- [x] T-02-01 实现 Goldmark + Bluemonday Markdown 渲染器
- [x] T-02-02 创建和更新文章时生成并保存安全 HTML
- [x] T-02-03 计算并保存字数和阅读时间
- [x] T-02-04 新增后台文章详情接口
- [x] T-02-05 将 slug 唯一冲突映射为 409
- [x] 新增前端文章 API 接口层
- [x] 修复 PostgreSQL refresh token 撤销记录缺少 `expires_at` 与退出假成功
- [ ] T-02-06 后台文章列表页面接入
- [ ] T-02-07 编辑器接入真实 API
- [ ] T-02-08 公开文章详情页接入
- [ ] T-02-09 首页文章列表接入
- [ ] PostgreSQL 集成测试与 Docker 全链路验证
