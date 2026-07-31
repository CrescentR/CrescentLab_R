import type { ArticleListItem } from "@/lib/api/articles";

export type NotesFilter = "all" | "pinned";
export type NotesView = "mosaic" | "stream";

export function formatArticleDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function articleTimestamp(article: ArticleListItem): string {
  return article.published_at || article.updated_at;
}

export function pickFeatured(articles: ArticleListItem[]): ArticleListItem | null {
  if (articles.length === 0) return null;
  return articles.find((article) => article.is_pinned) ?? articles[0];
}

export function summarizeNotes(articles: ArticleListItem[]) {
  return {
    count: articles.length,
    views: articles.reduce((sum, article) => sum + (article.view_count || 0), 0),
    minutes: articles.reduce((sum, article) => sum + (article.reading_time_minutes || 1), 0),
    pinned: articles.filter((article) => article.is_pinned).length,
  };
}

export function filterNotes(
  articles: ArticleListItem[],
  filter: NotesFilter,
  query: string,
): ArticleListItem[] {
  const normalized = query.trim().toLowerCase();
  return articles.filter((article) => {
    if (filter === "pinned" && !article.is_pinned) return false;
    if (!normalized) return true;
    return (
      article.title.toLowerCase().includes(normalized) ||
      (article.excerpt || "").toLowerCase().includes(normalized)
    );
  });
}
