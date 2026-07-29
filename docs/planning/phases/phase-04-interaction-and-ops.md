# 第 04 期：互动与生产运维

> 路线图基线：`docs/planning/02-roadmap.md` 阶段 04
> 前置阶段：阶段 03 完成（媒体、分类标签、品牌设置可用）
> 前置决策：见 `05-decisions-and-open-questions.md` 中 Q-014 ~ Q-018

---

## 1. 阶段概述

### 1.1 本期解决什么问题

1. 文章详情页没有评论区，访客无法互动。
2. 没有真实用户管理，后台用户页是静态原型。
3. 没有审计日志，管理操作不可追溯。
4. 没有备份、恢复、监控和告警，无法声明生产就绪。
5. 没有发布和回滚流程，更新有风险。

### 1.2 为什么安排在这一期

核心内容流（写作→发布→阅读）和内容组织（媒体、分类、品牌）已在阶段 02/03 完成。本期让项目具备互动治理和生产运维能力，达到"可长期自托管运营"的状态。

### 1.3 本期完成后的产品状态

- 访客可在文章详情页发表评论，管理员可审核。
- 管理员可管理用户和权限。
- 登录、发布、删除、设置变更等关键操作有审计记录。
- PostgreSQL 可备份和恢复到隔离环境。
- 发布可回滚；关键故障触发告警。
- 项目有正式使用文档。

### 1.4 本期对整个项目的价值

完成本期后，项目从"可用版本"升级为"正式产品"。具备运营、恢复和可观测能力，可以安全地面向公网部署。

---

## 2. 阶段目标

| 编号 | 目标 | 可验收条件 |
| --- | --- | --- |
| G-04-01 | 评论提交和展示可用 | 访客可发表评论；公开展示只含 approved 评论 |
| G-04-02 | 评论审核可用 | 管理员可查看待审/通过/拒绝评论；操作受权限保护 |
| G-04-03 | 用户管理最小集可用 | 管理员可查看用户列表、禁用/启用用户 |
| G-04-04 | 审计日志可用 | 关键操作有审计记录；管理员可查看 |
| G-04-05 | 备份恢复可用 | PostgreSQL 可备份并恢复到隔离环境 |
| G-04-06 | 监控告警可用 | 健康检查异常触发告警 |
| G-04-07 | 发布回滚可用 | 发布失败可回滚到上一版本 |
| G-04-08 | 安全回归通过 | 密钥无默认值；日志脱敏；限流通过 |

---

## 3. 用户角色

| 角色 | 本期参与方式 |
| --- | --- |
| 站点管理员 | 审核评论、管理用户、查看审计、执行备份 |
| 访客 | 发表评论 |
| 运维人员 | 执行备份恢复、监控告警、发布回滚 |

---

## 4. 功能范围

| 模块 | 功能 |
| --- | --- |
| 评论 | 提交、展示、审核（通过/拒绝/删除） |
| 用户管理 | 用户列表、禁用/启用、重置密码 |
| 审计日志 | 记录关键操作、查看审计列表 |
| 备份恢复 | PostgreSQL 备份脚本、恢复验证 |
| 监控告警 | 健康检查告警、日志级别管理 |
| 发布回滚 | Docker 镜像版本标签、回滚步骤 |
| 安全加固 | 密钥环境变量化、日志脱敏、限流 |
| 文档 | 正式使用文档、部署指南 |

---

## 5. 详细功能需求

### 5.1 评论提交

#### 5.1.1 功能目的

让访客在文章详情页发表评论，与内容互动。

#### 5.1.2 使用角色

访客（**待确认** Q-014：是否要求登录才能评论）。

#### 5.1.3 功能入口

- 前端：文章详情页 `/posts/[slug]` 底部评论区
- HTTP 接口：`POST /api/public/comments`

#### 5.1.4 页面展示内容

评论区：

| 区域 | 内容 |
| --- | --- |
| 评论表单 | 昵称输入框、邮箱输入框（可选）、内容输入框、提交按钮 |
| 评论列表 | 头像、昵称、时间、内容、回复按钮 |
| 空状态 | "还没有评论，来发表第一条吧" |
| 加载状态 | Loading 指示器 |

#### 5.1.5 操作流程

