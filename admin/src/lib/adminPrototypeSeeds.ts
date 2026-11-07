import type { PrototypeItem } from "@/components/admin/adminPrototypeWorkbench";

const now = () => new Date().toISOString();

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

