import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ArticleSummary } from "@/types/content";
import { Badge } from "@/components/ui/badge";
import { articleStatusLabel } from "./homeTone";

export function ArticleSection({ articles }: { articles: ArticleSummary[] }) {
  const [featuredArticle, ...secondaryArticles] = articles;

  return (
    <section className="home-article-column" data-lab-animate id="articles">
      <div className="home-section-heading">
        <h2>近期文章</h2>
        <span />
      </div>
      {featuredArticle && <FeaturedArticleCard article={featuredArticle} />}

      <div className="home-article-list">
        {secondaryArticles.map((article) => (
          <ArticleRow article={article} key={article.id} />
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
      <div className="home-featured-article-body">
        <div className="home-article-meta">
          <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.category}</span>
          <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "amber"}>
            {articleStatusLabel[article.status]}
          </Badge>
          <span>·</span>
          <span>{article.updatedAt}</span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="home-featured-article-footer">
          {article.linkedProject && <Badge tone="purple">{article.linkedProject}</Badge>}
          <Link href="#articles">
            阅读全文 <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArticleRow({ article }: { article: ArticleSummary }) {
  return (
    <article className="home-article-row group">
      <div className="home-article-meta">
        <span>{article.category}</span>
        <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "amber"}>
          {articleStatusLabel[article.status]}
        </Badge>
        <span>·</span>
        <span>{article.updatedAt}</span>
        <span>·</span>
        <span>{article.readTime}</span>
      </div>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
    </article>
  );
}