1. 访客在文章详情页底部填写评论。
2. 前端发送 `POST /api/public/comments`，body：`{article_slug, nickname, email, content}`。
3. 后端校验文章存在且 `allow_comment = true`。
4. 后端创建评论，状态为 `pending`（待审核）。
5. 返回评论信息（含状态）。
6. 前端显示"评论已提交，等待审核"。

#### 5.1.6 业务规则

- 评论必须关联已发布的文章。
- 昵称非空，1~30 字符。
- 内容非空，1~1000 字符。
- 邮箱可选，如填写需为有效格式。
- 新评论默认状态为 `pending`。
- 如果文章 `allow_comment = false`，返回 403。
- 评论频率限制：同一 IP 每分钟最多 3 条（**建议**）。
- 不支持嵌套回复（本期只做一级评论，**待确认** Q-015）。
- 不支持评论图片上传（本期不实现）。

#### 5.1.7 状态设计

| 状态 | 含义 | 进入条件 | 可执行操作 | 下一状态 |
| --- | --- | --- | --- | --- |
| pending | 待审核 | 新提交 | 管理员审核 | approved / rejected |
| approved | 已通过 | 管理员通过 | 公开展示、删除 | deleted |
| rejected | 已拒绝 | 管理员拒绝 | 不公开展示、删除 | deleted |
| deleted | 已删除 | 管理员删除 | 不展示 | — |

#### 5.1.8 数据要求

需要在 SQLite 中补建 `comments` 表（PostgreSQL 已有）：

| 字段 | 含义 | 类型 | 必填 | 默认值 |
| --- | --- | --- | --- | --- |
| id | 主键 | INTEGER/BIGINT | 是 | 自增 |
| article_id | 文章 ID | INTEGER/BIGINT | 是 | — |
| parent_id | 父评论 ID | INTEGER/BIGINT | 否 | NULL |
| nickname | 昵称 | TEXT | 是 | — |
| email | 邮箱 | TEXT | 否 | NULL |
| content | 评论内容 | TEXT | 是 | — |
| status | 状态 | TEXT | 是 | "pending" |
| ip | IP 地址 | TEXT | 否 | NULL |
| user_agent | User-Agent | TEXT | 否 | NULL |
| created_at | 创建时间 | DATETIME | 是 | CURRENT_TIMESTAMP |
| updated_at | 更新时间 | DATETIME | 是 | CURRENT_TIMESTAMP |
| deleted_at | 软删除 | DATETIME | 否 | NULL |

#### 5.1.9 权限要求

- 提交评论：公开（不需要认证）。
- 邮箱字段不公开展示。

#### 5.1.10 异常情况

| 场景 | 前端处理 | 后端处理 |
| --- | --- | --- |
| 文章不存在 | 显示"文章不存在" | 返回 404 |
| 文章禁止评论 | 显示"本文已关闭评论" | 返回 403 |
| 昵称为空 | 前端校验拦截 | 返回 400 |
| 内容超长 | 前端校验拦截 | 返回 400 |
| 频率过高 | 显示"请稍后再试" | 返回 429 |

#### 5.1.11 验收标准

- Given 已发布文章且 allow_comment=true，When 访客提交评论，Then 评论创建且状态为 pending。
- Given allow_comment=false 的文章，When 提交评论，Then 返回 403。
- Given 昵称为空，When 提交，Then 前端校验拦截。
- Given 内容超过 1000 字符，When 提交，Then 返回 400。
- Given 提交成功，When 查看文章详情页，Then 显示"评论已提交，等待审核"。

---

### 5.2 评论展示

#### 5.2.1 功能目的

在文章详情页展示已通过的评论。

#### 5.2.2 使用角色

访客。

#### 5.2.3 功能入口

- 前端：文章详情页评论区
- HTTP 接口：`GET /api/public/comments?article_slug=<slug>`

#### 5.2.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 评论列表 | 昵称、时间、内容 |
| 排序 | 按时间倒序（最新在前） |
| 空状态 | "还没有评论" |

#### 5.2.5 操作流程

1. 文章详情页加载时调用 `GET /api/public/comments?article_slug=<slug>`。
2. 后端返回 `status = approved` 且未删除的评论。
3. 前端渲染评论列表。

#### 5.2.6 业务规则

- 只返回 `approved` 状态的评论。
- 不返回邮箱地址。
- 按 `created_at DESC` 排序。
- 分页：默认 page=1, page_size=20。

#### 5.2.7 状态设计

无前端状态。

