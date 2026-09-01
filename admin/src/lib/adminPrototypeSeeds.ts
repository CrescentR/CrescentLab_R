import type { PrototypeItem } from "@/components/admin/adminPrototypeWorkbench";

const now = () => new Date().toISOString();

export const mediaPrototypeSeed: PrototypeItem[] = [
  {
    id: "media_1",
    title: "hero-crescent.jpg",
    summary: "首页 Hero 背景图 · image/jpeg · 1.8 MB",
    status: "ready",
    updatedAt: now(),
  },
  {
    id: "media_2",
    title: "notes-cover-01.webp",
    summary: "笔记封面候选 · image/webp · 420 KB",
    status: "ready",
    updatedAt: now(),
  },
  {
    id: "media_3",
    title: "demo-upload.zip",
    summary: "项目产物压缩包 · application/zip · 待校验",
    status: "processing",
    updatedAt: now(),
  },
];

export const commentsPrototypeSeed: PrototypeItem[] = [
  {
    id: "comment_1",
    title: "关于阅读体验的反馈",
    summary: "文章《写下来的思考》· 访客 · “排版很舒服，希望支持目录。”",
    status: "pending",
    updatedAt: now(),
  },
  {
    id: "comment_2",
    title: "项目演示页建议",
    summary: "项目页 · 登录用户 · “能否增加版本对比？”",
    status: "approved",
    updatedAt: now(),
  },
  {
    id: "comment_3",
    title: "疑似垃圾评论",
    summary: "外链刷量评论，建议直接隐藏。",
    status: "spam",
    updatedAt: now(),
  },
];

export const pluginsPrototypeSeed: PrototypeItem[] = [
  {
    id: "plugin_1",
    title: "阅读进度条",
    summary: "文章详情页顶部进度，可配置颜色与灵敏度。",
    status: "enabled",
    updatedAt: now(),
  },
  {
    id: "plugin_2",
    title: "评论反垃圾",
    summary: "关键词过滤 + 链接密度检查（原型开关）。",
    status: "disabled",
    updatedAt: now(),
  },
];

export const themesPrototypeSeed: PrototypeItem[] = [
  {
    id: "theme_1",
    title: "Paper Sage",
    summary: "当前默认浅色纸感主题，苔绿强调色。",
    status: "active",
    updatedAt: now(),
  },
  {
    id: "theme_2",
    title: "Moonlit Console",
    summary: "早期暗色实验室主题，保留为可选切换雏形。",
    status: "available",
    updatedAt: now(),
  },
];

export const usersPrototypeSeed: PrototypeItem[] = [
  {
    id: "user_1",
    title: "admin",
    summary: "站点管理员 · 可进入后台全部模块",
    status: "admin",
    updatedAt: now(),
  },
  {
    id: "user_2",
    title: "guest.reader",
    summary: "普通读者 · 可评论与维护个人资料（规划中）",
    status: "member",
    updatedAt: now(),
  },
  {
    id: "user_3",
    title: "invite.pending",
    summary: "待激活邀请账号",
    status: "invited",
    updatedAt: now(),
  },
];

