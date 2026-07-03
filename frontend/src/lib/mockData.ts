import type { AdminUser, ArticleSummary, LabActivity, LabModule, ProjectSite } from "@/types/content";

export const articleSummaries: ArticleSummary[] = [
  {
    id: "content-as-lab-entrance",
    title: "把个人项目写成一座可以进入的小站",
    excerpt: "从一篇主线文章出发，把背景、路线图、版本记录、截图和相关笔记组织成一个轻量子站。",
    category: "Labs CMS",
    status: "published",
    updatedAt: "今天",
    readTime: "7 min",
    kicker: "主线文章",
    linkedProject: "CrescentLab",
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=82",
    coverAlt: "桌面上的笔记本、咖啡和写作工具",
  },
  {
    id: "article-first-information-architecture",
    title: "文章优先的信息架构，不等于只有博客",
    excerpt: "首页先给读者一个可进入的中心，再把项目、实验、相册和后台能力挂到内容脉络上。",
    category: "Information Architecture",
    status: "draft",
    updatedAt: "2h ago",
    readTime: "6 min",
    kicker: "设计笔记",
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=82",
    coverAlt: "屏幕上的界面草图和工作笔记",
  },
  {
    id: "quiet-admin-tools",
    title: "安静但高密度的个人 CMS 后台",
    excerpt: "后台不是展示页，它要让写作、媒体、项目页和发布队列都能被持续维护。",
    category: "Product",
    status: "scheduled",
    updatedAt: "明天",
    readTime: "4 min",
    kicker: "后台思考",
    coverImage: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=82",
    coverAlt: "便签、日程和文档组成的工作台",
  },
  {
    id: "storage-policy-playbook",
    title: "媒体与项目资产的存储策略",
    excerpt: "当项目子站需要截图、封面、附件和 changelog，存储策略必须先被内容模型看见。",
    category: "Infrastructure",
    status: "published",
    updatedAt: "昨天",
    readTime: "8 min",
    kicker: "技术札记",
    coverImage: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=900&q=82",
    coverAlt: "明亮桌面上的显示器和资料",
  },
];

export const projectSites: ProjectSite[] = [
  {
    id: "crescentlab",
    title: "CrescentLab",
    subtitle: "个人 Labs CMS",
    description: "当前主项目。它把博客、项目子站、实验记录和后台工作台收束到同一套内容系统里。",
    category: "CMS",
    status: "building",
    tone: "cyan",
    updatedAt: "本周更新",
    href: "#labs",
    sections: ["愿景", "路线图", "系统设计"],
  },
  {
    id: "prompt-foundry",
    title: "Prompt Foundry",
    subtitle: "提示词与工作流仓库",
    description: "用项目页承载方法论、案例、版本和关联文章，避免再单独搭一座介绍站。",
    category: "Knowledge Base",
    status: "research",
    tone: "purple",
    updatedAt: "整理中",
    href: "#labs",
    sections: ["案例", "模板", "实验记录"],
  },
  {
    id: "atelier-index",
    title: "Atelier Index",
    subtitle: "作品与工具索引",
    description: "把零散工具、设计稿、演示链接和开发日志组织成可持续维护的公开页面。",
    category: "Portfolio",
    status: "live",
    tone: "green",
    updatedAt: "已公开",
    href: "#labs",
    sections: ["工具", "截图", "更新日志"],
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
    title: "阅读中心",
    description: "文章、归档、标签、专题和公开页面构成站点的第一入口。",
    tone: "cyan",
    status: "公开访问",
  },
  {
    id: "project-sites",
    title: "项目子站",
    description: "每个项目都可以像文章一样发布，又拥有独立的介绍、路线图和更新记录。",
    tone: "purple",
    status: "内容对象",
  },
  {
    id: "lab-log",
    title: "实验记录",
    description: "把开发片段、相册、友链、音乐页和临时想法沉淀成可检索的 Lab 信号。",
    tone: "amber",
    status: "探索入口",
  },
];

export const memberLabModules: LabModule[] = [
  {
    id: "profile",
    title: "个人资料",
    description: "维护昵称、头像、站点链接和通知偏好。",
    tone: "purple",
    status: "普通用户",
  },
  {
    id: "subscriptions",
    title: "订阅线索",
    description: "订阅新文章、项目更新、评论回复和精选专题推送。",
    tone: "rose",
    status: "可配置",
  },
  {
    id: "admin-locked",
    title: "后台控制台",
    description: "后台入口需要管理员身份，普通用户只能访问公开内容和个人中心。",
    tone: "neutral",
    status: "无权限",
    adminOnly: true,
  },
];

export const adminLabModules: LabModule[] = [
  {
    id: "admin-console",
    title: "后台控制台",
    description: "进入后台管理文章、项目子站、评论、用户、主题、插件和系统配置。",
    tone: "purple",
    status: "管理员",
    adminOnly: true,
  },
  {
    id: "content-ops",
    title: "内容运营",
    description: "维护发布排程、版本历史、SEO、搜索索引和导入导出任务。",
    tone: "cyan",
    status: "可执行",
  },
  {
    id: "system-lab",
    title: "系统实验室",
    description: "配置存储策略、定时任务、通知投递、备份和插件运行状态。",
    tone: "amber",
    status: "高权限",
    adminOnly: true,
  },
];

export const labActivities: LabActivity[] = [
  {
    id: "project-page-draft",
    title: "Prompt Foundry 子站草稿已创建",
    detail: "新增愿景、案例、模板和版本记录四个区块，等待补充截图资产。",
    time: "12 min ago",
    tone: "purple",
  },
  {
    id: "homepage-focus",
    title: "首页聚焦到主线文章",
    detail: "公开页不再平铺所有模块，而是用主推文章串起项目子站和实验动态。",
    time: "today",
    tone: "cyan",
  },
  {
    id: "storage-sync",
    title: "项目媒体存储策略完成同步",
    detail: "封面、截图和附件将和文章媒体共用一套资产管理边界。",
    time: "昨天",
    tone: "green",
  },
  {
    id: "publish-queue",
    title: "两篇文章进入发布队列",
    detail: "其中一篇关联 CrescentLab 项目页，发布后会出现在子站更新记录中。",
    time: "本周",
    tone: "amber",
  },
];

export const adminMetrics = [
  { label: "Content Nodes", value: "128", trend: "+18%", tone: "cyan" },
  { label: "Project Sites", value: "03", trend: "new", tone: "purple" },
  { label: "Queued Jobs", value: "7", trend: "2 urgent", tone: "amber" },
  { label: "Role Policies", value: "24", trend: "+3", tone: "green" },
] as const;

export const contentPipeline = [
  { label: "Ideas", value: 18, tone: "cyan" },
  { label: "Drafting", value: 12, tone: "purple" },
  { label: "Review", value: 5, tone: "amber" },
  { label: "Published", value: 93, tone: "green" },
] as const;
