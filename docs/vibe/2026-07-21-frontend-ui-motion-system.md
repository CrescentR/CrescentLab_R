# 前端 UI + 动效系统方案

> 日期：2026-07-21
> 范围：前台首页 + 登录页 + 后台管理界面
> 前置文档：`docs/develop-guides/design.md`、`docs/vibe/2026-07-20-frontend-motion-components.md`

---

## 1. 现状诊断

### 1.1 当前问题

| 问题 | 现状 | 影响 |
|---|---|---|
| 动效语言不统一 | Motion 的 `revealGroup/revealItem` 和 GSAP `from()` 混用，入场节奏不一致 | 首页各区块"各动各的"，缺乏整体感 |
| 登录页与首页脱节 | 登录页用浅色 token，首页用深色 lab token，视觉断裂 | 用户从首页进入登录页像换了一个产品 |
| 后台零动效 | AdminShell 路由切换、侧栏激活、卡片交互全部无过渡 | 后台操作感受生硬 |
| 无页面过渡 | Next.js 路由切换瞬间替换，无 fade/slide | 体验割裂 |
| 无统一微交互 | 按钮、输入框、卡片的 hover/press/focus 各写各的 | 维护成本高，一致性差 |
| 无加载态 | 无 skeleton/shimmer，数据请求时页面空白 | 感知性能差 |
| 实验观测台过重 | scroll-pinned timeline + 多层 signal 动画，移动端完全禁用 | 桌面端可能 janky，移动端体验空洞 |
| reduced-motion 碎片化 | 每个组件各自判断 `prefers-reduced-motion`，逻辑分散 | 容易遗漏 |

### 1.2 保留的优势

- 深色 lab 视觉语言（`lab-home.css`）辨识度高，月牙核心 R3F 效果有记忆点
- Motion + GSAP + Lenis 技术栈已跑通，无需更换
- CSS 变量体系（light/dark 双主题）已建立
- `motionConfig.ts` 已有基础 variant 抽象，可在此基础上统一

---

## 2. 设计目标

1. **统一动效语言**：所有入场、悬停、过渡使用同一套时长/缓动/位移 token
2. **前后台视觉连贯**：登录页改为深色 lab 风格，后台保留浅色但增加动效
3. **页面过渡**：路由切换有 fade 过渡，不造成布局偏移
4. **微交互系统**：按钮、卡片、输入框有统一的 hover/press/focus 动效
5. **加载态**：数据区域有 skeleton 占位
6. **性能底线**：所有动效支持 `prefers-reduced-motion`，移动端自动降级
7. **可维护**：动效配置集中在 `motionConfig.ts` + CSS 变量，不在组件内散落魔法数字

---

## 3. 动效 Token 体系

### 3.1 时长与缓动

在 `motionConfig.ts` 中定义统一的动效 token：

```typescript
// 时长（毫秒）
export const duration = {
  fast: 0.18,      // 微交互：hover、press、focus
  normal: 0.32,    // 常规过渡：面板展开、tab 切换
  slow: 0.64,      // 入场动画：reveal、page transition
  slower: 0.96,    // 大面积入场：hero、首屏
} as const;

// 缓动曲线
export const easing = {
  // 主力缓动：快速启动、柔和停止
  standard: [0.22, 1, 0.36, 1] as const,
  // 入场专用：略带弹性
  enter: [0.16, 1, 0.3, 1] as const,
  // 退出专用：加速离场
  exit: [0.4, 0, 1, 1] as const,
  // 强调：弹簧感
  emphasis: [0.34, 1.56, 0.64, 1] as const,
} as const;
```

在 `globals.css` 和 `lab-home.css` 中同步为 CSS 自定义属性：

```css
:root {
  --motion-fast: 180ms;
  --motion-normal: 320ms;
  --motion-slow: 640ms;
  --motion-slower: 960ms;
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

### 3.2 入场 Variant

统一替换现有 `revealItem`/`revealGroup`，所有区块入场使用同一套：

```typescript
// 向上淡入（默认）
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.enter } },
};

// 向左淡入（侧栏、横向列表）
export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: easing.enter } },
};

// 纯淡入（图片、大块内容）
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.slow, ease: easing.enter } },
};

// 缩放淡入（卡片、模态框）
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.normal, ease: easing.enter } },
};

// 父容器：错落入场
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

