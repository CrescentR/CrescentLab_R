import { articleSummaries, projectSites } from "@/lib/mockData";

/** 顶部 tab 导航，顺序对应 PRD 的首页叙事：定位 → 正在做 → 如何验证 → 做成了什么 → 沉淀了什么 */
export const labNavigation = [
  { label: "首页", href: "/" },
  { label: "正在构建", href: "/building" },
  { label: "实验观测台", href: "/experiments" },
  { label: "项目", href: "/projects" },
  { label: "笔记", href: "/notes" },
  { label: "关于", href: "/about" },
] as const;

export const labProjects = projectSites;
export const labNotes = articleSummaries;
