import type { ArticleStatus, LabActivity, LabModule, ProjectSite } from "@/types/content";
import type { HomeTone } from "@/types/home";

export type ContentTone = ProjectSite["tone"] | LabActivity["tone"] | LabModule["tone"];

export const categoryToneClass: Record<HomeTone, string> = {
  amber: "home-category-card--amber",
  blue: "home-category-card--blue",
  coral: "home-category-card--coral",
  green: "home-category-card--green",
  neutral: "home-category-card--neutral",
  teal: "home-category-card--teal",
  violet: "home-category-card--violet",
};

export const toneTextClass: Record<ContentTone, string> = {
  amber: "text-[var(--amber)]",
  cyan: "text-[var(--blue)]",
  green: "text-[var(--success)]",
  neutral: "text-[var(--muted-low)]",
  purple: "text-[var(--violet)]",
  rose: "text-[var(--coral)]",
};

export const toneDotClass: Record<ContentTone, string> = {
  amber: "bg-[var(--amber)]",
  cyan: "bg-[var(--blue)]",
  green: "bg-[var(--success)]",
  neutral: "bg-[var(--muted-low)]",
  purple: "bg-[var(--violet)]",
  rose: "bg-[var(--coral)]",
};

export const toneBorderClass: Record<ContentTone, string> = {
  amber: "border-l-[var(--amber)]",
  cyan: "border-l-[var(--blue)]",
  green: "border-l-[var(--success)]",
  neutral: "border-l-[var(--muted-low)]",
  purple: "border-l-[var(--violet)]",
  rose: "border-l-[var(--coral)]",
};

export const articleStatusLabel: Record<ArticleStatus, string> = {
  draft: "草稿",
  published: "已发布",
  scheduled: "排程中",
};

export const projectStatusLabel: Record<ProjectSite["status"], string> = {
  building: "构建中",
  live: "已公开",
  research: "研究中",
};
