# 第 02 期：文章发布闭环

> 路线图基线：`docs/planning/02-roadmap.md` 阶段 02
> 前置阶段：阶段 01 完成（认证、统一错误、健康检查、CI 就绪）
> 前置决策：见 `05-decisions-and-open-questions.md` 中 Q-006 ~ Q-009

---

## 1. 阶段概述

### 1.1 本期解决什么问题

文章 API 已实现 CRUD，但前端首页和后台编辑器全部使用 `mockData.ts` 静态数据，`content_html` 从不生成，核心用户旅程"登录→写作→发布→公开阅读"无法闭环。

### 1.2 为什么安排在这一期

文章发布是 CMS 的核心价值。阶段 01 完成安全门禁后，本期让管理员能真正写文章并让访客阅读，是项目从"骨架"进入"可用"的关键一步。

### 1.3 本期完成后的产品状态

- 管理员可在后台文章列表创建、编辑、保存草稿、发布、归档和软删除文章。
- 编辑器接入真实 API，保存和发布对应真实数据操作。
- 访客可从首页进入已发布文章详情页。
- 首页文章列表读取真实已发布数据，不再使用 mock。
- Markdown 正文在服务端转换为安全 HTML。

### 1.4 本期对整个项目的价值

完成核心内容流闭环后，项目达到"最小可用版本"。后续的媒体、分类标签和评论才能围绕真实文章数据展开。

---

## 2. 阶段目标

| 编号 | 目标 | 可验收条件 |
| --- | --- | --- |
| G-02-01 | 后台文章列表可用 | 管理员能看到文章列表，支持状态筛选、搜索和分页 |
| G-02-02 | 编辑器接入 API | 创建、编辑、保存草稿、发布、归档、软删除全部对应真实操作 |
| G-02-03 | 公开文章详情页 | 访客可从首页进入已发布文章详情；草稿和已删除不可访问 |
| G-02-04 | 首页读取真实数据 | 首页文章列表不再使用 mockData，读取已发布文章 |
| G-02-05 | Markdown 安全渲染 | 服务端将 Markdown 转换为 HTML 并净化；content_html 不再为空 |
| G-02-06 | 核心流程测试 | 登录→建草稿→发布→公开读取→归档/删除的 E2E 测试通过 |

---

## 3. 用户角色

| 角色 | 本期参与方式 |
| --- | --- |
| 站点管理员 | 在后台创建、编辑、发布、归档和删除文章 |
| 访客 | 在首页浏览文章列表，进入文章详情阅读 |

---

## 4. 功能范围

| 模块 | 功能 |
| --- | --- |
| 后台文章管理 | 文章列表页（筛选、搜索、分页、创建入口） |
| 文章编辑器 | 加载已有文章、创建新文章、保存草稿、发布、归档、软删除 |
| 公开文章列表 | 首页读取真实已发布文章 |
| 公开文章详情 | 新增 `/posts/[slug]` 页面 |
| Markdown 渲染 | 服务端 Markdown→HTML 转换 + XSS 净化 |
| 测试 | 认证集成测试、PostgreSQL 集成测试、核心 E2E |

---

## 5. 详细功能需求

### 5.1 后台文章列表

#### 5.1.1 功能目的

让管理员查看全部文章（含草稿、已发布、已归档），并从列表创建新文章或编辑已有文章。

#### 5.1.2 使用角色

站点管理员。

#### 5.1.3 功能入口

- 前端页面：`/admin/postManagement`（新增）
- 后台侧栏"内容"导航项当前指向 `/admin/postManagement/new`，需改为指向列表页

#### 5.1.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 页面标题 | "文章管理" |
| 顶部操作栏 | "新建文章"按钮（跳转 `/admin/postManagement/new`） |
| 筛选区 | 状态下拉（全部/草稿/已发布/已归档）、搜索框（按标题搜索） |
| 列表表头 | 标题、状态、分类、浏览量、更新时间、操作 |
| 列表行 | 标题（可点击进入编辑）、状态 Badge、分类名、view_count、updated_at、"编辑"和"删除"按钮 |
| 空状态 | "暂无文章，点击新建文章开始创作" |
| 加载状态 | 骨架屏或 Loading 指示器 |
| 错误状态 | "加载失败，请重试" + 重试按钮 |
| 分页 | 上一页/下一页 + 当前页/总页数 |