// 视口配置
export const viewport = { once: true, amount: 0.2 } as const;
```

### 3.3 微交互 Variant

```typescript
// 按钮 press
export const buttonPress = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.98 },
  transition: { duration: duration.fast, ease: easing.standard },
};

// 卡片 hover
export const cardHover = {
  whileHover: { y: -4 },
  transition: { duration: duration.fast, ease: easing.standard },
};
```

---

## 4. 页面过渡

### 4.1 方案：Next.js Template + Motion

利用 Next.js App Router 的 `template.tsx`（每次路由切换都会重新挂载）实现 fade 过渡：

**`frontend/src/app/template.tsx`**

```tsx
"use client";

import { motion } from "motion/react";
import { easing, duration } from "@/components/home/motionConfig";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: duration.normal, ease: easing.standard }}
    >
      {children}
    </motion.div>
  );
}
```

- 只做 opacity 过渡，不做 transform，避免布局偏移
- `prefers-reduced-motion` 下由 `MotionConfig reducedMotion="user"` 自动跳过

### 4.2 首页内部过渡

首页各 section 之间的入场保持 Motion `whileInView`，但统一使用 `fadeUp` + `stagger`，不再混用 GSAP `from()`。

---

## 5. 前台首页动效重构

### 5.1 动效分层

| 层级 | 组件 | 动效 | 技术 |
|---|---|---|---|
| L0 品牌核心 | CrescentCore (R3F) | 悬停活性、拖动回弹 | R3F + GSAP |
| L1 Hero 入场 | 标题、描述、按钮、读数 | BlurText 分词 + fadeUp 错落 | Motion |
| L2 滚动进度 | Header 底部进度条 | scaleX 跟随滚动 | GSAP ScrollTrigger |
| L3 区块入场 | 正在构建 / 实验 / 项目 / 笔记 | fadeUp + stagger | Motion whileInView |
| L4 卡片悬停 | BuildCard / ProjectCard | y 轴抬升 + CSS 追光 | Motion + CSS |
| L5 实验观测台 | 滚动固定时间线 | panel 切换 + signal | GSAP ScrollTrigger |

### 5.2 重构要点

**Header**：保留现有 GSAP 进度条，将 scrolled 状态切换从 Motion `useScroll` 改为原生 scroll 事件 + CSS class，减少 Motion 依赖。

**Hero**：
- 保留 BlurText 分词入场
- 将 `revealGroup`/`revealItem` 替换为 `stagger`/`fadeUp`
- 月牙核心入场用 `scaleIn`
- 读数区域用 `fadeUp` + 更大 delay

**NowBuilding**：
- 保留 GSAP 指针追光（CSS 变量驱动，性能好）
- 将 `whileHover` 3D 倾斜改为更克制的 `y: -4`（3D tilt 在某些设备上闪烁）
- 卡片入场用 `stagger` + `fadeUp`

**ExperimentsSection**：
- 桌面端保留 scroll-pinned timeline，但简化 signal 动画层（从 3 层减为 1 层）
- 移动端：当前完全禁用，改为静态 `fadeUp` 入场列表，不再空白
- 将 GSAP `from()` 移动端分支替换为 Motion `whileInView`

**LabProjects / LabNotes**：
- 统一用 `fadeUp` + `stagger`
- 项目卡片悬停保留 CSS 追光，去掉 3D tilt

### 5.3 移动端降级策略

当前移动端（`pointer: coarse`）禁用 Lenis 和大部分 GSAP。改为：

| 动效 | 桌面 | 移动 |
|---|---|---|
| Lenis 平滑滚动 | ✅ | ❌ |
| 滚动进度条 | ✅ | ❌ |
| 卡片 3D 倾斜 | ✅ | ❌ |
| 指针追光 | ✅ | ❌ |
| 入场 fadeUp | ✅ | ✅（保留，用 Motion whileInView） |
| BlurText | ✅ | ✅（保留） |
| 实验观测台 pin | ✅ | ❌（降级为静态列表） |

核心原则：移动端去掉的是"交互驱动"动效（追光、倾斜、pin），保留"入场"动效（fadeUp、BlurText），让移动端不空洞。

---

## 6. 登录页重构

### 6.1 目标

将登录页从浅色 editorial 风格改为深色 lab 风格，与首页视觉连贯。

### 6.2 视觉方案

- 背景：`var(--lab-bg)` + 微弱网格 + 月牙核心静态预览（左上角或右侧）
- 卡片：`var(--lab-card)` + `var(--lab-line)` 边框 + `var(--shadow-soft)`
- 输入框：`var(--lab-card-raised)` 背景，focus 时 `var(--lab-blue)` 光晕
- 按钮：primary 用 `var(--lab-violet)`，hover 抬升 + 阴影
- 品牌标识：复用 `.lab-crescent-mark`

### 6.3 动效

- 卡片入场：`scaleIn`（从 0.96 缩放淡入）
- 输入框 focus：`box-shadow` 过渡，`--motion-fast`
- 按钮：`buttonPress`（hover 抬升 + tap 缩放）
- 错误提示：Motion `AnimatePresence` + `fadeUp`，出入有过渡
- Loading 状态：`Loader2` 旋转 + 按钮 `opacity` 降低

### 6.4 布局

```
┌─────────────────────────────────────┐
│                          [月牙标记]  │
│                                     │
│         ┌───────────────┐           │
│         │  CRESCENT LAB │           │
│         │  登录          │           │
│         │               │           │
│         │  [用户名]      │           │
│         │  [密码]        │           │
│         │  [错误提示]    │           │
│         │  [登录按钮]    │           │
│         │               │           │
│         │  ← 返回前台    │           │
│         └───────────────┘           │
│                                     │
│         CORE / 00  UTC+08:00       │
└─────────────────────────────────────┘
```

---

## 7. 后台管理界面动效

### 7.1 设计原则

后台是工具，动效服务于"状态反馈"和"空间感知"，不追求品牌表现力。所有动效用 `--motion-fast`（180ms），不超过 `--motion-normal`（320ms）。

### 7.2 侧栏导航

**激活态指示器**：当前用 `border + bg` 静态切换。改为 Motion `layoutId` 共享布局动画，激活背景在导航项之间滑动：

```tsx
{navItems.map((item) => {
  const active = isActive(item);
  return (
    <Link key={item.href} className="relative" href={item.href}>
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-[var(--radius)] bg-[var(--cyan-soft)] border border-[var(--cyan)]"
          transition={{ duration: duration.fast, ease: easing.standard }}
        />
      )}
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
})}
```

### 7.3 内容区域

**页面入场**：路由切换后内容区 `fadeUp`（`duration.normal`），与 `template.tsx` 的 fade 叠加，形成层次感。

**卡片入场**：Dashboard 卡片用 `stagger` + `scaleIn`，错落入场。

**表格行入场**：列表数据加载后，行用 `stagger` + `fadeUp`（每行 30ms 间隔，最多前 10 行）。

### 7.4 交互反馈

| 元素 | hover | press | focus |
|---|---|---|---|
| 按钮 | `y: -2` + 阴影增强 | `scale: 0.98` | `box-shadow` 光晕 |
| 卡片 | `y: -4` + 边框变亮 | — | — |
| 输入框 | 边框变亮 | — | `box-shadow` 光晕 |
| 导航项 | 背景色过渡 | — | — |

### 7.5 加载态

**Skeleton 组件**：在 `components/ui/` 新增 `Skeleton`：

```tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius)] bg-[var(--surface-field)]", className)}
    />
  );
}
```

Dashboard 数据区域在加载时显示 skeleton，数据到达后用 `AnimatePresence` + `fadeIn` 替换。

### 7.6 Toast 通知

在 `components/ui/` 新增 `Toast` 组件，用于操作反馈（保存成功、删除失败等）：

- 右下角弹出
- Motion `AnimatePresence` 控制出入
- 入：`fadeUp` + `scaleIn`
- 出：`fadeRight` + `opacity`
- 自动消失 3s

---

## 8. reduced-motion 统一策略

### 8.1 全局配置

在 `HomeClient` 已有 `<MotionConfig reducedMotion="user">`。将此配置提升到 `app/layout.tsx` 根布局，覆盖所有页面：

```tsx
// app/layout.tsx
<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

