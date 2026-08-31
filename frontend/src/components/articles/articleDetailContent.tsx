"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Text,
} from "lucide-react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  listPublicArticles,
  type ArticleDetail,
  type ArticleListItem,
} from "@/lib/api/articles";
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

function formatShortDate(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function statusLabel(status: string): string {
  switch (status) {
    case "published":
      return "已发布";
    case "draft":
      return "草稿";
    case "archived":
      return "已归档";
    case "scheduled":
      return "定时发布";
    default:
      return status;
  }
}

export function ArticleDetailContent({ article }: ArticleDetailContentProps) {
  const articleRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const articleDocument = useMemo(() => buildArticleDocument(article.content_html), [article.content_html]);
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const contentHtml = useMemo(
    () => (isClient ? highlightArticleHtml(articleDocument.html) : articleDocument.html),
    [articleDocument.html, isClient],
  );
  const [activeHeading, setActiveHeading] = useState(articleDocument.headings[0]?.id || "");
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

  useEffect(() => {
    let cancelled = false;
    void listPublicArticles({ page: 1, page_size: 6 })
      .then((result) => {
        if (cancelled) return;
        setRelated(result.items.filter((item) => item.id !== article.id).slice(0, 4));
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

  async function shareArticle() {
    if (navigator.share) {
      await navigator.share({ title: article.title, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    showFeedback("链接已复制");
  }

  function scrollToHeading(id: string) {
    setActiveHeading(id);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  function scrollToComments() {
    commentsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <article className="article-detail article-reading" ref={articleRef}>
      <motion.div aria-hidden="true" className="article-progress" style={{ scaleX: scrollYProgress }} />

      <div className="article-shell">
        {/* 左侧互动栏 */}
        <aside aria-label="文章互动" className="article-rail">
          <div className="article-rail-card">
            <button
              aria-label={liked ? "取消喜欢" : "喜欢文章"}
              className={liked ? "is-active is-liked" : ""}
              onClick={() => {
                setLiked((value) => !value);
                showFeedback(liked ? "已取消喜欢" : "已喜欢");
              }}
              type="button"
            >
              <Heart fill={liked ? "currentColor" : "none"} size={18} />
              <span>{liked ? 1 : 0}</span>
            </button>
            <button
              aria-label={bookmarked ? "取消收藏" : "收藏文章"}
              className={bookmarked ? "is-active" : ""}
              onClick={() => {
                setBookmarked((value) => !value);
                showFeedback(bookmarked ? "已取消收藏" : "已收藏");
              }}
              type="button"
            >
              {bookmarked ? <Check size={18} /> : <Bookmark size={18} />}
              <span>{bookmarked ? 1 : 0}</span>
            </button>
            <button aria-label="查看评论" onClick={scrollToComments} type="button">
              <MessageCircle size={18} />
              <span>{article.comment_count}</span>
            </button>
            <button aria-label="分享文章" onClick={shareArticle} type="button">
              <Share2 size={18} />
            </button>
          </div>
        </aside>

        {/* 主栏 */}
        <div className="article-main">
          <motion.header
            animate={{ opacity: 1, y: 0 }}
            className="article-masthead"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav aria-label="面包屑" className="article-breadcrumb">
              <Link href="/">CRESCENT LAB</Link>
              <span>/</span>
              <Link href="/notes">FIELD NOTES</Link>
              <span>/</span>
              <span>笔记</span>
            </nav>

            <div className="article-head">
              <div className="article-head-copy">
                <h1>{article.title}</h1>
                {article.excerpt && <p className="article-lede">{article.excerpt}</p>}

                <div className="article-byline">
                  <span aria-hidden="true" className="article-avatar">
                    <span className="lab-crescent-mark" />
                  </span>
                  <div>
                    <strong>Crescent Lab</strong>
                    <span>数字实验室笔记</span>
                  </div>
                </div>

                <div className="article-meta">
                  {publishedAt && (
                    <span>
                      <CalendarDays aria-hidden="true" size={14} />
                      {formatDate(publishedAt)}
                    </span>
                  )}
                  <span>
                    <Clock3 aria-hidden="true" size={14} />
                    {article.reading_time_minutes || 1} 分钟
                  </span>
                  <span>
                    <Eye aria-hidden="true" size={14} />
                    {article.view_count} 次阅读
                  </span>
                  <span>
                    <Text aria-hidden="true" size={14} />
                    {article.word_count} 字
                  </span>
                </div>
              </div>

              <dl className="article-spec">
                <div>
                  <dt>Published</dt>
                  <dd>{publishedAt ? formatShortDate(publishedAt) : "—"}</dd>
                </div>
                <div>
                  <dt>Reading</dt>
                  <dd>{article.reading_time_minutes || 1} min</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>Field Notes</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={`article-status article-status-${article.status}`}>
                      <i />
                      {statusLabel(article.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Words</dt>
                  <dd>{article.word_count.toLocaleString("zh-CN")}</dd>
                </div>
              </dl>
            </div>
          </motion.header>

          {article.cover_url && (
            <motion.figure
              className="article-plate"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ amount: 0.2, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Image
                alt={article.title}
                fill
                sizes="(max-width: 900px) 100vw, 760px"
                src={article.cover_url}
                unoptimized
              />
            </motion.figure>
          )}

          <motion.div
            className="article-content"
            initial={{ opacity: 0, y: 18 }}
            ref={contentRef}
            style={{ "--article-font-scale": 1 } as CSSProperties}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
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
              返回全部笔记
            </Link>
          </footer>

          <div ref={commentsRef}>
            <ArticleComments allowComment={article.allow_comment} articleId={article.id} />
          </div>
        </div>

        {/* 右侧信息栏 */}
        <aside aria-label="文章导航" className="article-aside">
          {articleDocument.headings.length > 0 && (
            <section className="article-panel">
              <h2 className="article-panel-title">文章目录</h2>
              <ol className="article-toc-list">
                {articleDocument.headings.map((heading, index) => (
                  <li className={activeHeading === heading.id ? "is-active" : ""} key={heading.id}>
                    <button onClick={() => scrollToHeading(heading.id)} type="button">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {heading.text}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {related.length > 0 && (
            <section className="article-panel">
              <h2 className="article-panel-title">相关文章</h2>
              <ul className="article-related">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link href={`/articles/${item.slug}`}>
                      <span className="article-related-thumb">
                        {item.cover_url ? (
                          <Image alt="" fill sizes="56px" src={item.cover_url} unoptimized />
                        ) : (
                          <span aria-hidden="true" className="article-related-fallback" />
                        )}
                      </span>
                      <span className="article-related-copy">
                        <strong>{item.title}</strong>
                        <time dateTime={item.published_at || item.created_at}>
                          {formatShortDate(item.published_at || item.created_at)}
                        </time>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {feedback && (
        <motion.div animate={{ opacity: 1, y: 0 }} className="article-feedback" initial={{ opacity: 0, y: 8 }}>
          {feedback}
        </motion.div>
      )}
    </article>
  );
}
