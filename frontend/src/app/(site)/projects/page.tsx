import type { Metadata } from "next";
import { LabProjects } from "@/components/home/labProjects";
import { listPublicProjects } from "@/lib/api/projects";
import Link from "next/link";

export const metadata: Metadata = {
  title: "项目 — Crescent Index",
  description: "已经形成稳定名称、明确用途和可维护边界的成果。",
};

export default async function ProjectsPage() {
  const projects = await listPublicProjects().catch(() => null);
  if (!projects) return <LabProjects />;
  return (
    <div className="lab-section lab-shell">
      <header className="lab-section-intro">
        <span className="lab-mono lab-section-index">03 / 项目</span>
        <h1>项目</h1>
        <p>已经形成稳定名称、明确用途和可维护边界的成果。</p>
      </header>
      {projects.items.length === 0 && <p className="lab-empty-copy">目前还没有公开的项目。</p>}
      <div className="project-list">
        {projects.items.map((project) => (
          <Link href={`/projects/${project.slug}`} key={project.id}>
            <span className="lab-mono">PROJECT / {project.slug}</span>
            <h2>{project.name}</h2>
            <p>{project.tagline || project.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