这样所有 Motion 组件在 `prefers-reduced-motion: reduce` 时自动跳过 transform/opacity 动画。

### 8.2 GSAP 降级

所有 GSAP 调用统一使用 `gsap.matchMedia()` 模式：

```typescript
const media = gsap.matchMedia();
media.add("(prefers-reduced-motion: no-preference)", () => {
  // 动效代码
});
return () => media.revert();
```

### 8.3 CSS 降级

在 `globals.css` 和 `lab-home.css` 末尾保留全局降级：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

---

## 9. 实施清单

### 批次 1：动效 Token 基建（预计 0.5 天）

- [ ] 在 `motionConfig.ts` 中定义 `duration`、`easing`、`fadeUp`、`fadeIn`、`scaleIn`、`stagger`、`viewport`、`buttonPress`、`cardHover`
- [ ] 在 `globals.css` 和 `lab-home.css` 中添加 `--motion-*` 和 `--ease-*` CSS 变量
- [ ] 在 `app/layout.tsx` 中添加 `<MotionConfig reducedMotion="user">`
- [ ] 创建 `app/template.tsx` 实现页面 fade 过渡
- [ ] 删除旧的 `revealItem`/`revealGroup`，替换为新的统一 variant

### 批次 2：首页动效统一（预计 1 天）

