import { notFound } from "next/navigation";
import { getPublicArticle } from "@/lib/api/articles";
import { ArticleDetailContent } from "@/components/articles/articleDetailContent";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const article = await getPublicArticle(slug).catch(() => notFound());
  return <ArticleDetailContent article={article} />;
}
