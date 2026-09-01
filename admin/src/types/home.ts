import type { ArticleSummary, LabActivity, LabModule, ProjectSite } from "@/types/content";

export type HomeTone = "blue" | "violet" | "green" | "amber" | "coral" | "teal" | "neutral";

export type HomeAction = {
  label: string;
  href: string;
};

export type HomeNavItem = HomeAction;

export type HomeAnnouncement = {
  label: string;
  message: string;
  href: string;
  actionLabel: string;
};

export type HomeHero = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: HomeAction;
  secondaryAction: HomeAction;
  coverImage: string;
  coverAlt: string;
  notes: string[];
};

export type HomeFeature = {
  label: string;
  title: string;
  description: string;
  meta: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
};

export type HomeCategory = HomeAction & {
  detail: string;
  icon: "book" | "compass" | "flask" | "pen" | "spark";
  tone: HomeTone;
};

export type HomeContent = {
  navItems: HomeNavItem[];
  announcement: HomeAnnouncement;
  hero: HomeHero;
  feature: HomeFeature;
  categories: HomeCategory[];
  articles: ArticleSummary[];
  projects: ProjectSite[];
  modules: LabModule[];
  activities: LabActivity[];
};
