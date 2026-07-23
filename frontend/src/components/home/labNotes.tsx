"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { listPublicArticles, type ArticleListItem } from "@/lib/api/articles";
import { SectionIntro } from "@/components/home/sectionIntro";
import { fadeUp, stagger, viewport } from "@/components/home/motionConfig";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function mapArticleToNote(article: ArticleListItem) {
  return {
    id: String(article.id),
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || "暂无摘要",
    category: article.status === "published" ? "Engineering Notes" : article.status,
    status: article.status,
    updatedAt: formatDate(article.published_at || article.updated_at),
    readTime: `${article.reading_time_minutes || 1} min`,
  };
}

export function LabNotes() {
  const [notes, setNotes] = useState<ReturnType<typeof mapArticleToNote>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicArticles({ page: 1, page_size: 10 })
      .then((result) => {
        setNotes(result.items.map(mapArticleToNote));
      })
      .catch(() => {
        setNotes([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <motion.section className="lab-section lab-notes lab-shell" id="notes" initial="hidden" variants={stagger} viewport={viewport} whileInView="visible">
      <SectionIntro
        description="在公开构建系统和私下修订过程中的田野笔记。"
        index="04 / 日志"
        title="笔记"
      />
      <div className="lab-note-timeline">
        {loading ? (
          <motion.p className="lab-mono text-sm text-[var(--muted)]" variants={fadeUp}>
            加载中…
          </motion.p>
        ) : notes.length === 0 ? (
          <motion.p className="lab-mono text-sm text-[var(--muted)]" variants={fadeUp}>
            暂无笔记，去后台发布第一篇文章吧。
          </motion.p>
        ) : (
          notes.map((note) => (
            <motion.article className="lab-note-row" key={note.id} variants={fadeUp}>
              <div className="lab-note-date lab-mono">
                <span />
                {note.updatedAt}
              </div>
              <div className="lab-note-copy">
                <p className="lab-mono">{note.category}</p>
                <h3>{note.title}</h3>
                <p>{note.excerpt}</p>
              </div>
              <a aria-label={`阅读 ${note.title}`} href={`/articles/${note.slug}`}>
                <ArrowUpRight size={17} />
              </a>
            </motion.article>
          ))
        )}
      </div>
    </motion.section>
  );
}
