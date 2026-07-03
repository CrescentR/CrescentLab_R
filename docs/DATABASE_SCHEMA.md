# CrescentLab 数据库设计

本文档说明 PostgreSQL 首版数据库边界。完整 SQL 不写在 Markdown 中，位于：

- `database/postgres/schema.sql`
- `database/sqlite/schema.sql`（本地开发用，当前覆盖后台设置表）

## 执行方式

数据库由人工创建，SQL 由人工导入，不做自动 migration，不做应用启动时自动建表。

示例：

```bash
createdb crescentlab
psql -d crescentlab -f database/postgres/schema.sql
```

本地 SQLite 示例：

```bash
sqlite3 data/crescentlab.db < database/sqlite/schema.sql
```

## 硬性约束

- 禁止物理外键：所有关系只保留 `*_id` 逻辑字段，由应用层和仓储层校验。
- 禁止触发器：`updated_at` 由应用层写入。
- 禁止数据库函数：不创建业务函数或复杂 SQL 函数。
- 禁止视图：所有读模型由应用层、查询层或后续搜索服务组织。
- 禁止 bootstrap：SQL 文件只建结构，不插入默认用户、权限或配置。
- 禁止自动 migration：后续版本变更使用人工审阅后的独立 SQL 文件执行。

## 解耦设计

| 设计点 | 说明 |
|---|---|
| 逻辑关联 | 使用 `user_id`、`article_id`、`file_id` 等字段表达关系，但不使用数据库外键语法 |
| 删除策略 | 核心业务表保留 `deleted_at`，是否过滤由应用层决定 |
| 状态字段 | 使用 `TEXT + CHECK`，可读、可迁移、便于后续兼容多数据库 |
| 凭据字段 | 使用 `*_ciphertext`、`*_hash` 字段，只允许应用层写入密文或哈希 |
| 搜索 | 表内保留搜索文本/摘要字段，复杂中文搜索后续交给 Meilisearch 或插件 |
| 统计 | 访问日志和聚合表分离，聚合由定时任务写入 |

## 模块覆盖

| 模块 | 表 |
|---|---|
| 用户与权限 | `users`、`user_groups`、`permissions`、`user_group_permissions`、`user_sessions`、`auth_tokens`、`audit_logs` |
| 内容系统 | `articles`、`article_histories`、`post_categories`、`post_tags`、`article_tags`、`pages`、`page_histories`、`doc_series`、`doc_series_articles` |
| 文件与存储 | `storage_policies`、`storage_oauth_accounts`、`files`、`entities`、`file_entities`、`file_metadata`、`upload_sessions`、`upload_chunks`、`direct_links`、`file_thumbnails` |
| 评论 | `comments`、`comment_likes`、`comment_attachments` |
| 相册与友链 | `albums`、`album_items`、`album_categories`、`links`、`link_categories`、`link_tags`、`link_tag_relations`、`link_applications`、`link_health_checks` |
| 设置与配置 | `settings`、`setting_revisions`、`config_backups`、`site_nav_items`、`sidebar_widgets` |
| 主题与插件 | `themes`、`user_installed_themes`、`theme_config_values`、`plugins`、`plugin_settings`、`plugin_events` |
| 通知与订阅 | `notification_types`、`user_notification_configs`、`notifications`、`notification_deliveries`、`subscribers`、`subscriber_deliveries`、`outbound_messages` |
| 音乐、验证码 | `music_playlists`、`music_tracks`、`music_playlist_tracks`、`captcha_challenges` |
| 统计、搜索、SEO | `visitor_logs`、`visitor_stats`、`url_stats`、`search_documents`、`seo_redirects` |
| 任务与事件 | `scheduled_jobs`、`job_runs`、`event_outbox` |

## 后续落地建议

1. Ent Schema 可以按模块逐步落地，但不要让 Ent 自动迁移生产数据库。
2. 所有跨表存在性校验放在 service/repository 层，不依赖数据库外键。
3. 所有后台删除默认走软删除；真正清理文件、日志、任务记录由人工 SQL 或受控任务执行。
4. SQL 变更文件要单独提交、人工 review、手动执行。
