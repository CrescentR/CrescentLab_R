"use client";

import { ArticleTitle } from "@/components/articles/articleTitle";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { MoonPhase } from "@/components/home/moonPhase";
import { lunarPhase } from "@/lib/moon";
import { entryLabel, entryText, journalDate, projectPhases, type JournalData } from "@/lib/journal";

export function LabHero({ data, timestamp }: { data: JournalData; timestamp: number }) {
  const { articles, entries, projects, collections } = data;
  const featured = articles[0];
  const [category, setCategory] = useState<number | null>(null);
  const [preview, setPreview] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const logs = entries.filter((entry) => entry.kind !== "article").slice(0, 4);
  const index = articles.slice(1).filter((article) => category === null || article.category_id === category);

  function showPreview(event: PointerEvent<HTMLAnchorElement>, cover: string) {
    if (!cover || !window.matchMedia("(hover:hover) and (prefers-reduced-motion:no-preference)").matches) return;
    setPreview(cover);
    const element = previewRef.current;
    if (element) { element.style.left = `${Math.min(innerWidth - 130, Math.max(130, event.clientX))}px`; element.style.top = `${Math.max(200, event.clientY)}px`; }
  }

  return (
    <>
      <div className="j-mast"><div className="j-wrap j-mono"><span>{featured ? `No. ${String(featured.id).padStart(3, "0")}` : "CRESCENT INDEX"}</span><span className="j-hide-mobile">记录进展 · 整理方法 · 分享成果</span><span><MoonPhase phase={lunarPhase(timestamp)} size={14} />{journalDate(new Date(timestamp).toISOString(), "full")} · UTC+8</span></div></div>
      <section className="j-home-hero"><div className="j-wrap">
        {featured ? <article className="j-featured">
          <div className="j-kicker j-rise"><span className="j-tag j-long-label">最新长文</span><span className="j-mono">No.{String(featured.id).padStart(3, "0")} {featured.category_name && `· ${featured.category_name}`} · {featured.reading_time_minutes} 分钟</span></div>
          <h1 className="j-rise j-delay1"><Link href={`/articles/${featured.slug}`}><ArticleTitle title={featured.title} emphasis={featured.title_emphasis} /></Link></h1>
          {featured.excerpt && <p className="j-excerpt j-rise j-delay2">{featured.excerpt}</p>}
          <div className="j-featured-actions j-rise j-delay3"><Link className="j-btn" href={`/articles/${featured.slug}`}>阅读全文 →</Link>{projects.filter((project) => project.id === featured.project_id).map((project) => <Link className="j-linked-project" key={project.id} href={`/projects/${project.slug}`}>{project.phase && <MoonPhase phase={projectPhases[project.phase].phase} size={16} />}关联项目 <b>{project.name}</b></Link>)}<span className="j-linked-project j-mono">{journalDate(featured.published_at || featured.created_at)} 发布</span></div>
          {featured.cover_url && <figure className="j-featured-cover j-rise j-delay4"><Image src={featured.cover_url} alt={featured.title} fill sizes="(max-width:860px) 100vw, 708px" priority unoptimized /><figcaption className="j-mono">封面 / {String(featured.id).padStart(3, "0")}</figcaption></figure>}
        </article> : <article className="j-featured j-rise"><div className="j-kicker j-mono">Independent digital practice</div><h1>记录进展，<br />整理方法，分享成果。</h1><p className="j-excerpt">一份持续更新的个人刊物。长文、札记和项目，记录想法逐渐成形的过程。</p><Link className="j-btn" href="/notes">翻开笔记 →</Link></article>}
        <aside className="j-logs j-rise j-delay2" aria-labelledby="logs-heading"><div className="j-logs-heading"><h2 id="logs-heading">札记</h2><Link href="/notes?kind=short">全部 →</Link></div>{logs.length ? <ol>{logs.map((entry) => <li key={entry.key}><div className="j-meta-row j-mono"><time dateTime={entry.date}>{journalDate(entry.date)}</time><span className={`j-tag${entryLabel(entry) === "放弃" ? " j-give" : ""}`}>{entryLabel(entry)}</span></div><Link href={`/notes?entry=${entry.key}#${entry.key}`}><p>{entryText(entry)}</p></Link></li>)}</ol> : <p className="j-empty-inline">还没有公开的札记。</p>}</aside>
      </div></section>
      <section className="j-section"><div className="j-wrap"><div className="j-section-heading"><div className="j-heading-label"><h2>Index</h2><span className="j-mono">长文索引 · 共 {articles.length} 篇</span></div><div className="j-filters" role="group" aria-label="按主题筛选"><button className="j-chip" aria-pressed={category === null} onClick={() => setCategory(null)}>全部</button>{collections.filter((collection) => articles.some((article) => article.category_id === collection.id)).map((collection) => <button key={collection.id} className="j-chip" aria-pressed={category === collection.id} onClick={() => setCategory(collection.id)}>{collection.name}</button>)}</div></div>
        <ol className="j-index">{index.map((article) => <li key={article.id}><Link href={`/articles/${article.slug}`} onPointerMove={(event) => showPreview(event, article.cover_url)} onPointerLeave={() => setPreview("")} onBlur={() => setPreview("")}><span className="j-number">{String(article.id).padStart(3, "0")}</span><h3>{article.title}</h3><span className="j-category j-mono">{article.category_name || "长文"}</span><time className="j-date j-mono" dateTime={article.published_at || article.created_at}>{journalDate(article.published_at || article.created_at)}</time><span className="j-duration j-mono">{article.reading_time_minutes} 分钟</span><span className="j-arrow" aria-hidden="true">→</span></Link></li>)}</ol>{!index.length && <p className="j-empty-inline">{featured ? "这个主题下暂时没有其他长文。" : "发布后，长文会出现在这里。"}</p>}
      </div></section>
      <section className="j-section"><div className="j-wrap"><div className="j-section-heading"><div className="j-heading-label"><h2>Collections</h2><span className="j-mono">按主题连续阅读</span></div><Link href="/notes#collections">全部合集 →</Link></div><div className="j-collections">{collections.map((collection) => <Link className="j-collection" href={`/notes?collection=${collection.id}`} key={collection.id}><span className="j-count">{String(collection.article_count).padStart(2, "0")}</span><h3>{collection.name}</h3><p>{collection.description}</p></Link>)}</div>{!collections.length && <p className="j-empty-inline">还没有公开的合集。</p>}</div></section>
      <section className="j-section"><div className="j-wrap"><div className="j-section-heading"><div className="j-heading-label"><h2>Projects</h2><span className="j-mono">正在被写进笔记的项目</span></div><Link href="/projects">月相索引 →</Link></div><div className="j-project-strip">{projects.filter((project) => project.phase !== "waning").slice(0, 3).map((project) => <Link href={`/projects/${project.slug}`} key={project.id}><span className="j-phase-line j-mono">{project.phase ? <><MoonPhase phase={projectPhases[project.phase].phase} />{projectPhases[project.phase].name} · {projectPhases[project.phase].label}</> : "阶段待补充"}</span><h3>{project.name}</h3><p>{project.tagline}</p></Link>)}</div>{!projects.length && <p className="j-empty-inline">还没有公开的项目。</p>}</div></section>
      <div className={`j-peek${preview ? " is-visible" : ""}`} ref={previewRef} aria-hidden="true">{preview && <Image src={preview} alt="" fill sizes="240px" unoptimized />}</div>
    </>
  );
}
