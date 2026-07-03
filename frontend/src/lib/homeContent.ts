import { articleSummaries, labActivities, projectSites, sharedLabModules } from "@/lib/mockData";
import type { HomeContent } from "@/types/home";

export function getHomeContent(): HomeContent {
  return {
    navItems: [
      { label: "文库", href: "#articles" },
      { label: "项目", href: "#labs" },
      { label: "记录", href: "#activity" },
      { label: "友链", href: "#signals" },
      { label: "关于", href: "#about" },
    ],
    announcement: {
      label: "今日",
      message: "正在把首页从“模板感展示页”改成更像自己的内容工作台。",
      href: "#activity",
      actionLabel: "看记录",
    },
    hero: {
      eyebrow: "Crescent 的公开工作台",
      title: "把文章、项目和生活灵感，整理成一条能继续生长的线。",
      description:
        "CrescentLab 不是单纯的博客首页，而是一套个人内容系统：读者从文章进入，再顺着项目、实验记录和维护动态理解一个想法如何长出来。",
      primaryAction: { label: "开始阅读", href: "#articles" },
      secondaryAction: { label: "看项目", href: "#labs" },
      coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=84",
      coverAlt: "明亮桌面上的笔记本、植物和写作工具",
      notes: ["写作入口", "项目子站", "实验记录"],
    },
    feature: {
      label: "本周维护",
      title: "先写清楚，再做漂亮。",
      description:
        "新的首页会把个人判断、项目进度和日常输入放在同一张版面里。颜色可以活泼，但不靠发光渐变撑场面。",
      meta: "Issue 03 / Summer",
      stats: [
        { label: "文章", value: "24" },
        { label: "项目", value: "03" },
        { label: "记录", value: "128" },
      ],
    },
    categories: [
      { label: "文库", detail: "主线文章与札记", href: "#articles", icon: "book", tone: "blue" },
      { label: "项目", detail: "正在做的东西", href: "#labs", icon: "compass", tone: "green" },
      { label: "灵感", detail: "生活与观察", href: "#activity", icon: "spark", tone: "amber" },
    ],
    articles: articleSummaries,
    projects: projectSites,
    modules: sharedLabModules,
    activities: labActivities,
  };
}