#### 5.1.5 操作流程

1. 管理员登录后进入 `/admin/postManagement`。
2. 前端调用 `GET /api/admin/articles?page=1&page_size=10`。
3. 系统返回文章列表和分页信息。
4. 管理员可按状态筛选或搜索。
5. 点击"新建文章"跳转到编辑器。
6. 点击文章标题或"编辑"跳转到 `/admin/postManagement/[id]/edit`。
7. 点击"删除"弹出确认框，确认后软删除。

#### 5.1.6 业务规则

- 列表按 `is_pinned DESC, pin_sort DESC, COALESCE(published_at, created_at) DESC` 排序。
- 分页默认 page=1, page_size=10，最大 page_size=50。
- 搜索匹配 title 和 excerpt。
- 软删除后文章从列表消失。
- 删除操作需二次确认。

#### 5.1.7 状态设计

文章状态：

| 状态 | 含义 | 进入条件 | 可执行操作 | 下一状态 |
| --- | --- | --- | --- | --- |
| draft | 草稿 | 新建文章默认状态 | 编辑、发布、删除 | published / archived |
| published | 已发布 | 从草稿发布 | 编辑、归档、删除 | archived / draft |
| archived | 已归档 | 从已发布归档 | 编辑、重新发布、删除 | published / draft |
| scheduled | 定时发布 | 设置未来发布时间 | 编辑、取消定时、删除 | published（到期后） |

本期不实现 `scheduled` 的定时扫描任务，但保留状态值。

#### 5.1.8 数据要求

使用现有 `articles` 表，无新增字段。列表查询返回 `ArticleListItem` 结构。

#### 5.1.9 权限要求

- 查看列表：需认证 + 管理员。
- 创建/编辑/删除：需认证 + 管理员。

#### 5.1.10 异常情况

| 场景 | 前端处理 | 后端处理 |
| --- | --- | --- |
| 网络异常 | 显示错误状态 + 重试 | — |
| 列表为空 | 显示空状态 | 返回空数组 |
| 分页超出范围 | 显示空列表 | 返回空数组 |
| 删除失败 | 显示错误提示 | 返回错误码 |
| token 过期 | 自动刷新后重试 | 返回 401 |

#### 5.1.11 验收标准

- Given 已登录管理员，When 访问 `/admin/postManagement`，Then 显示文章列表。
- Given 有 3 篇草稿和 2 篇已发布文章，When 筛选"草稿"，Then 只显示 3 篇草稿。
- Given 空数据库，When 访问列表页，Then 显示空状态。
- Given 列表中的文章，When 点击"删除"并确认，Then 文章从列表消失（软删除）。
- Given 列表分页，When 在第 2 页点击"上一页"，Then 回到第 1 页。

---

### 5.2 文章编辑器

#### 5.2.1 功能目的

让管理员创建和编辑文章，保存草稿或发布，替换当前完全静态的编辑器原型。

#### 5.2.2 使用角色

站点管理员。

#### 5.2.3 功能入口

- 新建：`/admin/postManagement/new`
- 编辑：`/admin/postManagement/[id]/edit`

#### 5.2.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 顶部栏 | 返回按钮、文章标题（可编辑）、状态指示器、"保存草稿"和"发布"按钮 |
| 左侧元数据 | URL Slug 输入框、分类选择（本期可选，不强制）、摘要输入框、封面 URL 输入框 |
| 中心编辑区 | Markdown 文本编辑区（纯文本 textarea 或简易 Markdown 编辑器） |
| 预览 | 切换"编辑/预览"模式，预览渲染 Markdown |
| 底部状态 | "上次保存时间"、未保存提示 |

#### 5.2.5 操作流程

**新建文章：**

1. 管理员从列表点击"新建文章"，进入 `/admin/postManagement/new`。
2. 编辑器初始化为空白状态。
3. 管理员输入标题、slug、摘要、正文。
4. 点击"保存草稿"：前端发送 `POST /api/admin/articles`，status=draft。
5. 后端创建文章，返回 ArticleDetail（含 id）。
6. 前端 URL 切换到 `/admin/postManagement/[id]/edit`。
7. 管理员继续编辑，点击"保存草稿"：前端发送 `PUT /api/admin/articles/:id`。
8. 管理员点击"发布"：前端发送 `PUT /api/admin/articles/:id`，status=published。

