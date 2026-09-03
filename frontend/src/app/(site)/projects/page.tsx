import type { Metadata } from "next";
import { LabProjects } from "@/components/home/labProjects";
import { listPublicProjects } from "@/lib/api/projects";

export const metadata: Metadata = {
  title: "项目 — Crescent Index",
  description: "已经形成稳定名称、明确用途和可维护边界的成果。",
};

export default async function ProjectsPage() {
  const projects = await listPublicProjects().catch(() => null);
  if (!projects) return <LabProjects />;
  return (
    <div className="lab-section lab-shell">
      <h1>项目</h1>
      <div className="project-list">
        {projects.items.map((project) => (
          <a href={`/projects/${project.slug}`} key={project.id}>
            <span className="lab-mono">PROJECT / {project.slug}</span>
            <h2>{project.name}</h2>
            <p>{project.tagline || project.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
