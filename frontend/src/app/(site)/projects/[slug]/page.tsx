import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import { getPublicProject } from "@/lib/api/projects";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublicProject(slug).catch(() => notFound());
  return (
    <article className="project-detail lab-shell">
      <header className="project-detail-hero">
        <p className="lab-mono">PROJECT / {project.slug}</p>
        <h1>{project.name}</h1>
        {project.tagline && <p>{project.tagline}</p>}
        <div className="project-detail-links">
          {project.repo_url && <a href={project.repo_url}>代码仓库 ↗</a>}
          {project.demo_url && <a href={project.demo_url}>在线演示 ↗</a>}
        </div>
      </header>
      <div className="project-detail-layout">
        <main className="project-readme prose">
          {project.source_format === "mdx" ? <MDXRemote source={project.content_md} components={mdxComponents} /> : <div dangerouslySetInnerHTML={{ __html: project.content_html }} />}
        </main>
        <aside className="project-detail-meta"><strong>技术栈</strong>{project.tech_stack.map((item) => <span key={item}>{item}</span>)}</aside>
      </div>
    </article>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return <aside className="project-readme-callout">{children}</aside>;
}

const mdxComponents = { Callout };
