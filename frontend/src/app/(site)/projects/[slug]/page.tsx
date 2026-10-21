import Link from "next/link";
import { MoonPhase } from "@/components/home/moonPhase";
import { projectPhases } from "@/lib/journal";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import { getPublicProject } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublicProject(slug).catch((error) => { if (error instanceof ApiError && error.status === 404) notFound(); throw error; });
  return (
    <article className="j-project-detail j-wrap">
      <header className="j-project-detail-header">
        <p className="j-mono"><Link href="/projects">项目</Link> / {project.slug}</p>
        {project.phase && <p className="j-project-tag"><MoonPhase phase={projectPhases[project.phase].phase} />{projectPhases[project.phase].name} · {projectPhases[project.phase].label}</p>}
        <h1>{project.name}</h1>
        {project.tagline && <p>{project.tagline}</p>}
        <div className="j-project-detail-links">
          {project.repo_url && <a href={project.repo_url}>代码仓库 ↗</a>}
          {project.demo_url && <a href={project.demo_url}>在线演示 ↗</a>}
        </div>
      </header>
      <div className="j-project-detail-layout">
        <div>
          <dl className="j-project-facts"><div><dt className="j-mono">目标</dt><dd>{project.goal || "尚未填写"}</dd></div><div><dt className="j-mono">边界 · 不做</dt><dd>{project.boundary || "尚未填写"}</dd></div><div><dt className="j-mono">现在</dt><dd>{project.current_work || "尚未填写"}</dd></div></dl>
          {(project.phase === "waning" || project.status === "archived") && <section className="j-revisions"><h2>{project.closure_kind === "abandoned" ? "放弃原因" : "归档原因"}</h2><p>{project.closure_reason || "原因尚未补充"}</p></section>}
          {project.progress_percent !== null && <p className="j-mono">路线进度 · {project.progress_percent}%</p>}
          <div className="j-prose">
          {project.source_format === "mdx" ? <MDXRemote source={project.content_md} components={mdxComponents} /> : <div dangerouslySetInnerHTML={{ __html: project.content_html }} />}
          </div>
        </div>
        <aside className="j-project-detail-meta"><strong>技术栈</strong>{(project.tech_stack || []).map((item) => <span key={item}>{item}</span>)}</aside>
      </div>
    </article>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return <aside className="j-callout">{children}</aside>;
}

const mdxComponents = { Callout };
