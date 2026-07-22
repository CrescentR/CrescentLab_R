# 前端动效组件优化

## 目标

在不改变首页内容结构和后台页面的前提下，引入 React Bits 组件，并参考 Uiverse Galaxy 的视觉语言，使用项目现有 GSAP 能力强化首页的品牌动效。

## 范围

- 使用 `npx shadcn@latest add @react-bits/BlurText-TS-TW` 安装 React Bits BlurText，并保留 React Bits registry 配置，方便后续按需添加组件。
- 将 BlurText 用于首页 Hero 主标题。
- 为“正在构建”卡片增加 GSAP 指针追光和渐变玻璃层。
- 为固定导航增加 GSAP 滚动进度能量条。
- 强化主要按钮的悬浮层级，但不改变链接目标和内容数据。
- 不修改后台页面、API、接口数据或后端代码。

## 参考

- React Bits：<https://github.com/DavidHDev/react-bits>
- Uiverse Galaxy：<https://github.com/uiverse-io/galaxy>
- Galaxy 渐变玻璃卡片参考：`Cards/adamgiebl_blue-mole-92.html`
- Galaxy 悬浮抬升交互参考：`Buttons/0xnihilism_quiet-dog-6.html`

## 验收标准

- Hero 标题分词模糊入场，中文内容与原有页面结构保持不变。
- 精细指针设备悬浮“正在构建”卡片时，追光位置跟随指针，卡片仍可正常响应布局。
- 页面滚动时，导航底部进度条同步更新。
- `prefers-reduced-motion` 下不执行新增的 GSAP 滚动和高频动画。
- 移动端布局无横向溢出，主要交互保持可用。
- 前端类型检查、Lint、生产构建和 Docker 页面验证通过。

## Checklist

- [x] 安装并接入 React Bits BlurText
- [x] 筛选并记录 Galaxy 参考组件
- [x] 实现 GSAP 卡片追光与滚动进度
- [x] 更新 changelog
- [x] 完成类型检查、Lint、生产构建
- [ ] 完成 Docker 页面验证（本机 Docker Desktop Server API 持续返回 500）
