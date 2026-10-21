import { apiJson } from "@/lib/api/client";

export type ArticleStatus = "draft" | "published" | "archived" | "scheduled";

export type ArticleListItem = {
  id: number;
  public_id: string;
  category_id: number | null;
  category_name: string;
  project_id: number | null;
  title_emphasis: string;
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

export type Revision = { date: string; summary: string };

export type ArticleDetail = ArticleListItem & {
  revisions: Revision[] | null;
  content_md: string;
  content_html: string;
  visibility: string;
  source_format: string;
  allow_comment: boolean;
  word_count: number;
};

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

function toQueryString(params: Omit<ArticleListParams, "status">) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export type Collection = { id: number; name: string; slug: string; description: string; sort_order: number; article_count: number };
export function listPublicCollections() { return apiJson<{items: Collection[]}>("/api/collections", { cache: "no-store" }); }
