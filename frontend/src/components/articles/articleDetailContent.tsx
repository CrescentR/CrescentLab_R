"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  Bookmark,
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
} from "lucide-react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { bindArticleCodeCopy, highlightArticleHtml } from "@/lib/codeHighlight";
import {
  listPublicArticles,
  type ArticleDetail,
  type ArticleListItem,
} from "@/lib/api/articles";

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
    /<h(1)([^>]*)>([\s\S]*?)<\/h\1>/gi,
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

function formatShortDate(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [related, setRelated] = useState<ArticleListItem[]>([]);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    target: articleRef,
  });

  const publishedAt = article.published_at || article.created_at;

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    bindArticleCodeCopy(content.ownerDocument, content);

    const elements = Array.from(content.querySelectorAll<HTMLHeadingElement>("h1"));
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

  useEffect(() => {
    let cancelled = false;
    void listPublicArticles({ page: 1, page_size: 6 })
      .then((result) => {
        if (cancelled) return;
        setRelated(result.items.filter((item) => item.id !== article.id).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [article.id]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function adjustFontScale(step: number) {
    setFontScale((value) => Math.min(1.12, Math.max(0.92, Number((value + step).toFixed(2)))));
  }

  async function shareArticle() {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url: window.location.href });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        throw error;
      }
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    showFeedback("链接已复制");
  }

  function scrollToHeading(id: string) {
    setActiveHeading(id);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <article className="article-detail article-reading article-zine" ref={articleRef}>
      <motion.div aria-hidden="true" className="article-progress" style={{ scaleX: scrollYProgress }} />

      <motion.header
        animate={{ opacity: 1 }}
        className="article-zine-hero"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div aria-hidden="true" className="article-zine-grid" />

        <div className="article-zine-wide article-zine-topline">
          <Link href="/notes">
            <ArrowLeft aria-hidden="true" size={17} />
            返回笔记
          </Link>
          <span>PUBLIC NOTE</span>
          {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
        </div>

        <div className="article-zine-wide article-zine-stage">
          <div className="article-zine-copy">
            <p className="article-zine-kicker">
              <span>NEW</span>
              CRESCENT INDEX / WRITING
            </p>
            <h1>{article.title}</h1>
            {article.excerpt && <p className="article-zine-lede">{article.excerpt}</p>}
            <a className="article-zine-read" href="#article-body">
              开始阅读
              <ArrowDownRight aria-hidden="true" size={22} />
            </a>
          </div>

          <motion.figure
            className={article.cover_url ? "article-zine-cover" : "article-zine-cover is-fallback"}
            initial={{ opacity: 0, rotate: 0, x: 24 }}
            transition={{ delay: 0.12, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, rotate: -2.2, x: 0 }}
          >
            <span aria-hidden="true" className="article-zine-cover-corner" />
            <div className="article-zine-cover-media">
              {article.cover_url ? (
                <Image
                  alt={article.title}
                  fill
                  loading="eager"
                  sizes="(max-width: 900px) 88vw, 540px"
                  src={article.cover_url}
                  unoptimized
                />
              ) : (
                <span className="article-zine-cover-type">{article.title}</span>
              )}
            </div>
            <figcaption>
              <span>CRESCENT INDEX</span>
              <span>{article.word_count.toLocaleString("zh-CN")} WORDS</span>
            </figcaption>
          </motion.figure>
        </div>

        <dl className="article-zine-facts">
          <div>
            <dt>AUTHOR</dt>
            <dd>Crescent Index</dd>
          </div>
          <div>
            <dt>READING</dt>
            <dd>{article.reading_time_minutes || 1} MIN</dd>
          </div>
          <div>
            <dt>WORDS</dt>
            <dd>{article.word_count.toLocaleString("zh-CN")}</dd>
          </div>
          <div>
            <dt>VIEWS</dt>
            <dd>{article.view_count.toLocaleString("zh-CN")}</dd>
          </div>
        </dl>
      </motion.header>

      <section className="article-paper" id="article-body">
        <div className="article-zine-wide article-reading-stage">
          <aside aria-label="阅读工具" className="article-dock">
            <span aria-hidden="true" className="article-dock-label">READ<br />MODE</span>
            <div aria-label="字号设置" className="article-dock-group" role="group">
              <button
                aria-label="减小正文字号"
                disabled={fontScale <= 0.92}
                onClick={() => adjustFontScale(-0.04)}
                type="button"
              >
                <Minus aria-hidden="true" size={17} />
              </button>
              <span aria-hidden="true">Aa</span>
              <button
                aria-label="增大正文字号"
                disabled={fontScale >= 1.12}
                onClick={() => adjustFontScale(0.04)}
                type="button"
              >
                <Plus aria-hidden="true" size={17} />
              </button>
            </div>
            <div aria-label="文章互动" className="article-dock-actions" role="group">
              <button
                aria-label={liked ? "取消喜欢" : "喜欢文章"}
                aria-pressed={liked}
                className={liked ? "is-active is-liked" : ""}
                onClick={() => {
                  setLiked((value) => !value);
                  showFeedback(liked ? "已取消喜欢" : "已喜欢");
                }}
                type="button"
              >
                <Heart aria-hidden="true" fill={liked ? "currentColor" : "none"} size={18} />
              </button>
              <button
                aria-label={bookmarked ? "取消收藏" : "收藏文章"}
                aria-pressed={bookmarked}
                className={bookmarked ? "is-active" : ""}
                onClick={() => {
                  setBookmarked((value) => !value);
                  showFeedback(bookmarked ? "已取消收藏" : "已收藏");
                }}
                type="button"
              >
                {bookmarked ? <Check aria-hidden="true" size={18} /> : <Bookmark aria-hidden="true" size={18} />}
              </button>
              <button aria-label="分享文章" onClick={() => void shareArticle()} type="button">
                <Share2 aria-hidden="true" size={18} />
              </button>
            </div>
          </aside>

          <div className="article-body-column">
            {articleDocument.headings.length > 0 && (
              <nav aria-label="文章目录" className="article-map">
                <header>
                  <span>CONTENTS</span>
                  <strong>{String(articleDocument.headings.length).padStart(2, "0")} SECTIONS</strong>
                </header>
                <ol>
                  {articleDocument.headings.map((heading, index) => (
                    <li className={activeHeading === heading.id ? "is-active" : ""} key={heading.id}>
                      <button onClick={() => scrollToHeading(heading.id)} type="button">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{heading.text}</strong>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="article-content"
              ref={contentRef}
              style={{ "--article-font-scale": fontScale } as CSSProperties}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            >
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </motion.div>

            <footer className="article-signoff">
              <div>
                <span>END OF NOTE</span>
                <strong>{article.title}</strong>
              </div>
              <div>
                <p>{article.word_count.toLocaleString("zh-CN")} 字 / {article.reading_time_minutes || 1} 分钟</p>
                <Link href="/notes">
                  下一篇从笔记列表开始
                  <ArrowDownRight aria-hidden="true" size={19} />
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="article-more-title" className="article-more">
          <div className="article-zine-wide">
            <header>
              <span>KEEP EXPLORING</span>
              <h2 id="article-more-title">继续阅读，不要停。</h2>
            </header>
            <ol>
              {related.map((item, index) => (
                <li key={item.id}>
                  <Link href={`/articles/${item.slug}`}>
                    <span className="article-more-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="article-more-copy">
                      <strong>{item.title}</strong>
                      <span>
                        <time dateTime={item.published_at || item.created_at}>
                          {formatShortDate(item.published_at || item.created_at)}
                        </time>
                        <span>{item.reading_time_minutes || 1} 分钟</span>
                      </span>
                    </span>
                    <span className="article-more-media">
                      {item.cover_url ? (
                        <Image alt="" fill sizes="180px" src={item.cover_url} unoptimized />
                      ) : (
                        <span aria-hidden="true" className="article-more-fallback" />
                      )}
                    </span>
                    <ArrowDownRight aria-hidden="true" className="article-more-arrow" size={28} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {feedback && (
        <motion.div animate={{ opacity: 1, y: 0 }} className="article-feedback" initial={{ opacity: 0, y: 8 }}>
          {feedback}
        </motion.div>
      )}
    </article>
  );
}
