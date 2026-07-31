"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { motion } from "motion/react";
import type { ArticleListItem } from "@/lib/api/articles";
import { fadeUp, stagger } from "@/components/home/motionConfig";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function mapArticleToNote(article: ArticleListItem) {
  return {
    id: String(article.id),
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || "暂无摘要",
    coverUrl: article.cover_url,
    updatedAt: formatDate(article.published_at || article.updated_at),
    readTime: `${article.reading_time_minutes || 1} 分钟阅读`,
  };
}

export function LabNotes({ articles }: { articles: ArticleListItem[] }) {
  const notes = articles.map(mapArticleToNote);

  return (
    <motion.section
      animate="visible"
      className="lab-section lab-shell"
      initial="hidden"
      variants={stagger}
    >
      <motion.header className="lab-notes-header" variants={fadeUp}>
        <p className="lab-mono">NOTES &amp; ESSAYS</p>
        <h1>笔记</h1>
        <p>记录开发实践、产品思考，以及那些值得被完整写下来的过程。</p>
      </motion.header>
      <div className="lab-note-list">
        {notes.length === 0 ? (
          <motion.p className="lab-note-empty" variants={fadeUp}>
            暂无笔记，去后台发布第一篇文章吧。
          </motion.p>
        ) : (
          notes.map((note) => (
            <motion.article className="lab-note-card" key={note.id} variants={fadeUp}>
              <Link aria-label={`阅读 ${note.title}`} href={`/articles/${note.slug}`}>
                <div className="lab-note-copy">
                  <div className="lab-note-meta">
                    <span><CalendarDays aria-hidden="true" size={14} />{note.updatedAt}</span>
                    <span><Clock3 aria-hidden="true" size={14} />{note.readTime}</span>
                  </div>
                  <h2>{note.title}</h2>
                  <p>{note.excerpt}</p>
                  <span className="lab-note-read-more">
                    阅读全文 <ArrowRight aria-hidden="true" size={15} />
                  </span>
                </div>
                {note.coverUrl && (
                  <div className="lab-note-cover">
                    <Image
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 260px"
                      src={note.coverUrl}
                      unoptimized
                    />
                  </div>
                )}
              </Link>
            </motion.article>
          ))
        )}
      </div>
    </motion.section>
  );
}
