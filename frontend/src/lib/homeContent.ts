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
      message: "新文章整理了一个本地知识库如何从草稿、项目记录和公开页面之间流动。",
      href: "#activity",
      actionLabel: "看记录",
    },
    hero: {
      eyebrow: "本周主线",
      title: "本地优先的知识库，为什么仍然需要一套清晰的发布秩序。",
      description:
        "从 Obsidian 草稿、Git 里的开发记录，到最终公开的长文和项目日志，最难的不是保存更多内容，而是让每一条记录知道自己下一步该去哪里。",
      primaryAction: { label: "开始阅读", href: "#articles" },
      secondaryAction: { label: "看项目", href: "#labs" },
      coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=84",
      coverAlt: "明亮桌面上的笔记本、植物和写作工具",
      notes: ["写作入口", "项目子站", "实验记录"],
    },
    feature: {
      label: "本周笔记",
      title: "把草稿整理到可以引用的程度。",
      description:
        "这一期记录聚焦三件事：命名要稳定，入口要少，旧结论要能被新证据替换。只有做到这些，笔记才不会在几个月后变成只剩标题的仓库。",
      meta: "Issue 03 / 2026",
      stats: [
        { label: "文章", value: "24" },
        { label: "项目", value: "03" },
        { label: "记录", value: "128" },
      ],
    },
    categories: [
      { label: "文库", detail: "长文、札记与专题", href: "#articles", icon: "book", tone: "blue" },
      { label: "项目", detail: "路线图、版本与日志", href: "#labs", icon: "compass", tone: "green" },
      { label: "灵感", detail: "阅读摘录与日常观察", href: "#activity", icon: "spark", tone: "amber" },
    ],
    articles: articleSummaries,
    projects: projectSites,
    modules: sharedLabModules,
    activities: labActivities,
  };
}
