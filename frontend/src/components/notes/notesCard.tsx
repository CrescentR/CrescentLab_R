"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Eye, Pin, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { ArticleListItem } from "@/lib/api/articles";
import { articleTimestamp, formatArticleDate } from "@/components/notes/notesUtils";

const cardReveal = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function Meta({ article }: { article: ArticleListItem }) {
  return (
    <div className="nl-meta">
      {article.is_pinned && (
        <span className="nl-chip nl-chip-pin">
          <Pin aria-hidden="true" size={11} />
          置顶
        </span>
      )}
      <time dateTime={articleTimestamp(article)}>
        {formatArticleDate(articleTimestamp(article))}
      </time>
      <span className="nl-dot" aria-hidden="true" />
      <span>
        <Clock3 aria-hidden="true" size={12} />
        {article.reading_time_minutes || 1} 分钟
      </span>
      {article.view_count > 0 && (
        <>
          <span className="nl-dot" aria-hidden="true" />
          <span>
            <Eye aria-hidden="true" size={12} />
            {article.view_count.toLocaleString("zh-CN")}
          </span>
        </>
      )}
    </div>
  );
}

export function NotesFeaturedCard({ article }: { article: ArticleListItem }) {
  const hasCover = Boolean(article.cover_url);

  return (
    <motion.article animate="visible" className="nl-featured" variants={cardReveal}>
      <Link
        aria-label={`阅读 ${article.title}`}
        className={`nl-featured-link${hasCover ? " has-cover" : ""}`}
        href={`/articles/${article.slug}`}
      >
        <div className="nl-featured-glow" aria-hidden="true" />
        {hasCover ? (
          <div className="nl-featured-media">
            <Image
              alt=""
              className="nl-featured-image"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
              src={article.cover_url}
              unoptimized
            />
            <div className="nl-featured-scrim" />
          </div>
        ) : (
          <div className="nl-featured-fallback" aria-hidden="true">
            <Sparkles size={28} />
          </div>
        )}
        <div className="nl-featured-copy">
          <span className="nl-kicker">Featured Essay</span>
          <Meta article={article} />
          <h2>{article.title}</h2>
          <p>{article.excerpt || "打开这篇笔记，进入一段完整的思考。"}</p>
          <span className="nl-cta">
            开始阅读
            <ArrowUpRight aria-hidden="true" size={16} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function NotesMosaicCard({
  article,
  size = "regular",
}: {
  article: ArticleListItem;
  size?: "regular" | "wide" | "tall";
}) {
  const hasCover = Boolean(article.cover_url);

  return (
    <motion.article
      animate="visible"
      className={`nl-mosaic-card nl-mosaic-${size}${hasCover ? " has-cover" : ""}`}
      variants={cardReveal}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link aria-label={`阅读 ${article.title}`} href={`/articles/${article.slug}`}>
        {hasCover && (
          <div className="nl-mosaic-media">
            <Image
              alt=""
              fill
              sizes="(max-width: 720px) 100vw, 33vw"
              src={article.cover_url}
              unoptimized
            />
          </div>
        )}
        <div className="nl-mosaic-copy">
          <Meta article={article} />
          <h3>{article.title}</h3>
          <p>{article.excerpt || "暂无摘要"}</p>
          <span className="nl-inline-link">
            阅读
            <ArrowUpRight aria-hidden="true" size={14} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function NotesStreamCard({ article }: { article: ArticleListItem }) {
  const hasCover = Boolean(article.cover_url);

  return (
    <motion.article animate="visible" className="nl-stream-card" variants={cardReveal}>
      <Link
        aria-label={`阅读 ${article.title}`}
        className={`nl-stream-link${hasCover ? " has-cover" : ""}`}
        href={`/articles/${article.slug}`}
      >
        <div className="nl-stream-copy">
          <Meta article={article} />
          <h3>{article.title}</h3>
          <p>{article.excerpt || "暂无摘要"}</p>
        </div>
        {hasCover && (
          <div className="nl-stream-media">
            <Image
              alt=""
              fill
              sizes="(max-width: 640px) 120px, 168px"
              src={article.cover_url}
              unoptimized
            />
          </div>
        )}
      </Link>
    </motion.article>
  );
}
