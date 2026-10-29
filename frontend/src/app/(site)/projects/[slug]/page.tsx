import Link from "next/link";
import { MoonPhase } from "@/components/home/moonPhase";
import { entryLabel, journalDate, loadJournal, projectPhases, type JournalEntry } from "@/lib/journal";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import { getPublicProject } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, journal] = await Promise.all([
    getPublicProject(slug).catch((error) => { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }),
    loadJournal(),
  ]);
  const entries = journal.entries.filter((entry) => entry.item.project_id === project.id);
  const nextStep = entries.find((entry) => entry.kind === "build" && entry.item.next_step);
  const hasReadme = project.source_format === "mdx" ? project.content_md.trim() !== "" : project.content_html.replace(/<[^>]*>/g, "").trim() !== "";
  return (
    <article className="j-project-detail j-wrap">
      <header className="j-project-detail-header">
        <p className="j-breadcrumb j-mono"><Link href="/projects">项目</Link><span>/</span><span>{project.slug}</span></p>
        <h1>{project.name}</h1>
        {project.tagline && <p className="j-project-detail-tagline">{project.tagline}</p>}
        <ol className="j-phase-steps" aria-label="项目月相">
          {Object.entries(projectPhases).map(([key, phase]) => (
            <li key={key} aria-current={project.phase === key ? "step" : undefined}><MoonPhase phase={phase.phase} size={18} /><b>{phase.name}</b><span className="j-mono">{phase.label}</span></li>
          ))}
        </ol>
        {(project.repo_url || project.demo_url || Boolean(project.tech_stack?.length)) && <div className="j-project-detail-links">
          {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer">代码仓库 ↗</a>}
          {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer">在线演示 ↗</a>}
          {Boolean(project.tech_stack?.length) && <span className="j-project-stack j-mono">{project.tech_stack?.join(" · ")}</span>}
        </div>}
      </header>

      {project.phase === "waning" && <section className="j-revisions j-project-closure"><h2>{project.closure_kind === "abandoned" ? "放弃原因" : "归档原因"}</h2><p>{project.closure_reason || "原因尚未补充"}</p></section>}

      <dl className="j-project-facts j-project-detail-facts">
        <div><dt className="j-mono">目标</dt><dd>{project.goal || "尚未填写"}</dd></div>
        <div><dt className="j-mono">边界 · 不做</dt><dd>{project.boundary || "尚未填写"}</dd></div>
        <div><dt className="j-mono">现在</dt><dd>{project.current_work || "尚未填写"}</dd></div>
        {nextStep?.kind === "build" && <div><dt className="j-mono">下一步</dt><dd>{nextStep.item.next_step}</dd></div>}
      </dl>

      <section className="j-project-process" aria-labelledby="project-process-heading">
        <div className="j-section-heading"><div className="j-heading-label"><h2 id="project-process-heading">Process</h2><span className="j-mono">过程 · 共 {entries.length} 条</span></div></div>
        {entries.length ? <ol className="j-process-list">{entries.map((entry) => <ProcessEntry entry={entry} key={entry.key} />)}</ol> : <p className="j-empty-inline">还没有公开的进展、长文或札记。</p>}
      </section>

      {hasReadme && (
        <section className="j-project-readme" aria-labelledby="project-readme-heading">
          <div className="j-section-heading"><div className="j-heading-label"><h2 id="project-readme-heading">README</h2><span className="j-mono">关于这个项目</span></div></div>
          <div className="j-prose">
            {project.source_format === "mdx" ? <MDXRemote source={project.content_md} components={mdxComponents} /> : <div dangerouslySetInnerHTML={{ __html: project.content_html }} />}
          </div>
        </section>
      )}
    </article>
  );
}

function ProcessEntry({ entry }: { entry: JournalEntry }) {
  const href = entry.kind === "article" ? `/articles/${entry.item.slug}` : `/notes?entry=${entry.key}#${entry.key}`;
  const title = entry.kind === "build" ? entry.item.name : entry.item.title;
  const text = entry.kind === "article" ? entry.item.excerpt : entry.kind === "note" ? entry.item.observation || entry.item.conclusion : entry.item.latest_progress;
  return (
    <li className={`j-process-entry is-${entry.kind}`}>
      <time className="j-mono" dateTime={entry.date}>{journalDate(entry.date, "full")}</time>
      <span className={`j-tag${entry.kind === "article" ? " j-long-label" : ""}`}>{entryLabel(entry)}</span>
      <Link href={href}><h3>{title}</h3>{text && <p>{text}</p>}</Link>
    </li>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return <aside className="j-callout">{children}</aside>;
}

const mdxComponents = { Callout };
