import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectSite } from "@/types/content";
import { Badge } from "@/components/ui/badge";
import { projectStatusLabel } from "./homeTone";

export function ProjectSection({ projects }: { projects: ProjectSite[] }) {
  return (
    <section className="home-project-band" id="labs">
      <div className="home-container home-project-shell">
        <div className="home-project-heading" data-lab-animate>
          <h2>项目不用再单独搭介绍站。</h2>
          <p>
            每个项目都像一篇增强文章：有独立页面、章节、状态、更新记录和关联文章，同时仍然属于同一个站点内容系统。
          </p>
        </div>

        <div className="home-project-list">
          {projects.map((site, index) => (
            <ProjectSiteRow index={index + 1} key={site.id} site={site} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectSiteRow({ index, site }: { index: number; site: ProjectSite }) {
  return (
    <Link
      className="home-project-row group"
      href={site.href}
      data-lab-animate
    >
      <span className="home-project-index">0{index}</span>
      <div className="home-project-main">
        <div className="home-project-title-line">
          <h3>{site.title}</h3>
          <span>{site.subtitle}</span>
        </div>
        <div className="home-project-badges">
          <Badge tone={site.tone === "green" ? "green" : site.tone === "purple" ? "purple" : "cyan"}>{site.category}</Badge>
          <Badge tone={site.status === "live" ? "green" : site.status === "research" ? "amber" : "cyan"}>{projectStatusLabel[site.status]}</Badge>
        </div>
        <p>{site.description}</p>
        <div className="home-project-sections">
          {site.sections.map((section) => (
            <span key={section}>{section}</span>
          ))}
        </div>
      </div>
      <span className="home-project-link">
        打开子站 <ArrowRight size={13} />
      </span>
    </Link>
  );
}
