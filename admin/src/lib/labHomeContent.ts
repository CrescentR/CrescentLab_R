import { articleSummaries, projectSites } from "@/lib/mockData";

/** 顶部 tab 导航，顺序对应公开站的信息层级：定位 → 近期动态 → 项目 → 笔记 → 站点说明 */
export const labNavigation = [
  { label: "首页", href: "/" },
  { label: "动态", href: "/updates" },
  { label: "项目", href: "/projects" },
  { label: "笔记", href: "/notes" },
  { label: "关于", href: "/about" },
] as const;

export const labProjects = projectSites;
export const labNotes = articleSummaries;
