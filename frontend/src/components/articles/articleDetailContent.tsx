"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Eye,
  ListTree,
  Share2,
  Text,
} from "lucide-react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type ArticleDetail } from "@/lib/api/articles";
import { ArticleComments } from "@/components/articles/articleComments";
import { bindArticleCodeCopy, highlightArticleHtml } from "@/lib/codeHighlight";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type ArticleDetailContentProps = {
  article: ArticleDetail;
};

type ArticleHeading = {
  id: string;
  level: number;
  text: string;
};

function buildArticleDocument(contentHtml: string) {
  const headings: ArticleHeading[] = [];
  const html = contentHtml.replace(
    /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level: string, attributes: string, content: string) => {
      const id = `section-${headings.length + 1}`;
      headings.push({
        id,
        level: Number(level),
        text: content.replace(/<[^>]+>/g, "").trim() || `章节 ${headings.length + 1}`,
      });
      const nextAttributes = attributes.replace(/\sid=(['"]).*?\1/i, "");
      return `<h${level}${nextAttributes} id="${id}">${content}</h${level}>`;
    },
  );

  return { headings, html };
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ArticleDetailContent({ article }: ArticleDetailContentProps) {
  const articleRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const articleDocument = useMemo(() => buildArticleDocument(article.content_html), [article.content_html]);
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const contentHtml = useMemo(
    () => (isClient ? highlightArticleHtml(articleDocument.html) : articleDocument.html),
    [articleDocument.html, isClient],
  );
  const [activeHeading, setActiveHeading] = useState(articleDocument.headings[0]?.id || "");
  const [fontScale, setFontScale] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    target: articleRef,
  });

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    bindArticleCodeCopy(content.ownerDocument, content);

    const elements = Array.from(content.querySelectorAll<HTMLHeadingElement>("h1, h2, h3"));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-18% 0px -68%", threshold: 0 },
    );

    elements.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [contentHtml]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    showFeedback("链接已复制");
  }

  async function shareArticle() {
    if (navigator.share) {
      await navigator.share({ title: article.title, url: window.location.href });
      return;
    }
    await copyLink();
  }

  function scrollToHeading(id: string) {
    setActiveHeading(id);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <article className="article-detail article-reading" ref={articleRef}>
      <motion.div aria-hidden="true" className="article-progress" style={{ scaleX: scrollYProgress }} />

      {/* 页头氛围层：柔和光晕 + 纸纹，替代原先的默认大图 */}
      <div aria-hidden="true" className="article-aura">
        <span className="article-aura-orb article-aura-orb-a" />
        <span className="article-aura-orb article-aura-orb-b" />
        <span className="article-aura-grain" />
      </div>

      <div className="article-shell lab-shell">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="article-masthead"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link className="article-crumb" href="/notes">
            <ArrowLeft aria-hidden="true" size={15} />
            返回笔记
          </Link>

          <p className="article-eyebrow">
            <span aria-hidden="true" className="article-eyebrow-pulse" />
            CRESCENT LAB / FIELD NOTES
          </p>
          <h1>{article.title}</h1>
          {article.excerpt && <p className="article-lede">{article.excerpt}</p>}

          <div className="article-meta">
            {article.published_at && (
              <span>
                <CalendarDays aria-hidden="true" size={14} />
                {formatDate(article.published_at)}
              </span>
            )}
            <span>
              <Clock3 aria-hidden="true" size={14} />
              {article.reading_time_minutes || 1} 分钟阅读
            </span>
            <span>
              <Text aria-hidden="true" size={14} />
              {article.word_count} 字
            </span>
            <span>
              <Eye aria-hidden="true" size={14} />
              {article.view_count} 次阅读
            </span>
          </div>
        </motion.header>

        {articleDocument.headings.length > 0 && (
          <aside aria-label="文章目录" className="article-toc">
            <div className="article-toc-title">
              <ListTree aria-hidden="true" size={15} />
              文章目录
            </div>
            <ol>
              {articleDocument.headings.map((heading, index) => (
                <li className={activeHeading === heading.id ? "is-active" : ""} key={heading.id}>
                  <button onClick={() => scrollToHeading(heading.id)} type="button">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {heading.text}
                  </button>
                </li>
              ))}
            </ol>
            <div className="article-toc-progress">
              <motion.i style={{ scaleX: scrollYProgress }} />
            </div>
          </aside>
        )}

        <main className="article-column" style={{ "--article-font-scale": fontScale } as CSSProperties}>
          {article.cover_url && (
            <motion.figure
              className="article-plate"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ amount: 0.2, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Image alt={article.title} fill sizes="(max-width: 860px) 100vw, 720px" src={article.cover_url} unoptimized />
            </motion.figure>
          )}

          <motion.div
            className="article-content"
            initial={{ opacity: 0, y: 20 }}
            ref={contentRef}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ amount: 0.05, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </motion.div>

          <footer className="article-footer">
            <div>
              <p>阅读完成</p>
              <div className="article-stats">
                <span>{article.word_count} 字</span>
                <span>{article.view_count} 次阅读</span>
                <span>{article.comment_count} 条评论</span>
              </div>
            </div>
            <Link className="article-footer-back" href="/notes">
              <ArrowLeft aria-hidden="true" size={15} />
              返回全部笔记
            </Link>
          </footer>

          <ArticleComments allowComment={article.allow_comment} articleId={article.id} />
        </main>

        <aside aria-label="阅读工具" className="article-tools">
          <button aria-label="减小字号" disabled={fontScale <= 0.9} onClick={() => setFontScale((value) => Math.max(0.9, value - 0.1))} type="button">A−</button>
          <button aria-label="增大字号" disabled={fontScale >= 1.2} onClick={() => setFontScale((value) => Math.min(1.2, value + 0.1))} type="button">A+</button>
          <span />
          <button aria-label="复制文章链接" onClick={copyLink} type="button"><Copy size={16} /></button>
          <button aria-label="分享文章" onClick={shareArticle} type="button"><Share2 size={16} /></button>
          <button
            aria-label={bookmarked ? "取消收藏" : "收藏文章"}
            className={bookmarked ? "is-active" : ""}
            onClick={() => {
              setBookmarked((value) => !value);
              showFeedback(bookmarked ? "已取消收藏" : "已收藏");
            }}
            type="button"
          >
            {bookmarked ? <Check size={16} /> : <Bookmark size={16} />}
          </button>
        </aside>
      </div>

      {feedback && <motion.div animate={{ opacity: 1, y: 0 }} className="article-feedback" initial={{ opacity: 0, y: 8 }}>{feedback}</motion.div>}
    </article>
  );
}
