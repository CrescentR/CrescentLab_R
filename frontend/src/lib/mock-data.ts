import type { AdminUser, ArticleSummary, LabActivity, LabModule } from "@/types/content";

export const articleSummaries: ArticleSummary[] = [
  {
    id: "architecting-the-moonlit-lab",
    title: "Architecting the Moonlit Lab",
    excerpt: "A focused look at glassmorphic CMS workflows, editorial metadata, and high-fidelity typography.",
    category: "Design Systems",
    status: "draft",
    updatedAt: "just now",
    readTime: "6 min",
  },
  {
    id: "storage-policy-playbook",
    title: "Storage Policy Playbook",
    excerpt: "How local storage, object storage, and OneDrive policies can share a single authoring surface.",
    category: "Infrastructure",
    status: "published",
    updatedAt: "2h ago",
    readTime: "8 min",
  },
  {
    id: "quiet-admin-tools",
    title: "Quiet Admin Tools",
    excerpt: "Design notes for dense operational screens that stay legible during repeated daily use.",
    category: "Product",
    status: "scheduled",
    updatedAt: "tomorrow",
    readTime: "4 min",
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: "admin",
    name: "Admin User",
    email: "admin@crescentlab.io",
    role: "super admin",
    status: "active",
    lastLogin: "Just now",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    email: "schen@crescentlab.io",
    role: "editor",
    status: "active",
    lastLogin: "2h ago",
  },
  {
    id: "alex",
    name: "Alex Mercer",
    email: "alex.m@external.io",
    role: "author",
    status: "offline",
    lastLogin: "3d ago",
  },
];

export const sharedLabModules: LabModule[] = [
  {
    id: "reading-room",
    title: "Reading Room",
    description: "阅读文章、归档、标签、专题和公开页面。",
    tone: "cyan",
    status: "公开访问",
  },
  {
    id: "comment-lab",
    title: "Comment Lab",
    description: "发表评论、查看回复、管理自己的互动痕迹。",
    tone: "green",
    status: "用户共有",
  },
  {
    id: "album-wall",
    title: "Album Wall",
    description: "浏览相册、图片集合、音乐页和友链实验区。",
    tone: "amber",
    status: "内容探索",
  },
];

export const memberLabModules: LabModule[] = [
  {
    id: "profile",
    title: "Profile Capsule",
    description: "维护昵称、头像、站点链接和通知偏好。",
    tone: "purple",
    status: "普通用户",
  },
  {
    id: "subscriptions",
    title: "Signal Subscriptions",
    description: "订阅新文章、评论回复和精选专题推送。",
    tone: "rose",
    status: "可配置",
  },
  {
    id: "admin-locked",
    title: "Admin Console",
    description: "后台控制台需要管理员身份，普通用户不可进入。",
    tone: "neutral",
    status: "无权限",
    adminOnly: true,
  },
];

export const adminLabModules: LabModule[] = [
  {
    id: "admin-console",
    title: "Admin Console",
    description: "进入后台、管理文章、评论、用户、插件和主题。",
    tone: "purple",
    status: "管理员",
    adminOnly: true,
  },
  {
    id: "content-ops",
    title: "Content Ops",
    description: "发布排程、版本历史、SEO、搜索索引和导入导出。",
    tone: "cyan",
    status: "可执行",
  },
  {
    id: "system-lab",
    title: "System Lab",
    description: "存储策略、定时任务、通知投递和配置备份。",
    tone: "amber",
    status: "高权限",
    adminOnly: true,
  },
];

export const labActivities: LabActivity[] = [
  {
    id: "publish-queue",
    title: "发布队列已预热",
    detail: "2 篇 scheduled 文章等待定时任务扫描。",
    time: "2 min ago",
    tone: "cyan",
  },
  {
    id: "storage-sync",
    title: "存储策略完成同步",
    detail: "Local、S3、OneDrive 三类策略使用同一文件面板。",
    time: "18 min ago",
    tone: "green",
  },
  {
    id: "theme-market",
    title: "主题实验位已启用",
    detail: "当前原型预留主题商城、配置 Schema 和用户覆盖值。",
    time: "1 h ago",
    tone: "purple",
  },
  {
    id: "friend-links",
    title: "友链健康检查完成",
    detail: "12 个站点可用，1 个站点进入 warning 状态。",
    time: "today",
    tone: "amber",
  },
];

export const adminMetrics = [
  { label: "Content Nodes", value: "128", trend: "+18%", tone: "cyan" },
  { label: "Live Modules", value: "11", trend: "stable", tone: "green" },
  { label: "Queued Jobs", value: "7", trend: "2 urgent", tone: "amber" },
  { label: "Role Policies", value: "24", trend: "+3", tone: "purple" },
] as const;

export const contentPipeline = [
  { label: "Ideas", value: 18, tone: "cyan" },
  { label: "Drafting", value: 12, tone: "purple" },
  { label: "Review", value: 5, tone: "amber" },
  { label: "Published", value: 93, tone: "green" },
] as const;
