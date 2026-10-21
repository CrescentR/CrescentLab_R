"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MoonPhase } from "@/components/home/moonPhase";
import { entryLabel, entryText, journalDate, projectPhases, type JournalData, type JournalEntry } from "@/lib/journal";

export function NotesExperience({ data, initialQuery = "", initialKind = "all", initialCollection = "", initialEntry = "" }: { data: JournalData; initialQuery?: string; initialKind?: string; initialCollection?: string; initialEntry?: string }) {
  const [kind, setKind] = useState(initialKind);
  const [topic, setTopic] = useState("");
  const [collectionId, setCollectionId] = useState(initialCollection);
  const [projectId, setProjectId] = useState("");
  const [year, setYear] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [limit, setLimit] = useState(() => Math.max(20, data.entries.findIndex((entry) => entry.key === initialEntry) + 1));
  const shortCount = data.entries.length - data.articles.length;
  const topics = [...new Set(data.entries.flatMap((entry) => entry.kind === "article" ? (entry.item.category_name ? [entry.item.category_name] : []) : entry.kind === "note" ? entry.item.tags : []))];
  const years = [...new Set(data.entries.map((entry) => journalDate(entry.date, "full").slice(0, 4)))];
  const filtered = useMemo(() => data.entries.filter((entry) => {
    if (kind === "article" && entry.kind !== "article") return false;
    if (kind === "short" && entry.kind === "article") return false;
    if (topic && !(entry.kind === "article" ? entry.item.category_name === topic : entry.kind === "note" && entry.item.tags.includes(topic))) return false;
    if (collectionId && (entry.kind !== "article" || String(entry.item.category_id) !== collectionId)) return false;
    if (projectId && String(entry.item.project_id) !== projectId) return false;
    if (year && !journalDate(entry.date, "full").startsWith(year)) return false;
    return !query || entryText(entry).toLocaleLowerCase().includes(query.toLocaleLowerCase());
  }), [data.entries, kind, topic, collectionId, projectId, year, query]);
  const groups = new Map<string, JournalEntry[]>();
  for (const entry of filtered.slice(0, limit)) {
    const month = journalDate(entry.date, "month");
    const group = groups.get(month) || [];
    group.push(entry); groups.set(month, group);
  }

  function resetFilters() { setKind("all"); setTopic(""); setCollectionId(""); setProjectId(""); setYear(""); setQuery(""); setLimit(20); }

  return (
    <>
      <header className="j-notes-heading j-rise"><div className="j-wrap"><div><h1>笔记<em>Notes</em></h1><p>长文是已经整理好、值得完整阅读的结论；札记是过程中的进展、判断和放弃。两者按时间排在一起，你能看到一个想法是怎么长成一篇文章的。</p></div><dl className="j-stats"><div><dd>{data.articles.length}</dd><dt className="j-mono">长文</dt></div><div><dd>{shortCount}</dd><dt className="j-mono">札记</dt></div><div><dd>{data.collections.length}</dd><dt className="j-mono">合集</dt></div></dl></div></header>
      <div className="j-filterbar"><div className="j-wrap"><div className="j-segment" role="group" aria-label="内容类型">{[["all", "全部", data.entries.length], ["article", "长文", data.articles.length], ["short", "札记", shortCount]].map(([value, label, count]) => <button key={value} aria-pressed={kind === value} onClick={() => { setKind(String(value)); setLimit(20); }}>{label}<small>{count}</small></button>)}</div><div className="j-chips" role="group" aria-label="主题筛选"><button className="j-chip" aria-pressed={!topic} onClick={() => { setTopic(""); setLimit(20); }}>全部主题</button>{topics.map((label) => <button className="j-chip" aria-pressed={topic === label} key={label} onClick={() => { setTopic(label); setLimit(20); }}>{label}</button>)}</div></div></div>
      <div className="j-wrap j-notes-layout"><div id="archive">
        <form className="j-notes-search" role="search" onSubmit={(event) => event.preventDefault()}><label htmlFor="notes-search">搜索笔记</label><input id="notes-search" type="search" value={query} placeholder="搜索标题、摘要或札记…" onChange={(event) => { setQuery(event.target.value); setLimit(20); }} />{(query || collectionId || projectId || year) && <button className="j-btn j-btn-ghost" type="button" onClick={resetFilters}>清除筛选</button>}</form>
        {[...groups].map(([month, entries]) => <section className="j-month j-rise" key={month}><h2><b>{month.slice(5)}</b><span className="j-mono">{month.slice(0, 4)} · {Number(month.slice(5))}月</span></h2><ol className="j-feed">{entries.map((entry) => entry.kind === "article" ? <li className="j-long-entry" id={entry.key} key={entry.key}><Link className={entry.item.cover_url ? "has-cover" : ""} href={`/articles/${entry.item.slug}`}><div><div className="j-entry-meta j-mono"><span className="j-tag j-long-label">长文</span><span>No.{String(entry.item.id).padStart(3, "0")}</span>{entry.item.category_name && <span>{entry.item.category_name}</span>}<time dateTime={entry.date}>{journalDate(entry.date)}</time><span>{entry.item.reading_time_minutes} 分钟</span>{data.projects.filter((project) => project.id === entry.item.project_id).map((project) => <span className="j-project-tag" key={project.id}>{project.phase && <MoonPhase phase={projectPhases[project.phase].phase} size={13} />}{project.name}</span>)}</div><h3>{entry.item.title}</h3>{entry.item.excerpt && <p>{entry.item.excerpt}</p>}</div>{entry.item.cover_url && <div className="j-thumbnail"><Image alt="" src={entry.item.cover_url} fill sizes="(max-width:860px) 84px, 168px" unoptimized /></div>}</Link></li> : <li className="j-short-entry" id={entry.key} key={entry.key}><div className="j-entry-meta j-mono"><time dateTime={entry.date}>{journalDate(entry.date)}</time><span className={`j-tag${entryLabel(entry) === "放弃" ? " j-give" : ""}`}>{entryLabel(entry)}</span>{data.projects.filter((project) => project.id === entry.item.project_id).map((project) => <Link href={`/projects/${project.slug}`} key={project.id}>{project.name}</Link>)}</div><p>{entryText(entry)}</p></li>)}</ol></section>)}
        {!groups.size && <div className="j-state"><h2>{data.entries.length ? "没有匹配的记录" : "还没有公开的笔记"}</h2><p>{data.entries.length ? "试试其他筛选条件。" : "发布长文或札记后，内容会按月份显示在这里。"}</p></div>}
        {filtered.length > limit && <div className="j-more"><button className="j-btn j-btn-ghost" onClick={() => setLimit(limit + 20)}>加载更早的记录</button></div>}
      </div><aside className="j-sidebar"><section id="collections"><h2>合集</h2><ul>{data.collections.map((collection) => <li key={collection.id}><button aria-pressed={collectionId === String(collection.id)} onClick={() => { setCollectionId(collectionId === String(collection.id) ? "" : String(collection.id)); setLimit(20); }}><span>{collection.name}</span><span>{String(collection.article_count).padStart(2, "0")}</span></button></li>)}</ul>{!data.collections.length && <p className="j-empty-inline">暂无合集</p>}</section><section><h2>按项目</h2><ul>{data.projects.map((project) => <li key={project.id}><button aria-pressed={projectId === String(project.id)} onClick={() => { setProjectId(projectId === String(project.id) ? "" : String(project.id)); setLimit(20); }}><span className="j-project-tag">{project.phase && <MoonPhase phase={projectPhases[project.phase].phase} size={14} />}{project.name}</span><span>{data.entries.filter((entry) => entry.item.project_id === project.id).length}</span></button></li>)}</ul>{!data.projects.length && <p className="j-empty-inline">暂无公开项目</p>}</section><section><h2>归档</h2><ul>{years.map((value) => <li key={value}><button aria-pressed={year === value} onClick={() => { setYear(year === value ? "" : value); setLimit(20); }}><span>{value}</span><span>{data.entries.filter((entry) => journalDate(entry.date, "full").startsWith(value)).length}</span></button></li>)}</ul></section></aside></div>
    </>
  );
}
