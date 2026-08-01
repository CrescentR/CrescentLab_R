"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ListTree,
  Share2,
  Text,
} from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { type ArticleDetail } from "@/lib/api/articles";
import { highlightCodeBlocks } from "@/lib/codeHighlight";

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
  const [activeHeading, setActiveHeading] = useState(articleDocument.headings[0]?.id || "");
  const [fontScale, setFontScale] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const reduceMotion = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    target: articleRef,
  });
  const heroY = useTransform(scrollY, [0, 900], [0, reduceMotion ? 0 : 120]);
  const heroOpacity = useTransform(scrollY, [0, 760], [1, reduceMotion ? 1 : 0.38]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    highlightCodeBlocks(content);
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
  }, [articleDocument.html]);

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
    <motion.article className="article-detail article-detail-v2" ref={articleRef}>
      <motion.div aria-hidden="true" className="article-reading-progress" style={{ scaleX: scrollYProgress }} />

      <section className="article-immersive-hero">
        <motion.div className="article-hero-background" style={{ opacity: heroOpacity, y: heroY }}>
          <Image
            alt="月面研究站与远处的新月"
            fill
            priority
            sizes="100vw"
            src="/images/articles/lunar-observatory-hero.png"
          />
        </motion.div>
        <div aria-hidden="true" className="article-hero-shade" />

        <div className="article-hero-inner lab-shell">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="article-hero-back"
            initial={{ opacity: 0, x: -18 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Link href="/notes"><ArrowLeft size={16} />返回笔记</Link>
          </motion.div>

          <motion.header
            animate={{ opacity: 1, y: 0 }}
            className="article-hero-copy"
            initial={{ opacity: 0, y: 34 }}
            transition={{ delay: 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="article-hero-kicker">CRESCENT LAB / FIELD NOTES</p>
            <h1>{article.title}</h1>
            {article.excerpt && <p className="article-hero-excerpt">{article.excerpt}</p>}
            <div className="article-hero-meta">
              {article.published_at && (
                <span><CalendarDays aria-hidden="true" size={17} />{formatDate(article.published_at)}</span>
              )}
              <span><Clock3 aria-hidden="true" size={17} />{article.reading_time_minutes || 1} 分钟阅读</span>
              <span><Text aria-hidden="true" size={17} />{article.word_count} 字</span>
            </div>
          </motion.header>

          <motion.a
            animate={{ opacity: 1, y: 0 }}
            className="article-scroll-cue"
            href="#article-body"
            initial={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            开始阅读 <ChevronDown aria-hidden="true" size={16} />
          </motion.a>
        </div>
      </section>

      <section className="article-paper" id="article-body">
        <div className="article-layout lab-shell">
          <aside aria-label="文章目录" className="article-toc">
            <div className="article-toc-sticky">
              <div className="article-toc-title"><ListTree aria-hidden="true" size={16} />文章目录</div>
              {articleDocument.headings.length > 0 ? (
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
              ) : (
                <p>正文阅读</p>
              )}
              <div className="article-toc-progress">
                <motion.i style={{ scaleX: scrollYProgress }} />
              </div>
            </div>
          </aside>

          <main
            className="article-reading-column"
            style={{ "--article-font-scale": fontScale } as CSSProperties}
          >
            {article.cover_url && (
              <motion.figure
                className="article-inline-cover"
                initial={{ clipPath: "inset(8% 0 8% 0)", opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ amount: 0.2, once: true }}
                whileInView={{ clipPath: "inset(0% 0 0% 0)", opacity: 1 }}
              >
                <Image alt={article.title} fill sizes="(max-width: 900px) 100vw, 760px" src={article.cover_url} unoptimized />
              </motion.figure>
            )}

            <motion.div
              className="article-content"
              initial={{ opacity: 0, y: 28 }}
              ref={contentRef}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ amount: 0.08, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div dangerouslySetInnerHTML={{ __html: articleDocument.html }} />
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
                <ArrowLeft aria-hidden="true" size={15} />返回全部笔记
              </Link>
            </footer>
          </main>

          <aside aria-label="阅读工具" className="article-tools">
            <div className="article-tools-sticky">
              <button aria-label="减小字号" disabled={fontScale <= 0.9} onClick={() => setFontScale((value) => Math.max(0.9, value - 0.1))} type="button">A−</button>
              <button aria-label="增大字号" disabled={fontScale >= 1.2} onClick={() => setFontScale((value) => Math.min(1.2, value + 0.1))} type="button">A+</button>
              <span />
              <button aria-label="复制文章链接" onClick={copyLink} type="button"><Copy size={17} /></button>
              <button aria-label="分享文章" onClick={shareArticle} type="button"><Share2 size={17} /></button>
              <button
                aria-label={bookmarked ? "取消收藏" : "收藏文章"}
                className={bookmarked ? "is-active" : ""}
                onClick={() => {
                  setBookmarked((value) => !value);
                  showFeedback(bookmarked ? "已取消收藏" : "已收藏");
                }}
                type="button"
              >
                {bookmarked ? <Check size={17} /> : <Bookmark size={17} />}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {feedback && <motion.div animate={{ opacity: 1, y: 0 }} className="article-feedback" initial={{ opacity: 0, y: 8 }}>{feedback}</motion.div>}
    </motion.article>
  );
}
