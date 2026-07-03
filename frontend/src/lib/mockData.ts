import type { AdminUser, ArticleSummary, LabActivity, LabModule, ProjectSite } from "@/types/content";

export const articleSummaries: ArticleSummary[] = [
  {
    id: "content-as-lab-entrance",
    title: "一次重构前，我会先写下哪些不可变条件",
    excerpt: "记录本次整理内容系统前必须守住的边界：数据表不自动迁移、公开页不解释后台、文案只服务读者当下的阅读判断。",
    category: "Engineering Notes",
    status: "published",
    updatedAt: "今天",
    readTime: "7 min",
    kicker: "工程笔记",
    linkedProject: "Content System",
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=82",
    coverAlt: "桌面上的笔记本、咖啡和写作工具",
  },
  {
    id: "article-first-information-architecture",
    title: "公开页面里的每个入口，都应该回答一个明确问题",
    excerpt: "导航、专题、项目页和记录流分别承担什么任务，先写清楚，再决定哪些内容真的需要被放到首屏。",
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
    title: "给后台表单留出撤销、草稿和错误恢复的位置",
    excerpt: "一个人使用的 CMS 也会遇到误删、半成品和跨设备编辑，操作密度不能靠牺牲可恢复性换来。",
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
    title: "图片、附件和截图应该先归档，再进入文章",
    excerpt: "资产一旦被多篇文章引用，就不能只依赖编辑器里的临时上传路径；存储策略要能被审计和替换。",
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
    title: "最近阅读",
    description: "《Designing Data-Intensive Applications》第三章重读完成，正在补一份关于日志结构存储的中文摘记。",
    tone: "cyan",
    status: "读书笔记",
  },
  {
    id: "project-sites",
    title: "本周构建",
    description: "后台先接数据库连接和设置仓储，文章编辑器继续保持静态数据，等接口稳定后再切换读取来源。",
    tone: "purple",
    status: "开发日志",
  },
  {
    id: "lab-log",
    title: "待验证问题",
    description: "SQLite 开发库和 PostgreSQL 生产库的 JSON 字段差异需要单独测试，不能只靠 ORM 生成代码兜底。",
    tone: "amber",
    status: "技术债",
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
    title: "数据库连接层开始接入",
    detail: "先用配置中的 driver 和 dsn 打开连接，仓储层只对人工建好的表执行读写。",
    time: "12 min ago",
    tone: "purple",
  },
  {
    id: "homepage-focus",
    title: "首页文案完成第一轮清理",
    detail: "首屏、文章卡片和侧栏条目改为可长期展示的内容，不再解释页面本身的设计目的。",
    time: "today",
    tone: "cyan",
  },
  {
    id: "storage-sync",
    title: "设置表字段已按 schema 对齐",
    detail: "数据操作使用 scope、group_key、key、value、value_type、is_public、is_encrypted 和 description。",
    time: "昨天",
    tone: "green",
  },
  {
    id: "publish-queue",
    title: "两篇工程笔记进入整理队列",
    detail: "一篇写数据库边界，一篇写后台表单的保存、撤销和错误提示策略。",
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
