# 笔记详情页浅色阅读版式

日期：2026-08-24

## 目标

去掉笔记详情页顶部与文章内容无关的默认月面大图 Hero，改为一套安静、优美、与 `/notes` 列表页视觉语言一致的浅色阅读版式。

## 验收标准

- [x] 顶部不再出现任何默认背景大图；用柔和光晕 + 纸纹作为页头氛围
- [x] 页头为编辑式排版：返回入口、眉题、衬线大标题、摘要、元信息分隔条 + 细线分隔
- [x] 标题、封面、正文左右边界严格对齐（左右轨等宽，阅读列居中）
- [x] 封面等比留白展示，非 16:9 图片（如 Logo）不裁切不拉伸
- [x] 颜色全部走 `globals.css` 令牌，不再硬编码米色/深色
- [x] 去掉每个 h2 前多余的 `FIELD NOTE` 装饰字
- [x] 无章节标题时不渲染空的目录轨
- [x] 详情页不再使用深色导航栏变体
- [x] 保留阅读进度、章节目录、字号/复制/分享/收藏工具，并尊重 `prefers-reduced-motion`

## Checklist

- [x] `components/articles/articleDetailContent.tsx` 结构重写
- [x] `globals.css` 详情页样式块重写（`.article-reading` 作用域）
- [x] 清理 `lab-home.css` 与 `siteHeader.tsx` 中的 `lab-header-article` 深色导航
- [x] 删除 `public/images/articles/lunar-observatory-hero.png`
- [x] `pnpm lint`、`pnpm build` 通过；本地 dev 环境按 1500 / 1440 / 922 三档宽度截图核对
- [x] 更新 changelog
