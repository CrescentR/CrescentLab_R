import { articleSummaries, projectSites, sharedLabModules } from "@/lib/mockData";

/** 顶部 tab 导航，顺序对应 PRD 的首页叙事：定位 → 正在做 → 如何验证 → 做成了什么 → 沉淀了什么 */
export const labNavigation = [
  { label: "首页", href: "/" },
  { label: "正在构建", href: "/building" },
  { label: "实验观测台", href: "/experiments" },
  { label: "项目", href: "/projects" },
  { label: "笔记", href: "/notes" },
  { label: "关于", href: "/about" },
] as const;

export const nowBuilding = [
  { id: "quickbox", index: "01", name: "QuickBox", tone: "sage", mark: "QB" },
  { id: "nextvibe", index: "02", name: "NextVibe", tone: "blue", mark: "NV" },
  { id: "tarot-oracle", index: "03", name: "Tarot Oracle", tone: "clay", mark: "TO" },
  { id: "crescent-blog", index: "04", name: "Crescent Blog", tone: "stone", mark: "CB" },
] as const;

export const labExperiments = sharedLabModules.map((experiment, index) => ({
  id: experiment.id,
  number: String(index + 1).padStart(3, "0"),
  name: experiment.title,
  summary: experiment.description,
  status: experiment.status,
  tags:
    experiment.id === "reading-room"
      ? ["READING", "DDIA"]
      : experiment.id === "project-sites"
        ? ["GO", "DATABASE"]
        : ["SQLITE", "POSTGRESQL"],
}));

export const labProjects = projectSites;
export const labNotes = articleSummaries;