#### 5.2.8 数据要求

使用 `comments` 表。

#### 5.2.9 权限要求

- 公开访问。

#### 5.2.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 无评论 | 返回空数组 |
| 文章不存在 | 返回空数组（不泄露文章状态） |

#### 5.2.11 验收标准

- Given 有 3 条 approved 评论，When 加载详情页，Then 展示 3 条评论。
- Given 有 1 条 pending 和 1 条 approved，When 加载详情页，Then 只展示 1 条 approved。
- Given 评论列表，When 检查响应，Then 不包含邮箱字段。

---

### 5.3 评论审核

#### 5.3.1 功能目的

让管理员审核待处理的评论，决定通过或拒绝。

#### 5.3.2 使用角色

站点管理员。

#### 5.3.3 功能入口

- 前端页面：`/admin/comments`（从占位页改为真实页面）
- HTTP 接口：`GET /api/admin/comments`、`PUT /api/admin/comments/:id/status`、`DELETE /api/admin/comments/:id`

#### 5.3.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 页面标题 | "评论管理" |
| 筛选 | 状态下拉（全部/待审/已通过/已拒绝） |
| 评论列表 | 文章标题、昵称、内容摘要、状态、时间、操作 |
| 操作 | 通过、拒绝、删除 |

#### 5.3.5 操作流程

1. 管理员进入 `/admin/comments`。
2. 前端调用 `GET /api/admin/comments?status=pending`。
3. 管理员查看待审评论。
4. 点击"通过"：发送 `PUT /api/admin/comments/:id/status`，status=approved。
5. 点击"拒绝"：发送 `PUT /api/admin/comments/:id/status`，status=rejected。
6. 点击"删除"：发送 `DELETE /api/admin/comments/:id`，软删除。

#### 5.3.6 业务规则

- 审核操作记录审计日志。
- 通过后评论立即在公开端展示。
- 拒绝后评论不在公开端展示。
- 删除是软删除。
- 管理员可修改已通过/已拒绝评论的状态（如从拒绝改为通过）。

#### 5.3.7 状态设计

见 5.1.7。状态流转：

```
pending → approved (通过)
pending → rejected (拒绝)
approved → rejected (改为拒绝)
rejected → approved (改为通过)
任意 → deleted (删除)
```

#### 5.3.8 数据要求

使用 `comments` 表。审核操作更新 `status` 和 `updated_at`。

#### 5.3.9 权限要求

- 全部评论管理操作：需认证 + 管理员。

#### 5.3.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 评论不存在 | 返回 404 |
| 已删除的评论 | 返回 404 |
| 状态值无效 | 返回 400 |

#### 5.3.11 验收标准

- Given 有待审评论，When 管理员点击"通过"，Then 评论状态变为 approved 且公开端展示。
- Given 有待审评论，When 管理员点击"拒绝"，Then 评论状态变为 rejected 且公开端不展示。
- Given 已通过的评论，When 管理员删除，Then 评论从公开端消失。
- Given 审核操作，When 检查审计日志，Then 有对应记录。

---

### 5.4 用户管理

#### 5.4.1 功能目的

让管理员查看用户列表，禁用或启用用户，重置密码。替换当前静态的 `/admin/users` 原型。

#### 5.4.2 使用角色

站点管理员。

#### 5.4.3 功能入口

- 前端页面：`/admin/users`（从占位页改为真实页面）
- HTTP 接口：`GET /api/admin/users`、`PUT /api/admin/users/:id/status`、`POST /api/admin/users/:id/reset-password`

#### 5.4.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 页面标题 | "用户管理" |
| 用户列表 | 用户名、昵称、状态、最后登录、操作 |
| 操作 | 禁用/启用、重置密码 |

#### 5.4.5 操作流程

1. 管理员进入 `/admin/users`。
2. 前端调用 `GET /api/admin/users`。
3. 管理员查看用户列表。
4. 点击"禁用"：发送 `PUT /api/admin/users/:id/status`，status=disabled。
5. 点击"重置密码"：弹出输入新密码的弹窗，确认后发送 `POST /api/admin/users/:id/reset-password`。

#### 5.4.6 业务规则

