import { apiFetch, apiJson } from "@/lib/api/client";

export type ProjectStatus = "draft" | "published" | "archived";

export type ProjectListItem = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  status: ProjectStatus;
  cover_url: string;
  repo_url: string;
  demo_url: string;
  tech_stack: string[];
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectListResponse = {
  items: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ProjectDetail = ProjectListItem & {
  description: string;
  content_html: string;
};

export type ProjectArtifact = {
  id: number;
  project_id: number;
  public_id: string;
  version: number;
  label: string;
  source_type: "html" | "zip";
  entry_path: string;
  size_bytes: number;
  sha256: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type ProjectInput = {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  content_md?: string;
  content_html?: string;
  source_format?: "markdown" | "tiptap" | "html";
  cover_url?: string;
  repo_url?: string;
  demo_url?: string;
  status?: ProjectStatus;
  tech_stack?: string[];
};

export type ProjectListParams = {
  page?: number;
  page_size?: number;
  status?: ProjectStatus;
  search?: string;
};

export function listAdminProjects(params: ProjectListParams = {}) {
  return apiJson<ProjectListResponse>(`/api/admin/projects${toQueryString(params)}`);
}

export function getAdminProject(id: number) {
  return apiJson<ProjectDetail>(`/api/admin/projects/detail?id=${id}`);
}

export function createAdminProject(input: ProjectInput) {
  return apiJson<ProjectDetail>("/api/admin/projects", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function updateAdminProject(id: number, input: ProjectInput) {
  return apiJson<ProjectDetail>("/api/admin/projects/update", {
    body: JSON.stringify({ id, ...input }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function deleteAdminProject(id: number) {
  return apiJson<{ success: boolean }>("/api/admin/projects/delete", {
    body: JSON.stringify({ id }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function publishAdminProject(id: number, input: ProjectInput) {
  return apiJson<ProjectDetail>("/api/admin/projects/publish", {
    body: JSON.stringify({ id, ...input }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function previewProject(content_md: string) {
  return apiJson<{ content_html: string }>("/api/admin/projects/preview", {
    body: JSON.stringify({ content_md }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function listProjectArtifacts(projectId: number) {
  return apiJson<{ items: ProjectArtifact[] }>(`/api/admin/projects/artifacts?project_id=${projectId}`);
}

export async function uploadProjectArtifact(projectId: number, file: File, label: string) {
  const body = new FormData();
  body.set("project_id", String(projectId));
  body.set("file", file);
  body.set("label", label);
  const response = await apiFetch("/api/admin/projects/artifacts/upload", { method: "POST", body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? String(payload.message) : "上传失败";
    throw new Error(message);
  }
  return payload as ProjectArtifact;
}

export function publishProjectArtifact(projectId: number, artifactId: number) {
  return apiJson<ProjectArtifact>("/api/admin/projects/artifacts/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, artifact_id: artifactId }),
  });
}

function toQueryString(params: ProjectListParams) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        searchParams.set(key, JSON.stringify(value));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
