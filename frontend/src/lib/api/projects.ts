import { apiJson } from "@/lib/api/client";

export type Project = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  content_md: string;
  content_html: string;
  source_format: "markdown" | "mdx" | "tiptap" | "html";
  cover_url: string;
  repo_url: string;
  demo_url: string;
  tech_stack: string[];
  published_at: string | null;
};

export type ProjectListResponse = { items: Project[]; total: number; page: number; page_size: number; total_pages: number };

export function listPublicProjects() {
  return apiJson<ProjectListResponse>("/api/projects", { cache: "no-store" });
}

export function getPublicProject(slug: string) {
  return apiJson<Project>(`/api/projects/${encodeURIComponent(slug)}`, { cache: "no-store" });
}