- 管理员不能禁用自己。
- 管理员不能禁用 `is_system = true` 的系统用户。
- 禁用后用户不可登录。
- 启用后用户可登录。
- 重置密码需要新密码满足长度要求（≥ 8 字符）。
- 重置密码后用户的所有 refresh token 失效（**建议**，本期可不实现 token 失效，Q-016）。
- 本期不实现用户创建（由初始化命令创建管理员）。
- 本期不实现用户组管理（**待确认** Q-017）。

#### 5.4.7 状态设计

| 状态 | 含义 | 可登录 |
| --- | --- | --- |
| active | 正常 | 是 |
| disabled | 被禁用 | 否 |
| pending | 待激活 | 否 |

#### 5.4.8 数据要求

使用 `users` 表。无新增字段。

#### 5.4.9 权限要求

- 全部用户管理操作：需认证 + 管理员。

#### 5.4.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 禁用自己 | 返回 400 |
| 禁用系统用户 | 返回 403 |
| 用户不存在 | 返回 404 |
| 密码不满足要求 | 返回 400 |

#### 5.4.11 验收标准

- Given 用户列表，When 管理员禁用某用户，Then 该用户状态变为 disabled 且不可登录。
- Given 管理员自己，When 尝试禁用自己，Then 返回 400。
- Given 被禁用用户，When 尝试登录，Then 返回 403。
- Given 管理员重置密码，When 被重置用户用新密码登录，Then 登录成功。

---

### 5.5 审计日志

#### 5.5.1 功能目的

记录关键管理操作，让管理员可追溯谁在什么时间做了什么。

#### 5.5.2 使用角色

站点管理员（查看），系统（记录）。

#### 5.5.3 功能入口

- 前端页面：`/admin/audit-logs`（新增）或在仪表盘中展示最近操作
- HTTP 接口：`GET /api/admin/audit-logs`

#### 5.5.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 页面标题 | "审计日志" |
| 日志列表 | 时间、操作者、操作类型、目标、详情 |
| 筛选 | 按操作类型筛选 |
| 分页 | 分页导航 |

#### 5.5.5 操作流程

1. 管理操作（登录、发布、删除、设置变更、评论审核、用户禁用）触发审计记录。
2. 系统在 `audit_logs` 表中写入记录。
3. 管理员在审计日志页查看。

#### 5.5.6 业务规则

- 审计记录不可修改和删除。
- 记录字段：时间、user_id、username、action、target_type、target_id、ip、user_agent、detail（JSON）。
- 审计操作类型：login、logout、article_create、article_update、article_delete、article_publish、article_archive、comment_approve、comment_reject、comment_delete、user_disable、user_enable、user_reset_password、settings_update。
- detail 字段记录关键变更（如 article_delete 记录文章标题）。
- 审计日志保留 90 天（**建议**，本期不实现自动清理）。

#### 5.5.7 状态设计

无状态。审计记录是只追加的。

#### 5.5.8 数据要求

需要在 SQLite 中补建 `audit_logs` 表（PostgreSQL 已有）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INTEGER/BIGINT | 主键 |
| user_id | INTEGER/BIGINT | 操作者 ID |
| username | TEXT | 操作者用户名 |
| action | TEXT | 操作类型 |
| target_type | TEXT | 目标类型（article/comment/user/setting） |
| target_id | INTEGER/BIGINT | 目标 ID |
| ip | TEXT | IP 地址 |
| user_agent | TEXT | UA |
| detail | TEXT | JSON 详情 |
| created_at | DATETIME | 时间 |

#### 5.5.9 权限要求

- 查看审计日志：需认证 + 管理员。

#### 5.5.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 审计写入失败 | 不阻塞主操作，日志记录失败 |
| 审计查询为空 | 返回空列表 |

#### 5.5.11 验收标准

- Given 管理员发布文章，When 检查审计日志，Then 有 article_publish 记录。
- Given 管理员删除评论，When 检查审计日志，Then 有 comment_delete 记录。
- Given 审计日志页，When 按操作类型筛选，Then 只显示匹配的记录。

---

### 5.6 备份与恢复

#### 5.6.1 功能目的

让 PostgreSQL 数据库可备份和恢复，确保数据可恢复。

#### 5.6.2 使用角色

运维人员、管理员。

#### 5.6.3 功能入口

- 脚本：`scripts/backup.sh`、`scripts/restore.sh`
- 文档：`docs/deploy/backup-and-restore.md`

#### 5.6.4 页面展示内容

无页面，通过命令行操作。

#### 5.6.5 操作流程

**备份：**

