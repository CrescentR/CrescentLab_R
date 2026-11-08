# GitHub Actions 自动发布

## 目标

- `main` 更新后测试后端、公开站和管理后台，并为 `linux/amd64` 构建三个同提交版本的镜像。
- 将镜像推送到 GHCR，通过受限 SSH 入口按 digest 拉取和校验，再以同一提交固定标签部署到现有 `crescentlab_r` Compose 项目。
- 保留生产配置、PostgreSQL、`project_artifacts` 与 `storage_keys` 卷；发布失败自动恢复上一组三个镜像。
- 支持 Actions 手动发布与手动回滚，发布任务串行执行。

## 生产边界

- 公开站仍为 `https://me.crescentr.cn`，管理后台仍为 `https://isme.crescentr.cn`。
- 宿主机端口仍仅绑定 `127.0.0.1:3000` 与 `127.0.0.1:3001`，后端只在 Compose 网络监听 `8091`。
- `/home/app/CrescentLab_R/data/conf.ini`、数据库 DSN、JWT 密钥和现有 Docker 卷不进入 Actions 或镜像。
- 数据库 SQL 升级不由发布脚本执行，必须单独备份、审阅和确认。

## GitHub 配置

Repository Variables：

- `ADMIN_URL=https://isme.crescentr.cn`
- `PUBLIC_SITE_URL=https://me.crescentr.cn`
- `DEPLOY_HOST=me.crescentr.cn`
- `DEPLOY_PORT=22`
- `DEPLOY_USER=crescent-deploy`

Repository Secrets：

- `DEPLOY_SSH_KEY`：专用 Ed25519 私钥。
- `DEPLOY_KNOWN_HOSTS`：经服务器本机指纹核对的 SSH 主机公钥记录。

GHCR 登录使用单次 Actions `GITHUB_TOKEN`，只在拉取期间置于隔离的认证文件，不写入生产应用配置。服务器使用 Skopeo 按 digest 拉取 amd64 镜像并导入 Docker；若服务器访问 GHCR 需要出站代理，仅从 root 可读的 `/etc/crescentlab/proxy.env` 加载，不进入仓库或 Actions 日志。

## 验收清单

- [x] 工作流包含 Go 测试、前后台类型检查与 Lint。
- [x] 三个镜像使用同一提交 tag，并以 digest 交给服务器校验和拉取。
- [x] 部署并发锁、严格主机密钥校验和专用强制命令已配置。
- [x] Compose 项目名、回环端口、配置挂载和两个命名卷保持不变。
- [x] 发布验证覆盖 `/healthz/ready`、只读文章 API、公开站首页和后台登录页。
- [x] 失败自动回滚并验证旧版；手动回滚由 `workflow_dispatch` 提供。
- [x] 首次 Actions 生产发布。

## 首次发布

2026-11-08 通过 `main` 推送触发，运行记录：[42457290267](https://github.com/CrescentR/CrescentLab_R/actions/runs/42457290267)，提交 `0c684df015cc6169378caf2812796f533fa05182`。

上线的三个镜像：

- `ghcr.io/crescentr/crescentlab_r-backend@sha256:2763a3754c43b8095200afa525c8ab4fb4ba3429016be9d4a00d752485004001`
- `ghcr.io/crescentr/crescentlab_r-frontend@sha256:16ecad2efc616c475fd61ad66caed9f7945029473ae8219d001c37dc598b7987`
- `ghcr.io/crescentr/crescentlab_r-admin@sha256:1dc7722872123ea5297804a852d80517815ed53e8d359b1d96a27fd25f7d4e7c`

发布前已备份 PostgreSQL 并应用 `database/postgres/2026-10-29-projects.sql`；当前数据库 schema 的 7 个项目列与 3 个文章列均已存在。旧版三个镜像保留为 `crescentlab-r-{backend,frontend,admin}:rollback-20261108T070740Z`，回滚快照位于 `/var/lib/crescentlab-actions/previous.{compose,images}.yml`。

验证结果：后端 `/healthz/ready` 返回正常；只读文章 API 返回 200；`https://me.crescentr.cn/` 与 `https://isme.crescentr.cn/login` 返回 200；三个容器均带同一提交 revision 标签，Compose 项目名、回环端口、配置文件挂载和两个命名卷保持不变。

## 下次发布与回滚

- 发布：合入 `main` 自动触发，或在 Actions 页面手动运行 `deploy`。
- 回滚：手动运行工作流，选择 `rollback`。
