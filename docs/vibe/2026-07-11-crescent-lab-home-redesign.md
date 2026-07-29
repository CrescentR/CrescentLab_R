# Crescent Lab 首页重构

> 日期：2026-07-11  
> 范围：公开首页 `/`  
> 主题：Moonlit Research Console / 月下数字实验室

## 1. 页面设计说明

首页被定义为个人技术实验室的实时档案，而不是简历或 SaaS 落地页。视觉体系使用大面积黑场、低对比细线、档案编号、局部冷光和少量暖色信号建立克制、神秘且精密的实验感。

信息层级从“身份与方法”开始，依次展示正在构建、实验档案、已经形成的项目和技术日志。Hero 保留充足负空间，右侧月牙是唯一复杂视觉核心；其他模块依靠网格、编号和排版建立识别，不堆叠玻璃或霓虹效果。

页面使用现有真实内容：Experiments 来自已有实验模块，Projects 来自已有项目记录，Notes 来自已有文章摘要。Now Building 仅展示需求明确给出的 QuickBox、NextVibe、Tarot Oracle 和 Crescent Blog，不补写未经确认的产品功能。

## 2. 组件目录结构

```text
frontend/src/
├── app/
│   ├── lab-home.css              # 首页 scoped Tokens、布局与视觉样式
│   └── page.tsx                  # 首页路由
├── components/home/
│   ├── homeClient.tsx            # MotionConfig 与 Lenis 生命周期
│   ├── labHeader.tsx             # 透明/滚动玻璃导航
│   ├── labHero.tsx               # Hero 内容与月牙舞台
│   ├── crescentCore.tsx          # WebGL 能力判断与静态降级
│   ├── crescentScene.tsx         # R3F 月牙、轨道与粒子
│   ├── nowBuildingSection.tsx    # Bento Grid
│   ├── experimentsSection.tsx    # 实验档案列表
│   ├── labProjects.tsx           # 错位项目与共享布局弹窗
│   ├── labNotes.tsx              # 实验日志时间线
│   ├── labFooter.tsx             # 轨道页脚
│   ├── sectionIntro.tsx          # 章节标题
│   └── motionConfig.ts           # 动效参数
└── lib/
    └── labHomeContent.ts         # 首页内容投影
```

## 3. Design Tokens

首页 Tokens 作用域限定在 `.lab-home`，不会改变后台现有主题：

| Token | 值 | 用途 |
|---|---:|---|
| `--lab-bg` | `#07070A` | 页面背景 |
| `--lab-card` | `#0E0F14` | 主卡片 |
| `--lab-card-raised` | `#12131A` | 弹窗表面 |
| `--lab-text` | `#F4F2ED` | 主文字 |
| `--lab-muted` | `#9296A3` | 次文字 |
| `--lab-violet` | `#8B7CFF` | 品牌紫 |
| `--lab-blue` | `#63D8FF` | 冷光蓝 |
| `--lab-warm` | `#FFB86B` | 暖色状态 |
| `--lab-line` | `rgba(244,242,237,.12)` | 普通分隔线 |
| `--lab-radius` | `18px` | 卡片圆角 |

## 4. 页面代码

首页路由保持 `HomeLayout → HomeClient` 的清晰入口。各页面模块拆分为同名组件，内容集中在 `labHomeContent.ts`，交互只放在需要客户端状态的组件中。

没有引入完整 shadcn 组件库：首页现有按钮和项目弹窗结构简单，直接实现可访问语义更小、更清楚，也避免为单个 Dialog 增加整套依赖。弹窗具备 `role="dialog"`、`aria-modal`、Escape 关闭、背景关闭和打开时滚动锁定。

## 5. 动效配置

- 页面/章节进入：`640ms`，位移 `18px`，`ease: [0.22, 1, 0.36, 1]`。
- 子元素 stagger：`80ms`，首批延迟 `60ms`。
- Hover：`240ms`；Bento 倾斜为 `±2deg`，不超过限制。
- 项目弹窗共享布局：`480ms`，不跳转路由，不做夸张缩放。
- 导航玻璃态：滚动超过 `28px` 后启用，过渡 `240ms`。
- Lenis：时长 `1.05s`，仅精细指针且未启用 reduced-motion 时运行。
- 循环动画：只有 R3F 月牙核心的一个 `useFrame`；页面背景和卡片没有持续循环动画。

## 6. 移动端降级方案

- `max-width: 767px` 或粗指针设备不创建 R3F Canvas，直接渲染 CSS 月牙。
- 手机端不启用 Lenis、粒子、鼠标跟随和滚动 3D 旋转。
- Bento、Experiments、Projects 和 Notes 在 640px 下改为单列。
- 项目弹窗改为单列详情区，最大高度 `88vh`。
- `prefers-reduced-motion` 下 Motion 保留内容可见性但移除位移，WebGL 与 Lenis 均关闭。

## 7. 性能优化说明

- Three.js/R3F 场景独立动态加载，静态首屏结构不依赖 WebGL 才能显示。
- Canvas 像素比限制在 `1–1.5`，粒子数量固定为 `54`，不使用 Bloom、阴影贴图或后处理。
- 月牙只使用基础几何体、两个点光源和一组 Points，不加载外部 3D 模型或纹理。
- 首页所有颜色与布局样式集中在独立 scoped CSS，避免运行时 CSS-in-JS。
- Motion 只动画 `opacity` 与 `transform`，Hover 时间不超过 `300ms`。
- 移除旧首页唯一使用的 GSAP，避免 Motion 与 GSAP 双运行时。

## 验收 Checklist

- [x] 第一阶段：结构、Tokens、静态响应式布局
- [x] 第二阶段：基础 Motion 与共享布局弹窗
- [x] 第三阶段：R3F 月牙、Lenis 与输入联动
- [x] 1440px 与 375px 无横向溢出
- [x] 手机端与 reduced-motion 不创建 Canvas
- [x] 最终 Lint / typecheck / build / Docker
