import { notFound } from "next/navigation";
import { getPublicArticle } from "@/lib/api/articles";
import { ArticleDetailContent } from "@/components/articles/articleDetailContent";
import { loadJournal } from "@/lib/journal";
import { ApiError } from "@/lib/api/client";
export default async function ArticlePage({ params }: { params: Promise<{slug: string}> }) {
  const {slug} = await params;
  const [article, data] = await Promise.all([getPublicArticle(slug).catch((error) => { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }), loadJournal()]);
  return <ArticleDetailContent article={article} data={data} />;
}
