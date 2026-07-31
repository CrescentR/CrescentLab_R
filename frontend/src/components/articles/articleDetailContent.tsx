"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, stagger } from "@/components/home/motionConfig";
import { type ArticleDetail } from "@/lib/api/articles";

type ArticleDetailContentProps = {
  article: ArticleDetail;
};

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ArticleDetailContent({ article }: ArticleDetailContentProps) {
  return (
    <motion.article
      animate="visible"
      className="article-detail"
      initial="hidden"
      variants={stagger}
    >
      <div className="article-detail-shell">
        <motion.div variants={fadeUp}>
          <Link className="article-back-link" href="/notes">
            <ArrowLeft size={16} />
            返回笔记
          </Link>
        </motion.div>

        <motion.header className="article-header" variants={fadeUp}>
          <p className="article-kicker">CRESCENT LAB · NOTES</p>
          <h1 className="article-title">{article.title}</h1>
          {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
          <div className="article-meta-row">
            {article.published_at && (
              <span className="article-meta-item">
                <Calendar aria-hidden="true" size={14} />
                {formatDate(article.published_at)}
              </span>
            )}
            <span className="article-meta-item">
              <Clock aria-hidden="true" size={14} />
              {article.reading_time_minutes || 1} 分钟阅读
            </span>
          </div>
        </motion.header>

        {article.cover_url && (
          <motion.div className="article-cover" variants={fadeUp}>
            <Image alt={article.title} fill priority sizes="(max-width: 960px) 100vw, 1040px" src={article.cover_url} unoptimized />
          </motion.div>
        )}

        <div className="article-reading-column">
          <motion.div className="article-content" variants={fadeUp}>
            <div dangerouslySetInnerHTML={{ __html: article.content_html }} />
          </motion.div>

          <motion.footer className="article-footer" variants={fadeUp}>
            <div className="article-stats">
              <span>{article.word_count} 字</span>
              <span>{article.view_count} 次阅读</span>
              <span>{article.comment_count} 条评论</span>
            </div>
            <Link className="article-footer-back" href="/notes">
              <ArrowLeft aria-hidden="true" size={15} />
              返回全部笔记
            </Link>
          </motion.footer>
        </div>
      </div>
    </motion.article>
  );
}
