# `/notes` 杂志级列表体验

日期：2026-07-31

## 目标

彻底重做文章列表页，参考 Medium / Substack / Stripe Blog / Linear 等阅读产品，不再受限于旧的 `SectionIntro` + 细线列表结构。

## 验收标准

- [x] 独立视觉语言（`notes-list.css`），氛围光斑、颗粒纹理、衬线标题
- [x] Hero：大标题 + 统计卡（篇数 / 阅读 / 时长 / 精选）
- [x] 粘性工具栏：搜索、全部/精选筛选、杂志/列表视图切换
- [x] Featured 大卡片 + Mosaic 不对称网格 + Stream 列表三种呈现
- [x] 加载更多分页；空态与无结果态
- [x] 入场 stagger、悬停抬升、封面缩放；尊重 `prefers-reduced-motion`

## Checklist

- [x] `components/notes/*` 体验组件
- [x] `/notes` page 接入初始分页数据
- [x] 清理 `lab-home.css` 旧笔记样式
- [x] 更新 changelog
