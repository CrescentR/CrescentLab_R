import { Newspaper } from "lucide-react";
import type { LabModule } from "@/types/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./sectionHeading";
import { toneBorderClass, toneTextClass } from "./homeTone";

export function ContentObjectsPanel({ modules }: { modules: LabModule[] }) {
  return (
    <aside className="grid gap-4 self-start lg:sticky lg:top-24" data-lab-animate id="about">
      <div className="home-side-panel p-5" id="signals">
        <SectionHeading eyebrow="Objects" icon={<Newspaper size={16} />} title="内容对象" compact />
        <div className="mt-4 divide-y divide-[var(--border-soft)]">
          {modules.map((module) => (
            <ContentObjectRow key={module.id} module={module} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function ContentObjectRow({ module }: { module: LabModule }) {
  return (
    <div className={cn("border-l-2 py-4 pl-4", toneBorderClass[module.tone])}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-strong)]">{module.title}</h3>
        <span className={cn("font-lab-mono text-[11px]", toneTextClass[module.tone])}>{module.status}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{module.description}</p>
    </div>
  );
}