1. 执行 `scripts/backup.sh`。
2. 脚本使用 `pg_dump` 导出数据库到 `data/backup/crescentlab_YYYYMMDD_HHMMSS.sql`。
3. 脚本清理 7 天前的备份文件。

**恢复：**

1. 执行 `scripts/restore.sh <backup_file>`。
2. 脚本提示确认。
3. 脚本使用 `psql` 导入备份文件到指定数据库。
4. 恢复完成后输出提示。

#### 5.6.6 业务规则

- 备份文件存储在 `data/backup/` 目录。
- 备份文件名包含时间戳。
- 自动清理 7 天前的备份（可配置）。
- 恢复前需要确认。
- 恢复到隔离环境验证，不在生产环境直接恢复。

#### 5.6.7 状态设计

| 状态 | 含义 |
| --- | --- |
| idle | 空闲 |
| backing_up | 正在备份 |
| restoring | 正在恢复 |
| failed | 失败 |

#### 5.6.8 数据要求

无新增数据表。备份文件是 SQL 导出。

#### 5.6.9 权限要求

- 备份和恢复脚本在服务器本地执行，需要数据库凭据。
- 不通过 HTTP 接口暴露（本期不实现后台触发备份）。

#### 5.6.10 异常情况

| 场景 | 处理 |
| --- | --- |
| pg_dump 失败 | 脚本返回非零退出码，输出错误 |
| 磁盘空间不足 | 脚本检查空间，不足时中止 |
| 恢复文件不存在 | 脚本输出错误 |

#### 5.6.11 验收标准

- Given 运行中的 PostgreSQL，When 执行备份脚本，Then `data/backup/` 出现 SQL 文件。
- Given 备份文件，When 在隔离环境执行恢复脚本，Then 数据库恢复到备份时状态。
- Given 8 天前的备份文件，When 执行备份脚本，Then 旧文件被清理。

---

### 5.7 监控与告警

#### 5.7.1 功能目的

让健康检查异常触发告警，确保运维能及时发现问题。

#### 5.7.2 使用角色

运维人员。

#### 5.7.3 功能入口

- 配置：`default_files/conf.ini` 增加 `[monitor]` 段
- 脚本：`scripts/health-check.sh`（用于 cron 或外部监控）

#### 5.7.4 页面展示内容

无页面。告警通过日志和外部监控工具实现。

#### 5.7.5 操作流程

1. 外部监控工具或 cron 定期调用 `GET /healthz/ready`。
2. 如果返回非 200，触发告警（邮件、webhook 等）。
3. 后端在日志中记录健康检查异常。

#### 5.7.6 业务规则

- 健康检查异常连续 3 次后触发告警（由外部监控实现）。
- 后端日志区分 ERROR 和 WARN 级别。
- 日志不输出敏感信息（密码、token、密钥）。
- **建议**：后端支持通过环境变量配置日志级别（debug/info/warn/error）。

#### 5.7.7 状态设计

| 状态 | 含义 |
| --- | --- |
| healthy | 健康 |
| degraded | 降级（部分检查失败） |
| unhealthy | 不可用 |

#### 5.7.8 数据要求

无新增数据。

#### 5.7.9 权限要求

- `GET /healthz/ready`：公开。
- 日志文件：仅运维可访问。

#### 5.7.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 健康检查端点不可达 | 外部监控触发告警 |
| 日志写入失败 | 输出到 stderr |

#### 5.7.11 验收标准

- Given 数据库不可达，When 调用 `/healthz/ready`，Then 返回 503。
- Given 后端日志，When 检查内容，Then 不包含密码或 token 明文。
- Given 环境变量 `LOG_LEVEL=error`，When 后端运行，Then 只输出 ERROR 级别日志。

---

### 5.8 发布与回滚

#### 5.8.1 功能目的

建立可追溯的发布流程，支持回滚到上一版本。

#### 5.8.2 使用角色

运维人员、开发者。

#### 5.8.3 功能入口

- 脚本：`scripts/deploy.sh`、`scripts/rollback.sh`
- 文档：`docs/deploy/release-and-rollback.md`

#### 5.8.4 页面展示内容

无页面。

#### 5.8.5 操作流程

**发布：**

