# 前端首页视觉优化方案

> 日期：2026-07-07
> 范围：前台首页（`/`），不含后台管理页面
> 目标：从"奶油色小实验室"风格 → "大气的编辑型内容平台"

## 一、背景

顶部栏已在上一次改动中优化（全宽毛玻璃 + 三段式 grid 居中导航）。但首页其他区域仍存在视觉风格偏小、留白不足、色块碎片化等问题，整体不够大气。

## 二、问题诊断

| # | 问题 | 具体表现 |
|---|------|---------|
| 1 | 背景过于温柔 | body 叠加了 sunny 黄 + teal 青径向渐变 + 奶油绿底色（#f4f8ee），偏"柔和精致" |
| 2 | 留白不足 | 卡片 padding 普遍 20-28px，区域间距 gap 3-5（12-20px），信息密集 |
| 3 | Hero 不够突出 | 标题 text-6xl 被框在卡片内，主卡片和右侧 feature 卡视觉权重接近，主次不分 |
| 4 | 碎片化色块 | 分类卡片 6 种色块背景，活动流/项目列表各有色点+色边，视觉太散 |
| 5 | mono 字体过载 | 导航、标签、元信息、统计数字全用 JetBrains Mono，大气感不足 |
| 6 | 圆角+阴影堆叠 | 大量 border-radius:18px + shadow-soft，每个元素都"浮起来"，反而失去层次 |

## 三、优化方案

### 3.0 UI/UX Pro Max 参考结论

- 已安装并读取 `ui-ux-pro-max` skill。
- 适配方向：内容优先的现代编辑型 Soft UI，而不是重装饰营销页。
- 设计系统要点：中性浅色背景、蓝色 CTA、克制阴影、清晰焦点状态、44px 左右的可点击区域、亮暗主题分别校验。
- Next.js 落地要点：内部导航使用 `next/link`，图片保留稳定容器尺寸，避免首屏布局跳动。

### 3.1 背景与底色

- 去掉 body 上的径向渐变（sunny + teal），改为纯净底色
- 保留暖色调但让底色更沉稳

**涉及文件**：`frontend/src/app/globals.css` — `body` 选择器

### 3.2 Hero 区域（改动最大）

- 标题 `text-6xl` → `text-7xl`，行高更紧凑
- Hero 卡片去掉外框和阴影，直接融入背景，用排版而非边框区分层次
- 图片区域更大，占比从 310px → 380px
- 上下间距大幅增加（`pb-10` → `pb-16`）
- 右侧 feature 卡片降低视觉权重，作为辅助而非并列

**涉及文件**：
- `frontend/src/app/globals.css` — `.home-hero-card`、`.home-hero-figure`、`.home-feature-card` 等
- `frontend/src/components/home/heroSection.tsx` — 标题 className 微调

### 3.3 分类卡片

- 去掉 6 种色块背景，统一为浅色卡片 + 左侧色条
- 增大高度（98px → 120px）和内边距
- 去掉 hover 位移效果，改为更沉稳的边框变化

**涉及文件**：
- `frontend/src/app/globals.css` — `.home-category-card` 及 `--blue/green/amber/violet/coral/teal/neutral` 变体
- `frontend/src/components/home/heroSection.tsx` — 分类卡片 className 微调

### 3.4 文章列表

- 精选文章图片从 280px → 340px
- 列表行间距从 `py-6` → `py-8`
- 标题字号适当增大

**涉及文件**：
- `frontend/src/app/globals.css` — `.home-featured-article` grid-template-columns
- `frontend/src/components/home/articleSection.tsx` — 行间距 className 微调

### 3.5 项目区域

- 每行 padding 从 `py-7` → `py-10`
- 去掉背景色带（`.home-project-band` 的 background），改为纯净分割线

**涉及文件**：
- `frontend/src/app/globals.css` — `.home-project-band`
- `frontend/src/components/home/projectSection.tsx` — 行间距 className 微调

### 3.6 活动流区域

- 双列间距从 `gap-12` → `gap-16`
- 时间线行间距增加（`py-5` → `py-7`）

**涉及文件**：
- `frontend/src/components/home/activitySection.tsx` — 间距 className 微调

### 3.7 全局调整

- 区域间距统一增大（各 section 的 py 值）
- mono 字体仅保留在元数据/标签上，标题和正文不用
- 减少阴影使用层级，只在关键悬浮元素上保留

**涉及文件**：`frontend/src/app/globals.css` — 多处

## 四、不改动的部分

- 组件结构 / DOM 不变（纯 CSS 改动为主 + 少量 className 微调）
- 数据 / mock 不变
- 后台页面不在本次范围
- 配色变量体系不变（仍然用 `--blue`/`--teal` 等，只是减少同时使用的数量）

## 五、改动文件清单

| 文件 | 改动类型 |
|------|---------|
| `frontend/src/app/globals.css` | 主要改动（背景、Hero、分类卡、阴影、间距） |
| `frontend/src/components/home/heroSection.tsx` | className 微调 |
| `frontend/src/components/home/articleSection.tsx` | className 微调 |
| `frontend/src/components/home/projectSection.tsx` | className 微调 |
| `frontend/src/components/home/activitySection.tsx` | className 微调 |

## 六、验收标准

- [x] 首页打开后，Hero 标题视觉权重明显最高，右侧 feature 不抢主视觉
- [x] 各区域间距舒展，无信息挤压感
- [x] 分类卡片不再有 6 种色块同时出现，视觉收敛
- [x] 整体风格从"小而精致"变为"大气舒展"
- [x] 交互元素有清晰 hover / active / focus-visible 状态
- [x] 暗色主题使用独立 token，不再沿用浅色表面
- [x] lint / typecheck 通过
- [x] 生产构建通过
- [ ] 浏览器截图验证 375px 与桌面视口（已用 Chrome headless 生成截图；375px headless 视口疑似未按移动布局模拟，最终仍需真实浏览器复核）

## 七、Checklist

- [x] 安装并读取 `ui-ux-pro-max` skill
- [x] 3.1 背景与底色
- [x] 3.2 Hero 区域
- [x] 3.3 分类卡片
- [x] 3.4 文章列表
- [x] 3.5 项目区域
- [x] 3.6 活动流区域
- [x] 3.7 全局调整
- [x] changelog 记录
- [x] lint / typecheck 验证
- [x] next build 验证
