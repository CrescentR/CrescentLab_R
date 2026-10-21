import { apiJson } from "@/lib/api/client";

export type ProjectPhase = "" | "research" | "building" | "live" | "waning";
export type Project = {
  id: number; name: string; slug: string; tagline: string;
  status: "draft" | "published" | "archived";
  phase: ProjectPhase; goal: string; boundary: string; current_work: string;
  progress_percent: number | null; closure_kind: "" | "archived" | "abandoned"; closure_reason: string;
  cover_url: string; repo_url: string; demo_url: string; tech_stack: string[] | null;
  published_at: string | null; created_at: string; updated_at: string;
};
export type ProjectDetail = Project & {
  description: string; content_md: string; content_html: string;
  source_format: "markdown" | "mdx" | "tiptap" | "html";
};
export type ProjectListResponse = { items: Project[]; total: number; page: number; page_size: number; total_pages: number };
export function listPublicProjects(params: {page?: number; page_size?: number} = {}) { const query = new URLSearchParams(); if (params.page) query.set("page", String(params.page)); if (params.page_size) query.set("page_size", String(params.page_size)); return apiJson<ProjectListResponse>(`/api/projects?${query}`, { cache: "no-store" }); }
export function getPublicProject(slug: string) { return apiJson<ProjectDetail>(`/api/projects/${encodeURIComponent(slug)}`, { cache: "no-store" }); }