1. 开发者合并 PR 到 main。
2. CI 构建并通过测试。
3. 执行 `scripts/deploy.sh <version>`。
4. 脚本构建 Docker 镜像并打版本标签（如 `crescentlab:v1.2.0`）。
5. 脚本更新 Docker Compose 配置。
6. 脚本执行 `docker compose up -d`。
7. 脚本等待健康检查通过。
8. 发布完成。

**回滚：**

1. 执行 `scripts/rollback.sh`。
2. 脚本回退到上一版本标签。
3. 脚本执行 `docker compose up -d`。
4. 脚本等待健康检查通过。
5. 回滚完成。

#### 5.8.6 业务规则

- Docker 镜像标签包含版本号（语义化版本）。
- 发布脚本在健康检查失败时自动回滚。
- 回滚脚本保留当前失败版本用于排查。
- 数据库 schema 变更不自动回滚（需人工审阅）。

#### 5.8.7 状态设计

| 状态 | 含义 |
| --- | --- |
| deploying | 正在部署 |
| healthy | 部署成功且健康 |
| failed | 部署失败 |
| rolling_back | 正在回滚 |
| rolled_back | 已回滚 |

#### 5.8.8 数据要求

无新增数据。

#### 5.8.9 权限要求

- 发布和回滚脚本在服务器本地执行。

#### 5.8.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 健康检查失败 | 自动回滚 |
| Docker 镜像拉取失败 | 中止部署 |
| 数据库不可达 | 中止部署 |

#### 5.8.11 验收标准

- Given 新版本镜像，When 执行部署脚本，Then 新版本启动且健康检查通过。
- Given 部署后健康检查失败，When 脚本检测到，Then 自动回滚到上一版本。
- Given 回滚脚本，When 执行，Then 回到上一版本且健康检查通过。

---

### 5.9 安全加固

#### 5.9.1 功能目的

消除生产环境安全风险，确保密钥无默认值、日志脱敏、接口限流。

#### 5.9.2 使用角色

运维人员、开发者。

#### 5.9.3 功能入口

- 配置：`default_files/conf.ini`、环境变量
- 代码：`internal/platform/http/middleware/ratelimit.go`（新增）

#### 5.9.4 页面展示内容

无页面。

#### 5.9.5 操作流程

1. 将 JWT secret、数据库密码等敏感配置从 INI 文件改为环境变量注入。
2. 配置系统支持环境变量覆盖（`CRESCENTLAB_JWT_SECRET`、`CRESCENTLAB_DATABASE_DSN` 等）。
3. 生产环境配置不包含默认密码。
4. 日志中间件对 Authorization header、password 字段进行脱敏。
5. 实现基础限流中间件：全局 100 req/s，登录接口 10 req/min/IP。
6. Docker Compose 生产配置不使用默认凭据。

#### 5.9.6 业务规则

- 生产环境启动时检查必需的环境变量（JWT_SECRET、DATABASE_DSN），缺失则拒绝启动。
- 开发环境可使用默认值（本地 SQLite、随机 JWT secret）。
- 日志中 `password`、`token`、`secret` 字段值替换为 `***`。
- 限流使用内存计数器（本期不引入 Redis）。

#### 5.9.7 状态设计

无。

#### 5.9.8 数据要求

无新增数据。

#### 5.9.9 权限要求

无。

#### 5.9.10 异常情况

| 场景 | 处理 |
| --- | --- |
| 生产环境缺少 JWT_SECRET | 启动失败，输出明确错误 |
| 限流触发 | 返回 429 |

#### 5.9.11 验收标准

- Given 生产环境（`APP_ENV=production`），When 启动时缺少 `JWT_SECRET`，Then 启动失败。
- Given 日志输出，When 检查内容，Then 不包含密码或 token 明文。
- Given 同一 IP 1 分钟内发送 11 次登录请求，When 第 11 次，Then 返回 429。
- Given Docker Compose 生产配置，When 检查环境变量，Then 不包含硬编码密码。

---

### 5.10 正式文档

#### 5.10.1 功能目的

提供完整的部署和使用文档，让新运维和管理员能独立操作。

#### 5.10.2 使用角色

运维人员、管理员、新开发者。

#### 5.10.3 功能入口

- `README.md`（更新）
- `docs/deploy/deployment-guide.md`（新增）
- `docs/deploy/backup-and-restore.md`（新增）
- `docs/deploy/release-and-rollback.md`（新增）
- `docs/develop-guides/changelog.md`（更新）

#### 5.10.4 页面展示内容

