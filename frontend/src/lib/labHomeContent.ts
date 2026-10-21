import { articleSummaries, projectSites } from "@/lib/mockData";

/** 札记与长文统一收在笔记，品牌链接返回首页。 */
export const labNavigation = [
  { label: "笔记", href: "/notes" },
  { label: "项目", href: "/projects" },
  { label: "关于", href: "/about" },
] as const;

export const labProjects = projectSites;
export const labNotes = articleSummaries;
