# 纸张刊物改版

## 目标与设计来源

严格参考用户提供的 `crescent-redesign-mockups.zip` 中 HTML、CSS、月相脚本及桌面／夜间／移动截图。示例文章、日期、数字与项目经历不作为真实内容写入数据库。

## 已确认范围

- 暖纸、黑墨、中文宋体、Instrument Serif 斜体英文、等宽元信息；荧光绿仅强调，钴蓝链接，橙色用于放弃与修订。
- 页头显示当前月相；月相取设计稿的朔望月算法，不把图中固定月相当作实时数据。
- 首页最新长文＋札记双栏、长文索引与鼠标封面预览、合集、项目；移动端单列。
- 长文、近期进展和过程记录合并到按月份排序的笔记时间线，后两者统称札记；旧动态路由重定向。
- 文章目录、正文、顶部阅读进度、字号及链接工具、修订记录、相邻文章与合集导航。
- 项目用独立阶段字段表示月相；归档／放弃集中到 Waning 并保存退出原因；关于页轻量调整。
- 用户明确同意补齐前后端字段与后台录入；数据库变更只提供手动 SQL，不在应用启动时执行。
- 实现 RSS；邮箱订阅另做，界面使用真实 RSS 订阅入口。
- 内容轻微上浮，预览仅在支持悬停且未启用减少动画时出现；日夜主题跨刷新保留。

## 数据约定

- `projects` 新增：`phase`（空／research／building／live／waning）、`goal`、`boundary`、`current_work`、`progress_percent`（空或 0–100 整数）、`closure_kind`（空／archived／abandoned）、`closure_reason`。
- 新发布项目必须明确阶段；下弦阶段必须填写退出类型及原因；历史项目不根据发布状态推断研究／上线阶段。
- `articles` 新增 `project_id`、`revisions_json`（接口 `revisions` 数组，每项为 `date`、`summary`）、`title_emphasis`（必须是标题中原样存在的短语）。修订内容由作者明确录入，不把普通保存时间伪装成修订历史。
- `observatory_notes`、`builds` 新增 `project_id`，通过明确 ID 关联项目，不做名称或标签猜测。
- 笔记时间线用长文发布时间、札记创建时间、进展的 `progressed_at`（未填写则创建时间）排序；按 UTC+8 分月。
- 公共长文与 RSS 只暴露公开且已发布的文章；合集计数只计公开已发布内容；公开项目允许阅读已归档条目，草稿不暴露。
- 手动 SQL：`database/sqlite/2026-10-21-editorial.sql`、`database/postgres/2026-10-21-editorial.sql`。需在应用升级前备份并人工执行一次；新安装完整 schema 已同步。

## Checklist

- [x] 首页、笔记、文章、项目、关于及旧路由完成。
- [x] 真实月相、主题持久化、减少动画完成。
- [x] 数据字段、API、后台录入、手动 SQL 完成。
- [x] 单元及接口回归、前后台类型检查、Lint、生产构建通过。
- [ ] 桌面／移动／夜间浏览器与关键交互验证。
- [ ] 提交、推送与 PR。

## 当前环境

用户明确要求本次不用 Docker。隔离后端在 8092；未修改现有内容数据库。前后台生产构建通过。自动审批拒绝启动本地生产服务且未给出具体原因；用户手动启动 3003／3004 后，后台已连接隔离库，公开站服务仍读取 8091 的现有内容。用户随后明确要求：无法自行启动则不再启动，本次据此停止启动尝试。

## 验收结果与剩余项

- `go test ./...` 全部通过，新增项目阶段／退出校验、字段持久化、文章修订和项目关联、私有文章隔离回归。
- 月相三项单测、前后台类型检查、前后台完整 Lint、前后台生产构建通过。后台有一条原有 `<img>` 性能警告，无 Lint 错误。中文宋体通过 Fontsource 随站点打包，避免构建时逐个请求远程中文字体分片。
- 后台三项浏览器测试通过：项目全部编辑字段保存并重新读取；文章关联／标题强调／修订保存并重新读取；札记与构建选择真实项目。
- RSS 集成测试直接调用生产构建中的 GET 处理函数并连接隔离 API，已验证 XML 转义、文章链接、草稿及私有内容排除，无需新增监听端口。
- 公开站主题切换及刷新持久化、旧路由跳转、桌面跟随封面预览和减少动画测试通过。已人工检查 1440px 首页与文章、390px 文章阅读布局；页头溢出已修复。
- 公开站七项隔离数据用例尚未全部通过：当前服务没有连接测试库，混排计数、修订／合集、Waning 与 RSS 隔离数据断言无法在该服务上验证。移动端完整用例要求详情返回 200，需连接隔离库后重跑，不将 404 页的布局检查算作详情页通过。
- PostgreSQL SQL 尚未在真实 PostgreSQL 实例执行。PR 保持草稿，待公开站隔离数据验收完成后转为可合并。

## 验证命令与隔离数据

- `go test ./...`：Go 单元与接口回归。
- `pnpm --dir frontend test:unit`：月相算法边界。
- 前台构建后设置 `EDITORIAL_TEST_BACKEND_URL` 为隔离 API，执行 `node --test backend/test/integration/rss.test.mjs`：RSS 真实处理函数与 API 集成。
- `pnpm --dir frontend typecheck`、`pnpm --dir frontend lint`、`pnpm --dir frontend build`。
- `pnpm --dir admin typecheck`、`pnpm --dir admin lint`、`pnpm --dir admin build`。
- `python backend/test/e2e/prepare_editorial.py data/editorial-e2e/data/preview.db`：新建隔离数据库，拒绝覆盖已有文件。测试数据包含各月相、归档／放弃、修订、合集、跨月札记、构建记录及不应公开的文章。
- 隔离后端在独立工作目录读取 `data/conf.ini`，数据库指向上述测试库；`server.host=127.0.0.1`、`server.port=8092`、`frontend.enabled=false`。JWT 密钥在本地生成，不写入测试脚本。
- 前台使用 `BACKEND_URL=http://127.0.0.1:8092` 构建并启动后，设置 `EDITORIAL_TEST_URL` 为该前台地址，执行 `pnpm --dir frontend test:e2e`。浏览器使用本机 Chrome；测试及失败 trace 放在已忽略的 `data/editorial-e2e-results`。
- 后台浏览器测试：`EDITORIAL_ADMIN_TEST_URL` 指向隔离后台，`EDITORIAL_TEST_LOGIN_FILE` 指向本地 JSON（`username`、`password`）；执行 `pnpm --dir frontend test:e2e admin-editorial.spec.cjs`。凭据文件只保存在忽略目录；未提供时跳过后台用例，禁止使用线上环境运行这些写入测试。
- SQLite 升级另以本次改动前完整 schema 创建临时库、写入旧数据，再执行手动 SQL；已验证数据保留，未推断历史阶段或修订。
- PostgreSQL 手动 SQL 尚未在真实 PostgreSQL 实例上执行。
