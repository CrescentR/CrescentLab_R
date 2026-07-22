import { apiJson } from "@/lib/api/client";

export type ArticleStatus = "draft" | "published" | "archived" | "scheduled";

export type ArticleListItem = {
  id: number;
  public_id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string;
  status: ArticleStatus;
  is_pinned: boolean;
  view_count: number;
  comment_count: number;
  reading_time_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleListResponse = {
  items: ArticleListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ArticleDetail = ArticleListItem & {
  content_md: string;
  content_html: string;
  visibility: string;
  source_format: string;
  allow_comment: boolean;
  word_count: number;
};

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content_md?: string;
  cover_url?: string;
  status?: ArticleStatus;
  source_format?: "markdown";
};

export type ArticleListParams = {
  page?: number;
  page_size?: number;
  status?: ArticleStatus;
  category?: string;
  search?: string;
};

export function listPublicArticles(params: Omit<ArticleListParams, "status"> = {}) {
  return apiJson<ArticleListResponse>(`/api/articles${toQueryString(params)}`);
}

export function getPublicArticle(slug: string) {
  return apiJson<ArticleDetail>(`/api/articles/${encodeURIComponent(slug)}`);
}

export function listAdminArticles(params: ArticleListParams = {}) {
  return apiJson<ArticleListResponse>(`/api/admin/articles${toQueryString(params)}`);
}

export function getAdminArticle(id: number) {
  return apiJson<ArticleDetail>(`/api/admin/articles/${id}`);
}

export function createAdminArticle(input: ArticleInput) {
  return apiJson<ArticleDetail>("/api/admin/articles", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function updateAdminArticle(id: number, input: ArticleInput) {
  return apiJson<ArticleDetail>(`/api/admin/articles/${id}`, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
}

export function deleteAdminArticle(id: number) {
  return apiJson<void>(`/api/admin/articles/${id}`, { method: "DELETE" });
}

function toQueryString(params: ArticleListParams | Omit<ArticleListParams, "status">) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
