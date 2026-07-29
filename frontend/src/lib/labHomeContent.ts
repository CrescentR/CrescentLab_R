import { articleSummaries, projectSites, sharedLabModules } from "@/lib/mockData";

export const labNavigation = [
  { label: "首页", sectionId: "home" },
  { label: "项目", sectionId: "projects" },
  { label: "实验", sectionId: "experiments" },
  { label: "笔记", sectionId: "notes" },
  { label: "关于", sectionId: "about" },
] as const;

export const nowBuilding = [
  { id: "quickbox", index: "01", name: "QuickBox", tone: "violet", mark: "QB" },
  { id: "nextvibe", index: "02", name: "NextVibe", tone: "blue", mark: "NV" },
  { id: "tarot-oracle", index: "03", name: "Tarot Oracle", tone: "warm", mark: "TO" },
  { id: "crescent-blog", index: "04", name: "Crescent Blog", tone: "neutral", mark: "CB" },
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
