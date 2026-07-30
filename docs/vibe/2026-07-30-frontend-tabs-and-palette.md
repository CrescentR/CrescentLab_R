# 前端改版：多页 Tab 结构 + 浅色配色

> 日期：2026-07-30
> 范围：`frontend/` 公开前台与后台配色
> 依据：[2026-07-29-homepage-content-prd.md](2026-07-29-homepage-content-prd.md) 中定义的区块划分

## 1. 背景

当前公开前台是单页堆叠结构：`HomeClient` 把 Hero、正在构建、实验观测台、项目、笔记、关于六个区块渲染在同一页，靠锚点滚动切换。配色是 `.lab-home` 里独立的一套暗色（深灰蓝底 + 紫/青霓虹强调色），和 `globals.css` 的明暗主题令牌互不相干。

两个问题：

- 暗色霓虹配色与「持续更新的公开研究档案」这一定位不匹配，长时间阅读不舒适。
- 六个区块共用一个 URL，无法分享、无法直达，PRD 里各区块「唯一且稳定的内容职责」在结构上没有体现。

## 2. 目标

1. 把六个区块拆成六个真实路由，顶部用 tab 切换，URL 可分享、可刷新。
2. 全站换成浅色、低饱和、耐看的配色：暖白纸感底 + 墨灰文字 + 苔绿主色。
3. 后台（`/admin`、`/login`）同步换色。

## 3. 非目标

- 不改内容文案。PRD 第 14.1 节列出的真实信息仍未补齐，本次不为「正在构建」四个对象编造定义、阶段或进展。
- 不改后端接口、数据模型。
- 不新增归档页、筛选、搜索（PRD 中的 P2）。

## 4. 方案

### 4.1 路由

新增 `app/(site)` 路由组，承载公开前台并共用 tab 导航与页脚：

| 路由 | 区块 | 数据来源 |
| --- | --- | --- |
| `/` | Hero | 静态文案 |
| `/building` | 正在构建 | `labHomeContent.nowBuilding` |
| `/experiments` | 实验观测台 | `labHomeContent.labExperiments` |
| `/projects` | 项目 | `labHomeContent.labProjects` |
| `/notes` | 笔记 | `listPublicArticles` |
| `/about` | 关于 | 静态文案 |
| `/articles/[slug]` | 文章详情 | `getPublicArticle` |

顶部 tab 用 `usePathname` 判断激活项。锚点滚动（`scrollToSection`）与 Lenis 平滑滚动随单页结构一起移除，页面变短后不再需要。

### 4.2 配色

| 用途 | 值 |
| --- | --- |
| 页面底色 | `#f7f6f1` 暖白 |
| 卡片 | `#ffffff` / `#faf9f4` |
| 描边 | `#e3e1d7` |
| 正文 | `#4f5a53` |
| 标题 | `#1e2621` |
| 主色（苔绿） | `#3f7d6a` |
| 次强调（雾蓝） | `#4a7395` |
| 暖强调（陶土） | `#b06a55` |

`globals.css` 的令牌语义名（`--teal`、`--blue`、`--coral` 等）保留，只重调数值，后台不需要逐文件改。`.lab-home` 自有的 `--lab-*` 令牌同步改为浅色一套。

## 5. Checklist

- [x] `docs/vibe` 记录目标与验收
- [x] `globals.css` 令牌重调（浅色 + 暗色）
- [x] `lab-home.css` 改为浅色主题，新增 tab 导航样式
- [x] `(site)` 路由组：`SiteHeader` + `SiteFooter` + `layout`
- [x] 六个页面拆分完成，`articles/[slug]` 迁入路由组
- [x] 移除锚点滚动、滚动进度条、暗色专属光效等失效代码
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm build` 通过
- [x] 更新 `docs/develop-guides/changelog.md`

## 6. 验收标准

- [ ] 六个 tab 都能直接访问、刷新不 404，当前页 tab 有明确激活态。
- [ ] 全站不再出现深色底、霓虹紫/青强调色。
- [ ] 文章详情、登录页、后台在新配色下文字对比度可读。
- [ ] 「正在构建」页面展示的内容与改版前一致，没有新增编造字段。
