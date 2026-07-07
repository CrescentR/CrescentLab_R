import Image from "next/image";
import type { ArticleSummary } from "@/types/content";
import { Badge } from "@/components/ui/badge";
import { articleStatusLabel } from "./homeTone";

export function ArticleSection({ articles }: { articles: ArticleSummary[] }) {
  const [featuredArticle, ...secondaryArticles] = articles;

  return (
    <section className="home-article-column" data-lab-animate id="articles">
      {featuredArticle && <FeaturedArticleCard article={featuredArticle} />}

      <div className="mt-5 border-t border-[var(--border-soft)]">
        {secondaryArticles.map((article, index) => (
          <ArticleRow article={article} index={index + 1} key={article.id} />
        ))}
      </div>
    </section>
  );
}

function FeaturedArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="home-featured-article group">
      {article.coverImage && (
        <div className="home-featured-article-media">
          <Image alt={article.coverAlt ?? article.title} className="object-cover" fill sizes="(min-width: 768px) 340px, 100vw" src={article.coverImage} unoptimized />
        </div>
      )}
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "amber"}>
            {articleStatusLabel[article.status]}
          </Badge>
          <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.category}</span>
          {article.linkedProject && <Badge tone="purple">{article.linkedProject}</Badge>}
        </div>
        <h3 className="mt-4 max-w-2xl font-lab-display text-4xl font-semibold leading-tight text-[var(--text-strong)] transition-colors group-hover:text-[var(--blue)]">
          {article.title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p>
        <div className="mt-6 flex items-center justify-between gap-3 font-lab-mono text-xs text-[var(--muted-low)]">
          <span>{article.updatedAt}</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </article>
  );
}

function ArticleRow({ article, index }: { article: ArticleSummary; index: number }) {
  return (
    <article className="group grid gap-4 border-b border-[var(--border-soft)] py-8 md:grid-cols-[72px_minmax(0,1fr)_130px]">
      <span className="font-lab-mono text-xs text-[var(--muted-low)]">0{index}</span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "amber"}>
            {articleStatusLabel[article.status]}
          </Badge>
          <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.category}</span>
        </div>
        <h3 className="mt-3 font-lab-display text-2xl font-semibold text-[var(--text-strong)] transition-colors group-hover:text-[var(--blue)]">
          {article.title}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p>
      </div>
      <div className="flex items-start justify-between gap-3 md:flex-col md:items-end">
        <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.updatedAt}</span>
        <span className="font-lab-mono text-xs text-[var(--text)]">{article.readTime}</span>
      </div>
    </article>
  );
}