**编辑已有文章：**

1. 管理员从列表点击"编辑"，进入 `/admin/postManagement/[id]/edit`。
2. 前端调用 `GET /api/admin/articles` 获取文章详情（需新增按 ID 查询的管理接口）。
3. 编辑器加载标题、slug、摘要、正文、封面和状态。
4. 管理员编辑后保存或发布。

**软删除：**

1. 编辑器顶部"删除"按钮（或列表中的删除）。
2. 弹出确认框。
3. 确认后发送 `DELETE /api/admin/articles/:id`。
4. 跳转回列表。

**归档：**

1. 已发布文章的编辑器中显示"归档"按钮。
2. 点击后发送 `PUT /api/admin/articles/:id`，status=archived。
3. 公开端立即停止展示。

#### 5.2.6 业务规则

- slug 必须唯一（数据库已有 UNIQUE 约束）。
- 标题非空，slug 非空。
- 正文以 Markdown 为主格式（`source_format = "markdown"`）。
- 发布时自动设置 `published_at`（如首次发布）；重新发布不重置 `published_at`。
- 从已发布改为草稿时清除 `published_at`。
- 离开编辑器时有未保存内容时弹出确认（`beforeunload` 事件）。
- 编辑器自动保存不实现（本期手动保存）。

#### 5.2.7 状态设计

见 5.1.7。编辑器中状态流转：

```
新建 → draft → published → archived
                ↑           |
                +-----------+ (重新发布)
```

#### 5.2.8 数据要求

| 字段 | 含义 | 必填 | 类型 | 默认值 | 来源 | 校验 |
| --- | --- | --- | --- | --- | --- | --- |
| title | 标题 | 是 | TEXT | — | 用户输入 | 非空，1~200 字符 |
| slug | URL 别名 | 是 | TEXT | — | 用户输入 | 非空，唯一，`^[a-z0-9-]+$` |
| excerpt | 摘要 | 否 | TEXT | NULL | 用户输入 | ≤ 500 字符 |
| content_md | Markdown 正文 | 否 | TEXT | "" | 用户输入 | — |
| cover_url | 封面 URL | 否 | TEXT | NULL | 用户输入 | 有效 URL |
| status | 状态 | 是 | TEXT | "draft" | 系统/用户 | 枚举 |
| source_format | 源格式 | 是 | TEXT | "markdown" | 系统 | 枚举 |

#### 5.2.9 权限要求

- 新建/编辑/删除：需认证 + 管理员。

#### 5.2.10 异常情况

| 场景 | 前端处理 | 后端处理 |
| --- | --- | --- |
| slug 重复 | 显示"slug 已存在" | 返回 409 CONFLICT |
| 标题为空 | 前端校验拦截 | 返回 400 VALIDATION_ERROR |
| 网络异常 | 显示"保存失败，请重试" | — |
| 文章已被删除 | 显示"文章不存在" | 返回 404 NOT_FOUND |
| 并发修改 | 覆盖（本期不实现乐观锁） | 最后写入生效 |
| token 过期 | 自动刷新后重试 | 返回 401 |
| 离开页面有未保存内容 | 弹出确认 | — |

#### 5.2.11 验收标准

- Given 新建页面，When 填写标题和 slug 并保存草稿，Then 文章出现在列表中，状态为 draft。
- Given 已有草稿，When 编辑正文并发布，Then 状态变为 published，`published_at` 被设置。
- Given 已发布文章，When 归档，Then 状态变为 archived，公开端不再展示。
- Given 已发布文章，When 在公开端访问其 slug，Then 返回文章详情。
- Given slug 已存在，When 创建新文章使用相同 slug，Then 返回 409。
- Given 编辑器有未保存内容，When 尝试关闭页面，Then 弹出确认提示。

---

### 5.3 公开文章详情页

#### 5.3.1 功能目的

让访客阅读已发布文章的完整内容。

