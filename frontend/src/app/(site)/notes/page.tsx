import type { Metadata } from "next";
import { NotesExperience } from "@/components/notes/notesExperience";
import { listPublicArticles, type ArticleListItem } from "@/lib/api/articles";
import "@/app/notes-list.css";

export const metadata: Metadata = {
  title: "笔记 — Crescent Lab",
  description: "已经整理成完整文章、能够独立阅读和长期引用的内容。",
};

const PAGE_SIZE = 12;

export default async function NotesPage() {
  let articles: ArticleListItem[] = [];
  let total = 0;
  let page = 1;
  let totalPages = 0;

  try {
    const result = await listPublicArticles({ page: 1, page_size: PAGE_SIZE });
    articles = result.items;
    total = result.total;
    page = result.page;
    totalPages = result.total_pages;
  } catch {
    articles = [];
  }

  return (
    <NotesExperience
      initialArticles={articles}
      initialPage={page}
      total={total}
      totalPages={totalPages}
    />
  );
}
