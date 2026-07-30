"use client";

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
          <div className="article-meta-row">
            <span className="article-status-badge">
              {article.status === "published" ? "Published" : article.status}
            </span>
            {article.published_at && (
              <span className="article-meta-item">
                <Calendar size={13} />
                {formatDate(article.published_at)}
              </span>
            )}
            <span className="article-meta-item">
              <Clock size={13} />
              {article.reading_time_minutes} min read
            </span>
          </div>
          <h1 className="article-title">{article.title}</h1>
          {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
        </motion.header>

        {article.cover_url && (
          <motion.div className="article-cover" variants={fadeUp}>
            <img alt={article.title} src={article.cover_url} />
          </motion.div>
        )}

        <motion.div className="article-content" variants={fadeUp}>
          <div dangerouslySetInnerHTML={{ __html: article.content_html }} />
        </motion.div>

        <motion.footer className="article-footer" variants={fadeUp}>
          <div className="article-stats">
            <span>{article.word_count} 字</span>
            <span>{article.view_count} 次阅读</span>
            <span>{article.comment_count} 条评论</span>
          </div>
        </motion.footer>
      </div>
    </motion.article>
  );
}