#### 5.3.2 使用角色

访客。

#### 5.3.3 功能入口

- 前端页面：`/posts/[slug]`（新增）
- 入口：首页文章列表卡片点击

#### 5.3.4 页面展示内容

| 区域 | 内容 |
| --- | --- |
| 文章标题 | H1 标题 |
| 元信息 | 发布时间、阅读时长、浏览量 |
| 封面图 | 如有 cover_url 则展示 |
| 正文 | 渲染后的 HTML（从 content_html 字段） |
| 底部 | 返回首页链接 |

#### 5.3.5 操作流程

1. 访客在首页点击文章卡片。
2. 前端跳转到 `/posts/[slug]`。
3. 前端调用 `GET /api/articles/:slug`。
4. 后端返回 ArticleDetail（含 content_html）。
5. 前端渲染 content_html。
6. 如果文章不存在或未发布，返回 404 页面。

#### 5.3.6 业务规则

- 只有 `status = published` 且 `deleted_at IS NULL` 的文章可访问。
- 草稿、已归档、已删除的文章返回 404。
- 404 页面不区分"不存在"和"未发布"。

#### 5.3.7 状态设计

无前端状态。服务端根据文章 status 决定是否返回。

#### 5.3.8 数据要求

使用现有 `articles` 表。读取 `content_html` 字段。

#### 5.3.9 权限要求

- 公开访问，不需要认证。

#### 5.3.10 异常情况

| 场景 | 前端处理 | 后端处理 |
| --- | --- | --- |
| slug 不存在 | 显示 404 页面 | 返回 404 NOT_FOUND |
| 文章是草稿 | 显示 404 页面 | 返回 404 NOT_FOUND |
| 文章已删除 | 显示 404 页面 | 返回 404 NOT_FOUND |
| 网络异常 | 显示"加载失败" | — |
| content_html 为空 | 显示 content_md 原文或提示 | — |

#### 5.3.11 验收标准

- Given 已发布文章 slug "hello-world"，When 访问 `/posts/hello-world`，Then 显示文章标题、正文和元信息。
- Given 不存在的 slug，When 访问，Then 显示 404 页面。
- Given 草稿文章的 slug，When 访问，Then 显示 404 页面。
- Given 已删除文章的 slug，When 访问，Then 显示 404 页面。

---

### 5.4 首页文章列表接入真实数据

#### 5.4.1 功能目的

让首页文章区域读取真实已发布文章，替换 `mockData.ts` 中的静态 `articleSummaries`。

#### 5.4.2 使用角色

访客。

#### 5.4.3 功能入口

- 前端页面：`/`（修改现有首页）
- 组件：`frontend/src/components/home/articleSection.tsx`

#### 5.4.4 页面展示内容

首页文章区域展示：

| 区域 | 内容 |
| --- | --- |
| 区域标题 | "文章"或"最近发布" |
| 文章卡片 | 封面图、标题、摘要、分类、阅读时长、发布时间 |
| 卡片点击 | 跳转到 `/posts/[slug]` |
| 空状态 | "暂无已发布文章" |
| 加载状态 | 骨架屏 |
| 错误状态 | "加载失败" |

#### 5.4.5 操作流程

1. 访客进入首页。
2. 首页组件调用 `GET /api/articles?page=1&page_size=6`。
3. 系统返回已发布文章列表。
4. 前端渲染文章卡片。
5. 访客点击卡片跳转到详情页。

#### 5.4.6 业务规则

- 只展示 `status = published` 的文章。
- 列表按 `is_pinned DESC, pin_sort DESC, published_at DESC` 排序。
- 首页最多展示 6 篇文章（可配置，本期硬编码）。
- 文章卡片显示摘要（excerpt），无摘要时截取正文前 200 字。

#### 5.4.7 状态设计

| 状态 | 含义 |
| --- | --- |
| loading | 正在加载 |
| success | 加载成功 |
| empty | 无已发布文章 |
| error | 加载失败 |

#### 5.4.8 数据要求

使用现有公开文章列表接口 `GET /api/articles`。

#### 5.4.9 权限要求

- 公开访问。

#### 5.4.10 异常情况

