"use client";

import Image from "next/image";
import Link from "next/link";
import { Link2, Minus, Plus } from "lucide-react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { bindArticleCodeCopy, highlightArticleHtml } from "@/lib/codeHighlight";
import type { ArticleDetail } from "@/lib/api/articles";
import { journalDate, projectPhases, type JournalData } from "@/lib/journal";
import { MoonPhase } from "@/components/home/moonPhase";
import { ArticleTitle } from "@/components/articles/articleTitle";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type ArticleHeading = {
  id: string;
  level: number;
  text: string;
};

function buildArticleDocument(contentHtml: string) {
  const headings: ArticleHeading[] = [];
  const html = contentHtml.replace(
    /<h([12])([^>]*)>([\s\S]*?)<\/h\1>/gi,
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


export function ArticleDetailContent({ article, data }: { article: ArticleDetail; data: JournalData }) {
  const articleRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const document = useMemo(() => buildArticleDocument(article.content_html), [article.content_html]);
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const html = useMemo(() => isClient ? highlightArticleHtml(document.html) : document.html, [document.html, isClient]);
  const [activeHeading, setActiveHeading] = useState(document.headings[0]?.id || "");
  const [fontScale, setFontScale] = useState(1);
  const [feedback, setFeedback] = useState("");
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: articleRef, offset: ["start start", "end end"] });
  const publishedAt = article.published_at || article.created_at;
  const project = data.projects.find((item) => item.id === article.project_id);
  const collection = data.collections.find((item) => item.id === article.category_id);
  const current = data.articles.findIndex((item) => item.id === article.id);
  const older = data.articles[current + 1];
  const newer = current > 0 ? data.articles[current - 1] : undefined;
  const collectionArticles = data.articles.filter((item) => item.category_id === article.category_id).reverse();
  const position = collectionArticles.findIndex((item) => item.id === article.id);
  const revisions = [...(article.revisions || [])].sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    bindArticleCodeCopy(content.ownerDocument, content);
    const observer = new IntersectionObserver((entries) => {
      const heading = entries.find((entry) => entry.isIntersecting);
      if (heading) setActiveHeading(heading.target.id);
    }, { rootMargin: "-20% 0px -65%" });
    content.querySelectorAll("h1,h2").forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [html]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setFeedback("链接已复制");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  const tools = <div className="j-tools"><button className="j-icon-btn" aria-label="减小正文字号" disabled={fontScale <= .92} onClick={() => setFontScale((value) => Math.max(.92, value - .04))}><Minus size={16} /></button><button className="j-icon-btn" aria-label="增大正文字号" disabled={fontScale >= 1.16} onClick={() => setFontScale((value) => Math.min(1.16, value + .04))}><Plus size={16} /></button><button className="j-icon-btn" aria-label="复制文章链接" onClick={() => void copyLink()}><Link2 size={16} /></button></div>;

  return (
    <article className="j-article" ref={articleRef}>
      <motion.div aria-hidden="true" className="j-reading-progress" style={{ scaleX: scrollYProgress }} />
      <header className="j-article-header j-rise"><div className="j-wrap"><nav className="j-breadcrumb j-mono" aria-label="面包屑"><Link href="/notes">笔记</Link><span>/</span>{collection && <><Link href={`/notes?collection=${collection.id}`}>{collection.name}</Link><span>/</span></>}<span>No.{String(article.id).padStart(3, "0")}</span></nav><h1><ArticleTitle title={article.title} emphasis={article.title_emphasis} /></h1>{article.excerpt && <p className="j-article-deck">{article.excerpt}</p>}<dl className="j-article-spec"><div><dt className="j-mono">发布</dt><dd><time dateTime={publishedAt}>{journalDate(publishedAt, "full")}</time></dd></div><div><dt className="j-mono">阅读</dt><dd>{article.reading_time_minutes} 分钟 · {article.word_count.toLocaleString("zh-CN")} 字</dd></div>{project && <div><dt className="j-mono">关联项目</dt><dd><Link href={`/projects/${project.slug}`} className="j-project-tag">{project.phase && <MoonPhase phase={projectPhases[project.phase].phase} size={14} />}{project.name}</Link></dd></div>}<div><dt className="j-mono">状态</dt><dd>{revisions.length ? <><span className="j-dot-new" />{revisions[0].date.slice(5).replace("-", ".")} 修订过 {revisions.length} 次</> : "首次发布"}</dd></div></dl></div></header>
      {article.cover_url && <figure className="j-article-cover"><Image src={article.cover_url} alt={article.title} width={1120} height={480} sizes="(max-width:860px) 100vw, 1120px" priority unoptimized /></figure>}
      <div className="j-mobile-reading-tools">{tools}</div>
      <div className="j-reading-layout"><aside className="j-toc" aria-label="文章目录">{document.headings.length > 0 && <><h2>目录</h2><ol>{document.headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} className={activeHeading === heading.id ? "is-active" : ""} onClick={(event) => { event.preventDefault(); setActiveHeading(heading.id); window.document.getElementById(heading.id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }); }}>{heading.text}</a></li>)}</ol></>}{tools}</aside><div className="j-article-column"><div className="j-prose" ref={contentRef} style={{ "--article-font-scale": fontScale } as CSSProperties} dangerouslySetInnerHTML={{ __html: html }} /><section className="j-revisions" aria-labelledby="revisions-heading"><h2 id="revisions-heading">修订记录</h2><ol>{revisions.map((revision, index) => <li key={`${revision.date}-${index}`}><time dateTime={revision.date}>{revision.date.slice(5).replace("-", ".")}</time><p>{revision.summary}</p></li>)}<li><time dateTime={publishedAt}>{journalDate(publishedAt)}</time><p>首次发布。</p></li></ol></section></div></div>
      <div className="j-article-trail"><nav className="j-neighbors" aria-label="相邻文章">{older && <Link href={`/articles/${older.slug}`}><span className="j-mono">上一篇 · No.{String(older.id).padStart(3, "0")}</span><h2>{older.title}</h2></Link>}{newer && <Link href={`/articles/${newer.slug}`}><span className="j-mono">下一篇 · No.{String(newer.id).padStart(3, "0")}</span><h2>{newer.title}</h2></Link>}</nav>{collection && <Link className="j-collection-trail" href={`/notes?collection=${collection.id}`}><div><span className="j-mono">合集 · 第 {position + 1} / {collectionArticles.length} 篇</span><b>{collection.name}</b><p>{collection.description}</p></div><progress className="j-collection-progress" value={position + 1} max={collectionArticles.length} aria-label="合集阅读位置" /></Link>}</div>
      {feedback && <div className="j-feedback" role="status">{feedback}</div>}
    </article>
  );
}
