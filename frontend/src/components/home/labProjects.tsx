import Link from "next/link";
import { MoonPhase } from "@/components/home/moonPhase";
import { journalDate, projectPhases, type JournalData } from "@/lib/journal";

export function LabProjects({ data }: { data: JournalData }) {
  const active = data.projects.filter((project) => project.phase !== "waning");
  const waning = data.projects.filter((project) => project.phase === "waning");
  return (
    <>
      <header className="j-project-heading j-rise"><div className="j-wrap"><div><h1>项目<em>Phases</em></h1><p>项目是已经形成稳定名称、明确用途和可维护边界的成果。每个项目用月相标记它所处的阶段，并把相关的长文和札记串在一起——过程和结论放在同一个地方。</p></div><div className="j-phase-track" aria-label="项目月相说明">{Object.entries(projectPhases).map(([key, value]) => <div key={key}><b><MoonPhase phase={value.phase} />{value.name}</b><span className="j-mono">{value.label} · {data.projects.filter((project) => project.phase === key).length}</span><small>{value.description}</small></div>)}</div></div></header>
      <div className="j-wrap"><div className="j-project-list">{active.map((project) => {
        const phase = project.phase ? projectPhases[project.phase] : null;
        const related = data.entries.filter((entry) => entry.item.project_id === project.id);
        return <article className="j-project-sheet j-rise" key={project.id} id={project.slug}>
          <div className="j-project-phase">{phase && <MoonPhase phase={phase.phase} size={64} />}<b>{phase ? phase.name : "阶段待补充"}</b>{phase && <span className="j-mono">{phase.label}</span>}</div>
          <div><h2><Link href={`/projects/${project.slug}`}>{project.name}</Link></h2><p className="j-project-description">{project.tagline}</p><dl className="j-project-facts"><div><dt className="j-mono">目标</dt><dd>{project.goal || "尚未填写"}</dd></div><div><dt className="j-mono">边界 · 不做</dt><dd>{project.boundary || "尚未填写"}</dd></div><div><dt className="j-mono">现在</dt><dd>{project.current_work || "尚未填写"}</dd></div></dl>
          <div className="j-project-trail"><h3>最近过程</h3>{related.slice(0, 3).map((entry) => <Link key={entry.key} href={entry.kind === "article" ? `/articles/${entry.item.slug}` : `/notes?entry=${entry.key}#${entry.key}`}><time className="j-date j-mono" dateTime={entry.date}>{journalDate(entry.date)}</time><span className={`j-entry-kind${entry.kind === "article" ? " is-long" : ""}`}>{entry.kind === "article" ? "长文" : entry.kind === "build" ? "进展" : "札记"}</span><span>{entry.kind === "article" ? entry.item.title : entry.kind === "note" ? entry.item.title : entry.item.name}</span><span aria-hidden="true">→</span></Link>)}{related.length > 3 && <Link className="j-project-trail-more" href={`/projects/${project.slug}`}>查看全部 {related.length} 条过程 →</Link>}{!related.length && <p className="j-empty-inline">还没有关联的公开记录。</p>}</div></div>
          <aside className="j-project-meta"><div><span className="j-count">{related.length}</span><p className="j-meta-label j-mono">条过程记录</p></div><p className="j-meta-label j-mono">最近更新 {journalDate(related[0]?.date ?? project.updated_at)}</p><div className="j-project-links">{project.repo_url && <a className="j-btn j-btn-ghost" href={project.repo_url} target="_blank" rel="noreferrer">GitHub ↗</a>}{project.demo_url && <a className="j-btn j-btn-ghost" href={project.demo_url} target="_blank" rel="noreferrer">访问项目 ↗</a>}</div></aside>
        </article>;
      })}</div>{!active.length && <p className="j-state">目前没有公开的进行中项目。</p>}
      <section className="j-waning"><h2>Waning</h2><p className="j-waning-description">下弦 · 已归档或放弃的项目，保留原因</p><ul>{waning.map((project) => <li key={project.id}><b><Link href={`/projects/${project.slug}`}>{project.name}</Link></b><span className={`j-tag${project.closure_kind === "abandoned" ? " j-give" : ""}`}>{project.closure_kind === "abandoned" ? "放弃" : project.closure_kind === "archived" ? "归档" : "收尾"}</span><p>{project.closure_reason || "原因尚未补充"}</p><time className="j-date j-mono" dateTime={project.updated_at}>{journalDate(project.updated_at, "full")}</time></li>)}</ul>{!waning.length && <p className="j-empty-inline">还没有公开的归档或放弃记录。</p>}</section>
      </div>
    </>
  );
}