| 场景 | 前端处理 |
| --- | --- |
| 接口失败 | 显示错误状态 |
| 无文章 | 显示空状态 |
| 文章无封面 | 显示默认占位图 |

#### 5.4.11 验收标准

- Given 有已发布文章，When 访问首页，Then 文章区域展示真实文章卡片。
- Given 无已发布文章，When 访问首页，Then 文章区域显示空状态。
- Given 首页文章卡片，When 点击，Then 跳转到对应详情页。
- Given mockData.ts 中的 articleSummaries，When 检查首页代码，Then 不再被文章区域引用。

---

### 5.5 Markdown 安全渲染

#### 5.5.1 功能目的

在服务端将 Markdown 转换为 HTML 并进行 XSS 净化，填充 `content_html` 字段，使公开详情页能安全展示渲染后内容。

#### 5.5.2 使用角色

系统（自动），管理员（间接受益）。

#### 5.5.3 功能入口

- 代码：`internal/shared/markdown/`（新增渲染器）
- 触发时机：文章创建和更新时

#### 5.5.4 页面展示内容

无直接页面。渲染结果体现在公开文章详情页。

#### 5.5.5 操作流程

1. 管理员保存或发布文章时，提交 `content_md`。
2. 后端在 Create/Update handler 中调用 Markdown 渲染器。
3. 渲染器将 Markdown 转换为 HTML（支持标题、段落、列表、代码块、链接、图片、引用）。
4. HTML 净化器移除危险标签和属性（`<script>`、`on*` 事件、`javascript:` 协议等）。
5. 将净化后的 HTML 写入 `content_html` 字段。
6. 计算字数和阅读时长，更新 `word_count` 和 `reading_time_minutes`。

#### 5.5.6 业务规则

- Markdown 是唯一正文源格式（`source_format = "markdown"`）。
- 渲染在服务端完成，不在前端渲染 Markdown。
- 允许的 HTML 标签白名单：h1-h6, p, ul, ol, li, blockquote, pre, code, a, img, strong, em, hr, br, table, thead, tbody, tr, th, td。
- 链接的 `href` 只允许 `http:`、`https:` 协议。
- 图片的 `src` 只允许 `http:`、`https:` 协议。
- 代码块支持语法高亮 class（但不引入高亮库，由前端 CSS 决定）。
- 字数统计按 CJK + 英文单词计算。
- 阅读时长 = 字数 / 300（向下取整，最小 1）。

#### 5.5.7 状态设计

无状态。渲染是无状态的纯函数。

#### 5.5.8 数据要求

更新 `articles.content_html`、`articles.word_count`、`articles.reading_time_minutes`。

#### 5.5.9 权限要求

无。渲染在服务端 Create/Update 时自动执行。

#### 5.5.10 异常情况

| 场景 | 处理 |
| --- | --- |
| Markdown 解析失败 | 保存原始 content_md，content_html 设为空字符串，日志记录 |
| HTML 净化失败 | 保存原始 content_md，content_html 设为空字符串 |
| content_md 为空 | content_html 为空，word_count 为 0 |

#### 5.5.11 验收标准

- Given Markdown 含 `<script>alert(1)</script>`，When 保存文章，Then `content_html` 不包含 `<script>` 标签。
- Given Markdown 含 `[链接](javascript:alert(1))`，When 保存，Then `content_html` 中该链接被移除或 href 被清除。
- Given Markdown 含代码块，When 保存，Then `content_html` 包含 `<pre><code>` 标签。
- Given 1000 字的 Markdown，When 保存，Then `word_count` 约为 1000，`reading_time_minutes` 约为 4。
- Given 已保存的文章，When 访问公开详情，Then 页面展示渲染后的 HTML 而非 Markdown 原文。

---

### 5.6 后台文章详情查询接口

#### 5.6.1 功能目的

为编辑器加载已有文章提供按 ID 查询的管理接口。当前只有公开的按 slug 查询，管理员编辑需要按 ID 查询（包括草稿和已归档）。

#### 5.6.2 使用角色

站点管理员。

#### 5.6.3 功能入口

- HTTP 接口：`GET /api/admin/articles/:id`

#### 5.6.4 页面展示内容

返回 ArticleDetail JSON。

#### 5.6.5 操作流程

