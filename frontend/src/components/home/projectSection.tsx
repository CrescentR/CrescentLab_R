import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectSite } from "@/types/content";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { projectStatusLabel, toneBorderClass, toneDotClass, toneTextClass } from "./homeTone";

export function ProjectSection({ projects }: { projects: ProjectSite[] }) {
  return (
    <section className="home-project-band" id="labs">
      <div className="home-container py-16 md:py-24">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_1fr]" data-lab-animate>
          <div>
            <Badge tone="purple">Labs as pages</Badge>
            <h2 className="mt-4 max-w-2xl font-lab-display text-4xl font-semibold leading-tight text-[var(--text-strong)]">
              项目不用再单独搭介绍站。
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
            每个项目都像一篇增强文章：有独立页面、章节、状态、更新记录和关联文章，同时仍然属于同一个站点内容系统。
          </p>
        </div>

        <div className="mt-9 border-t border-[var(--border-soft)]">
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
      className="group grid gap-5 border-b border-[var(--border-soft)] py-10 md:grid-cols-[72px_minmax(0,1fr)_260px]"
      href={site.href}
      data-lab-animate
    >
      <span className="font-lab-mono text-xs text-[var(--muted-low)]">0{index}</span>
      <div className={cn("border-l-2 pl-5", toneBorderClass[site.tone])}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("size-2 rounded-full", toneDotClass[site.tone])} />
          <span className="font-lab-mono text-xs text-[var(--muted-low)]">{site.category}</span>
          <span className={cn("font-lab-mono text-xs", toneTextClass[site.tone])}>{projectStatusLabel[site.status]}</span>
        </div>
        <h3 className="mt-3 font-lab-display text-3xl font-semibold text-[var(--text-strong)] transition-colors group-hover:text-[var(--blue)]">
          {site.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-[var(--muted)]">{site.subtitle}</p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{site.description}</p>
      </div>
      <div className="flex flex-col justify-between gap-4 md:items-end">
        <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
          {site.sections.map((section) => (
            <span className="font-lab-mono text-[11px] text-[var(--muted)]" key={section}>
              {section}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 font-lab-mono text-xs text-[var(--blue)]">
          打开子站 <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
