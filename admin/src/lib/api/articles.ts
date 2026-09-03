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
  category_id: number | null;
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
  category_id?: number | null;
  excerpt?: string;
  content_md?: string;
  content_html?: string;
  cover_url?: string;
  status?: ArticleStatus;
  source_format?: "markdown" | "tiptap" | "html";
};

export type Collection = {
  id: number;
  name: string;
  slug: string;
  description: string;
  article_count: number;
};

export function listAdminCollections() {
  return apiJson<{ items: Collection[] }>("/api/admin/collections");
}

export type ArticleListParams = {
  page?: number;
  page_size?: number;
  status?: ArticleStatus;
  category?: string;
  search?: string;
};

export function listPublicArticles(params: Omit<ArticleListParams, "status"> = {}) {
  return apiJson<ArticleListResponse>(`/api/articles${toQueryString(params)}`, {
    cache: "no-store",
  });
}

export function getPublicArticle(slug: string) {
  return apiJson<ArticleDetail>(`/api/articles/${encodeURIComponent(slug)}`);
}

export function listAdminArticles(params: ArticleListParams = {}) {
  return apiJson<ArticleListResponse>(`/api/admin/articles${toQueryString(params)}`);
}

export function getAdminArticle(id: number) {
  return apiJson<ArticleDetail>(`/api/admin/articles/detail?id=${id}`);
}

export function createAdminArticle(input: ArticleInput) {
  return apiJson<ArticleDetail>("/api/admin/articles", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function updateAdminArticle(id: number, input: ArticleInput) {
  return apiJson<ArticleDetail>("/api/admin/articles/update", {
    body: JSON.stringify({ id, ...input }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function deleteAdminArticle(id: number) {
  return apiJson<{ success: boolean }>("/api/admin/articles/delete", {
    body: JSON.stringify({ id }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export type PreviewResult = {
  content_html: string;
  word_count: number;
  reading_time_minutes: number;
};

export function previewArticle(content_html: string) {
  return apiJson<PreviewResult>("/api/admin/articles/preview", {
    body: JSON.stringify({ content_html, source_format: "tiptap" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function publishAdminArticle(id: number, input: ArticleInput) {
  return apiJson<ArticleDetail>("/api/admin/articles/publish", {
    body: JSON.stringify({ id, ...input }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
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
