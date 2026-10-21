import { apiJson } from "@/lib/api/client";

export type BuildStage = "prototype" | "development" | "validating" | "beta" | "paused";
export type BuildStatus = "draft" | "published" | "archived";

export type BuildItem = {
  project_id: number | null;
  id: number;
  name: string;
  slug: string;
  one_liner: string;
  stage: BuildStage;
  round_goal: string;
  latest_progress: string;
  next_step: string;
  detail_url: string;
  demo_url: string;
  repo_url: string;
  status: BuildStatus;
  sort_order: number;
  progressed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BuildListResponse = {
  items: BuildItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type BuildListParams = {
  page?: number;
  page_size?: number;
  status?: BuildStatus;
  search?: string;
};

export function listPublicBuilds(params: BuildListParams = {}) {
  return apiJson<BuildListResponse>(`/api/builds${toQueryString(params)}`, {
    cache: "no-store",
  });
}

function toQueryString(params: BuildListParams) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