1. 前端编辑器加载时调用 `GET /api/admin/articles/:id`。
2. 后端按 ID 查询（不限制 status，包含草稿和已归档）。
3. 返回 ArticleDetail。

#### 5.6.6 业务规则

- 管理接口可查询任何状态的文章（含 draft、archived）。
- 软删除的文章返回 404。

#### 5.6.7 状态设计

无。

#### 5.6.8 数据要求

使用现有 `articles` 表。

#### 5.6.9 权限要求

- 需认证 + 管理员。

#### 5.6.10 异常情况

| 场景 | 处理 |
| --- | --- |
| ID 不存在 | 返回 404 |
| ID 格式无效 | 返回 400 |

#### 5.6.11 验收标准

- Given 草稿文章 ID，When 调用 `GET /api/admin/articles/:id`，Then 返回文章详情。
- Given 不存在的 ID，When 调用，Then 返回 404。
- Given 未认证，When 调用，Then 返回 401。

---

## 6. 页面和交互清单

| 操作 | 页面/组件 | 入口 | 用途 |
| --- | --- | --- | --- |
| 新增 | `/admin/postManagement` | 后台侧栏"内容" | 文章列表 |
| 修改 | `/admin/postManagement/new` | 后台"新建"按钮 | 从静态原型改为接入 API |
| 新增 | `/admin/postManagement/[id]/edit` | 列表"编辑"按钮 | 编辑已有文章 |
| 新增 | `/posts/[slug]` | 首页文章卡片 | 公开文章详情 |
| 修改 | 首页 `articleSection` | `/` | 从 mockData 改为真实 API |
| 修改 | `AdminShell` 导航 | 后台侧栏 | "内容"指向列表页而非新建页 |
| 修改 | `dashboardOverview` | `/admin` | "最近内容"区域读取真实数据 |

---

## 7. 接口能力清单

| 接口 | 用途 | 调用方 | 权限 | 现有状态 |
| --- | --- | --- | --- | --- |
| `GET /api/articles` | 公开文章列表 | 首页 | 公开 | 继续使用 |
| `GET /api/articles/:slug` | 公开文章详情 | 详情页 | 公开 | 继续使用 |
| `GET /api/admin/articles` | 后台文章列表 | 列表页 | 需认证+管理员 | 扩展（已存在，加鉴权） |
| `GET /api/admin/articles/:id` | 后台文章详情 | 编辑器 | 需认证+管理员 | 新增 |
| `POST /api/admin/articles` | 创建文章 | 编辑器 | 需认证+管理员 | 扩展（加 Markdown 渲染 + 鉴权） |
| `PUT /api/admin/articles/:id` | 更新文章 | 编辑器 | 需认证+管理员 | 扩展（加 Markdown 渲染 + 鉴权） |
| `DELETE /api/admin/articles/:id` | 软删除文章 | 列表/编辑器 | 需认证+管理员 | 扩展（加鉴权） |

---

## 8. 数据能力清单

| 操作 | 实体/表 | 说明 |
| --- | --- | --- |
| 无变化 | `articles` | 现有表已满足；content_html 和 word_count 在保存时自动填充 |
| 无变化 | `post_categories` | 现有表；本期分类为可选字段 |
| 无新增 | — | 本期不新增表或字段 |

本期不涉及数据迁移。

---

## 9. 非功能需求

| 维度 | 要求 |
| --- | --- |
| 性能 | 公开文章列表 p99 < 100ms；文章详情 p99 < 150ms |
| 安全 | Markdown HTML 净化覆盖 XSS 常见向量；草稿不可被公开访问 |
| 可用性 | 编辑器有未保存提示；加载/空/错误状态完整 |
| 响应速度 | 编辑器保存响应 p99 < 300ms |
| 浏览器兼容 | Chrome 120+、Firefox 120+、Safari 17+ |
| 数据一致性 | SQLite 和 PostgreSQL 对文章主路径表现一致 |
| 日志 | 文章创建、更新、发布、删除写日志，关联 request_id 和 user_id |
| 测试要求 | Markdown 渲捖器单元测试；文章 CRUD 集成测试（SQLite + PostgreSQL）；登录→创建→发布→读取→删除 E2E |

