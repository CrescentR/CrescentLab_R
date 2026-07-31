import type { Metadata } from "next";
import { LabNotes } from "@/components/home/labNotes";
import { listPublicArticles, type ArticleListItem } from "@/lib/api/articles";

export const metadata: Metadata = {
  title: "笔记 — Crescent Lab",
  description: "已经整理成完整文章、能够独立阅读和长期引用的内容。",
};

export default async function NotesPage() {
  let articles: ArticleListItem[] = [];
  try {
    const result = await listPublicArticles({ page: 1, page_size: 10 });
    articles = result.items;
  } catch {
    articles = [];
  }

  return <LabNotes articles={articles} />;
}
