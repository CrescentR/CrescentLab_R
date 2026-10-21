import { LabHero } from "@/components/home/labHero";
import { listPublicProjects } from "@/lib/api/projects";
import Link from "next/link";

export default async function HomePage() {
  const projects = await listPublicProjects().catch(() => null);

  return (
    <>
      <LabHero />
      <section className="lab-latest">
        <div className="lab-shell">
          <header className="lab-latest-heading">
            <h2 className="lab-mono">最近更新 / LATEST</h2>
            <Link href="/updates">全部动态 →</Link>
          </header>
          {projects === null ? (
            <p className="lab-empty-copy">项目加载失败，请刷新页面重试。</p>
          ) : projects.items.length === 0 ? (
            <p className="lab-empty-copy">目前还没有公开的项目。</p>
          ) : (
            <div className="lab-latest-grid">
              {projects.items.slice(0, 3).map((project) => (
                <Link className="lab-latest-card" href={`/projects/${project.slug}`} key={project.id}>
                  <div className="lab-latest-meta lab-mono"><b>项目</b><span>{project.tech_stack?.join(" / ")}</span></div>
                  <h3>{project.name}</h3>
                  {project.tagline && <p>{project.tagline}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