文档内容。

#### 5.10.5 操作流程

1. 更新 README 反映完整功能。
2. 编写部署指南：环境要求、配置、启动、验证。
3. 编写备份恢复文档。
4. 编写发布回滚文档。
5. 更新 changelog 记录本期变更。

#### 5.10.6 业务规则

- 文档中的命令必须可在干净环境执行。
- 敏感值不写入文档。

#### 5.10.7 状态设计

无。

#### 5.10.8 数据要求

无。

#### 5.10.9 权限要求

无。

#### 5.10.10 异常情况

无。

#### 5.10.11 验收标准

- Given 新运维人员，When 阅读部署指南，Then 能独立完成部署。
- Given 需要恢复数据，When 阅读备份恢复文档，Then 能完成恢复操作。

---

## 6. 页面和交互清单

| 操作 | 页面/组件 | 入口 | 用途 |
| --- | --- | --- | --- |
| 修改 | `/posts/[slug]` | 文章详情 | 增加评论区 |
| 修改 | `/admin/comments` | 后台侧栏"评论" | 从占位页改为评论管理 |
| 修改 | `/admin/users` | 后台侧栏"用户" | 从占位页改为用户管理 |
| 新增 | `/admin/audit-logs` | 后台新增导航 | 审计日志 |

---

## 7. 接口能力清单

| 接口 | 用途 | 调用方 | 权限 | 现有状态 |
| --- | --- | --- | --- | --- |
| `POST /api/public/comments` | 提交评论 | 详情页 | 公开 | 新增 |
| `GET /api/public/comments` | 公开评论列表 | 详情页 | 公开 | 新增 |
| `GET /api/admin/comments` | 后台评论列表 | 评论管理 | 需认证+管理员 | 新增 |
| `PUT /api/admin/comments/:id/status` | 审核评论 | 评论管理 | 需认证+管理员 | 新增 |
| `DELETE /api/admin/comments/:id` | 删除评论 | 评论管理 | 需认证+管理员 | 新增 |
| `GET /api/admin/users` | 用户列表 | 用户管理 | 需认证+管理员 | 新增 |
| `PUT /api/admin/users/:id/status` | 禁用/启用用户 | 用户管理 | 需认证+管理员 | 新增 |
| `POST /api/admin/users/:id/reset-password` | 重置密码 | 用户管理 | 需认证+管理员 | 新增 |
| `GET /api/admin/audit-logs` | 审计日志 | 审计页 | 需认证+管理员 | 新增 |

---

## 8. 数据能力清单

| 操作 | 实体/表 | 说明 |
| --- | --- | --- |
| 补建 | `comments`（SQLite） | SQLite 需补建评论表 |
| 补建 | `audit_logs`（SQLite） | SQLite 需补建审计日志表 |
| 无变化 | `users` | 现有表已满足 |
| 无变化 | `articles` | 现有表已满足 |

需提供 SQLite 的增量 schema 文件。

---

## 9. 非功能需求

| 维度 | 要求 |
| --- | --- |
| 性能 | 评论提交 p99 < 200ms；评论列表 p99 < 100ms |
| 安全 | 评论内容 HTML 净化；限流；日志脱敏；密钥环境变量化 |
| 可用性 | 评论表单有空状态和错误状态；审核有确认操作 |
| 响应速度 | 审计日志写入不阻塞主操作（异步或快速写入） |
| 浏览器兼容 | Chrome 120+、Firefox 120+、Safari 17+ |
| 数据一致性 | 评论状态在 SQLite 和 PostgreSQL 中一致 |
| 日志 | 审计操作写审计日志；评论提交/审核写日志 |
| 异常追踪 | panic 记录完整堆栈 |
| 可维护性 | 审计中间件与业务 handler 解耦 |
| 测试要求 | 评论提交/审核测试；用户管理测试；安全回归测试；备份恢复演练 |

---

