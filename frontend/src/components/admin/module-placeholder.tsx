import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex-1 overflow-auto px-5 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Panel className="p-8">
          <div className="flex items-center gap-3 text-[var(--cyan)]">
            <Construction size={22} />
            <Badge tone="cyan">Reserved Module</Badge>
          </div>
          <h1 className="mt-5 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        </Panel>
      </div>
    </main>
  );
}