- [ ] Hero：替换 variant，保留 BlurText
- [ ] NowBuilding：替换 variant，保留 GSAP 追光，去掉 3D tilt
- [ ] ExperimentsSection：简化 signal 层，移动端改为 Motion `whileInView` 静态列表
- [ ] LabProjects：替换 variant，保留 CSS 追光
- [ ] LabNotes：替换 variant
- [ ] Header：scrolled 状态改用原生 scroll + CSS class

### 批次 3：登录页重构（预计 0.5 天）

- [ ] 登录页改为深色 lab 风格
- [ ] 卡片 `scaleIn` 入场
- [ ] 输入框 focus 光晕
- [ ] 错误提示 `AnimatePresence` + `fadeUp`
- [ ] 按钮 `buttonPress`

### 批次 4：后台动效（预计 1 天）

- [ ] 侧栏 `layoutId` 激活指示器
- [ ] 内容区 `fadeUp` 入场
- [ ] Dashboard 卡片 `stagger` + `scaleIn`
- [ ] 新增 `Skeleton` 组件
- [ ] 新增 `Toast` 组件
- [ ] 按钮/输入框微交互统一

### 批次 5：验证（预计 0.5 天）

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 通过
- [ ] Docker 启动，浏览器视口验证首页/登录/后台
- [ ] 验证 `prefers-reduced-motion` 降级
- [ ] 验证移动端布局和入场动效
- [ ] 更新 `changelog.md`

---

## 10. 文件影响范围

| 文件 | 改动类型 |
|---|---|
| `frontend/src/components/home/motionConfig.ts` | 重写：新增 token 体系 |
| `frontend/src/app/layout.tsx` | 修改：添加 MotionConfig |
| `frontend/src/app/template.tsx` | 新增：页面过渡 |
| `frontend/src/app/globals.css` | 修改：添加 CSS 动效变量 |
| `frontend/src/app/lab-home.css` | 修改：添加 CSS 动效变量 |
| `frontend/src/components/home/labHero.tsx` | 修改：替换 variant |
| `frontend/src/components/home/nowBuildingSection.tsx` | 修改：替换 variant，去掉 3D tilt |
| `frontend/src/components/home/experimentsSection.tsx` | 修改：简化 signal，移动端改 Motion |
| `frontend/src/components/home/labProjects.tsx` | 修改：替换 variant |
| `frontend/src/components/home/labNotes.tsx` | 修改：替换 variant |
| `frontend/src/components/home/labHeader.tsx` | 修改：scrolled 改原生 scroll |
| `frontend/src/app/login/page.tsx` | 重写：深色 lab 风格 + 动效 |
| `frontend/src/components/admin/adminShell.tsx` | 修改：layoutId 导航 + 入场动效 |
| `frontend/src/components/ui/skeleton.tsx` | 新增 |
| `frontend/src/components/ui/toast.tsx` | 新增 |
| `docs/develop-guides/changelog.md` | 更新 |

---

## 11. 不做的事

- **不更换技术栈**：Motion + GSAP + Lenis 保持不变
- **不增加新依赖**：不引入 Framer Motion Three、React Spring 等
- **不改后端 API**：纯前端改动
- **不改首页内容结构**：区块顺序、文案、数据不变
- **不做暗色后台**：后台保持浅色 editorial 风格，只加动效
- **不做 R3F 重构**：月牙核心保留现有实现
- **不做 i18n 动效切换**：动效不随语言变化