---

## 10. 开发任务拆分

| 编号 | 任务名称 | 目标 | 涉及模块 | 前置依赖 | 输出物 | 验收条件 | 优先级 | 可并行 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-02-01 | 实现 Markdown 渲染器 | Goldmark + Bluemonday | shared/markdown | — | renderer.go | XSS 净化测试通过 | P1 | 是 |
| T-02-02 | 集成渲染到 content handler | Create/Update 生成 content_html | modules/content | T-02-01 | handler.go 修改 | content_html 不为空 | P1 | 否 |
| T-02-03 | 实现字数和阅读时长 | 计算 word_count 和 reading_time | modules/content | T-02-01 | model.go 修改 | 字数和时长正确 | P2 | 是 |
| T-02-04 | 新增后台文章详情接口 | GET /api/admin/articles/:id | modules/content | — | handler.go | 按 ID 返回详情 | P1 | 是 |
| T-02-05 | 新增 slug 唯一校验 | Create/Update 检查 slug 冲突 | modules/content | — | repository.go | 返回 409 | P1 | 是 |
| T-02-06 | 创建后台文章列表页 | /admin/postManagement | frontend | T-02-04 | page.tsx | 列表/筛选/分页可用 | P1 | 是 |
| T-02-07 | 重写编辑器接入 API | /admin/postManagement/new 和 [id]/edit | frontend | T-02-04, T-02-05 | articleEditorWorkspace.tsx | 保存/发布/归档/删除可用 | P1 | 否 |
| T-02-08 | 创建公开文章详情页 | /posts/[slug] | frontend | T-02-02 | page.tsx | 详情页渲染 HTML | P1 | 是 |
| T-02-09 | 首页文章列表接入 API | 替换 mockData | frontend | T-02-02 | articleSection.tsx | 首页读取真实数据 | P1 | 是 |
| T-02-10 | 修改 AdminShell 导航 | "内容"指向列表页 | frontend | T-02-06 | adminShell.tsx | 导航正确 | P2 | 是 |
| T-02-11 | Dashboard 接入真实数据 | "最近内容"读取文章 | frontend | T-02-09 | dashboardOverview.tsx | 不使用 mock | P2 | 是 |
| T-02-12 | 编写 PostgreSQL 集成测试 | 文章 CRUD 双库一致 | test | T-02-02 | integration test | SQLite 和 PG 通过 | P2 | 否 |
| T-02-13 | 编写核心 E2E 测试 | 登录→创建→发布→读取→删除 | test | T-02-07, T-02-08 | e2e test | 测试通过 | P2 | 否 |

---

## 11. 推荐开发顺序

```
1. T-02-01 Markdown 渲染器  → 验证：XSS 净化测试通过
2. T-02-02 集成渲染 + T-02-03 字数统计 + T-02-04 后台详情接口 + T-02-05 slug 校验  → 验证：API 层完整
3. T-02-06 文章列表页 + T-02-07 编辑器接入  → 验证：后台写作流程可用
4. T-02-08 公开详情页 + T-02-09 首页接入  → 验证：公开阅读流程可用
5. T-02-10 导航修改 + T-02-11 Dashboard 接入  → 验证：后台导航正确
6. T-02-12 PostgreSQL 集成测试 + T-02-13 E2E 测试  → 验证：全链路测试通过
```

---

## 12. 阶段完成定义

| 维度 | 完成条件 |
| --- | --- |
| 功能完成 | 文章 CRUD 完整；草稿/发布/归档/删除可用；Markdown 渲染可用 |
| 页面完成 | 列表页、编辑器、详情页、首页文章区全部接入真实数据 |
| 接口完成 | 公开和管理文章接口全部可用且有鉴权 |
| 数据完成 | content_html 自动生成；word_count 和 reading_time_minutes 正确 |
| 权限完成 | 管理接口需认证；公开接口只返回已发布 |
| 异常处理完成 | slug 冲突、404、空状态、加载失败、未保存提示 |
| 测试完成 | Markdown 单元测试；CRUD 集成测试（双库）；E2E 测试 |
| 文档完成 | changelog 更新 |
| 部署验证完成 | Docker 中可完成完整发布流程 |