## 10. 开发任务拆分

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-04-01 | 补建 SQLite 评论和审计表 | comments, audit_logs | database/sqlite | — | schema.sql 追加 | 表创建成功 | P1 | 是 |
| T-04-02 | 实现评论提交和列表 | POST/GET /api/public/comments | modules/comments(新增) | T-04-01 | handler.go, repository.go | 评论可提交和展示 | P1 | 否 |
| T-04-03 | 实现评论审核 | GET/PUT/DELETE /api/admin/comments | modules/comments | T-04-02 | handler.go | 审核可用 | P1 | 否 |
| T-04-04 | 详情页增加评论区 | /posts/[slug] | frontend | T-04-02 | page.tsx | 可提交和查看评论 | P1 | 是 |
| T-04-05 | 创建评论管理页面 | /admin/comments | frontend | T-04-03 | page.tsx | 审核可用 | P1 | 是 |
| T-04-06 | 实现用户列表 | GET /api/admin/users | modules/users | — | handler.go | 列表可用 | P1 | 是 |
| T-04-07 | 实现用户禁用/启用和重置密码 | PUT/POST /api/admin/users/:id | modules/users | T-04-06 | handler.go | 操作可用 | P1 | 否 |
| T-04-08 | 创建用户管理页面 | /admin/users | frontend | T-04-07 | page.tsx | 管理可用 | P1 | 是 |
| T-04-09 | 实现审计日志中间件 | 记录关键操作 | platform/http, shared | T-04-01 | middleware/audit.go | 操作被记录 | P2 | 是 |
| T-04-10 | 创建审计日志页面 | /admin/audit-logs | frontend | T-04-09 | page.tsx | 可查看日志 | P2 | 是 |
| T-04-11 | 编写备份恢复脚本 | backup.sh, restore.sh | scripts | — | scripts/ | 备份可恢复 | P2 | 是 |
| T-04-12 | 实现日志脱敏 | 过滤敏感字段 | platform/http, logger | — | logger.go 修改 | 日志无明文密码 | P2 | 是 |
| T-04-13 | 实现限流中间件 | 全局和登录限流 | platform/http | — | middleware/ratelimit.go | 限流生效 | P2 | 是 |
| T-04-14 | 环境变量化配置 | JWT_SECRET 等 | platform/config | — | config.go 修改 | 生产检查必需变量 | P2 | 是 |
| T-04-15 | 编写发布回滚脚本 | deploy.sh, rollback.sh | scripts | — | scripts/ | 发布可回滚 | P2 | 是 |
| T-04-16 | 编写正式文档 | 部署/备份/回滚指南 | docs | T-04-11, T-04-15 | docs/ | 文档完整 | P2 | 是 |
| T-04-17 | 安全回归测试 | 限流/脱敏/密钥 | test | T-04-13, T-04-14 | test | 测试通过 | P2 | 否 |
| T-04-18 | 备份恢复演练 | 验证恢复 | test | T-04-11 | 演练记录 | 恢复成功 | P2 | 否 |

---

## 11. 推荐开发顺序

```
1. T-04-01 补建 SQLite 表  → 验证：表创建成功
2. T-04-02 评论提交/列表 + T-04-03 评论审核  → 验证：评论后端可用
3. T-04-04 评论区 + T-04-05 评论管理页  → 验证：评论前端可用
4. T-04-06 用户列表 + T-04-07 禁用/重置  → 验证：用户管理可用
5. T-04-08 用户管理页  → 验证：用户前端可用
6. T-04-09 审计中间件 + T-04-10 审计页  → 验证：审计可用
7. T-04-12 日志脱敏 + T-04-13 限流 + T-04-14 环境变量  → 验证：安全加固
8. T-04-11 备份恢复 + T-04-15 发布回滚  → 验证：运维可用
9. T-04-16 文档 + T-04-17 安全测试 + T-04-18 演练  → 验证：文档和测试完整
```

---

## 12. 阶段完成定义

| 维度 | 完成条件 |
| --- | --- |
| 功能完成 | 评论提交/展示/审核；用户管理；审计日志；备份恢复；监控告警；发布回滚；安全加固 |
| 页面完成 | 评论区、评论管理、用户管理、审计日志页全部接入真实数据 |
| 接口完成 | 评论/用户/审计接口全部可用且有鉴权 |
| 数据完成 | SQLite 补建 comments/audit_logs 表 |
| 权限完成 | 管理接口需认证；评论提交公开但受限流 |
| 异常处理完成 | 限流、脱敏、空状态、错误状态、确认操作 |
| 测试完成 | 评论测试；用户管理测试；安全回归测试；备份恢复演练 |
| 文档完成 | 部署指南、备份恢复、发布回滚文档；changelog 更新 |
| 部署验证完成 | Docker 中可完成评论互动、用户管理；备份可恢复 |
