import type { LabModule } from "@/types/content";
import { cn } from "@/lib/utils";
import { toneTextClass } from "./homeTone";

export function ContentObjectsPanel({ modules }: { modules: LabModule[] }) {
  return (
    <aside className="home-content-panel" data-lab-animate id="signals">
      {modules.map((module) => (
        <ContentObjectRow key={module.id} module={module} />
      ))}
    </aside>
  );
}

function ContentObjectRow({ module }: { module: LabModule }) {
  return (
    <article className="home-content-object" id={module.id === "reading-room" ? "about" : undefined}>
      <div className="home-content-object-head">
        <h3>{module.title}</h3>
        <span className={cn("home-content-object-status", toneTextClass[module.tone])}>{module.status}</span>
      </div>
      <p>{module.description}</p>
    </article>
  );
}
