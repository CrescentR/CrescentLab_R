import { ArrowRight, Construction, DatabaseZap, PanelTop, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_360px]">
        <Panel className="lab-card p-6 md:p-8">
          <div className="flex items-center gap-3 text-[var(--cyan)]">
            <Construction size={22} />
            <Badge tone="cyan">Reserved Module</Badge>
          </div>
          <h1 className="mt-5 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              { label: "API boundary", icon: DatabaseZap },
              { label: "State model", icon: Workflow },
              { label: "UI surface", icon: PanelTop },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-4" key={item.label}>
                  <Icon className="text-[var(--cyan)]" size={18} />
                  <span className="mt-3 block font-lab-mono text-xs text-[var(--text)]">{item.label}</span>
                </div>
              );
            })}
          </div>
          <Button className="mt-6" icon={<ArrowRight size={15} />} variant="secondary">
            Prototype module later
          </Button>
        </Panel>

        <Panel className="lab-card p-5">
          <Badge tone="amber">Next pass</Badge>
          <h2 className="mt-4 font-lab-display text-xl font-semibold text-[var(--text-strong)]">模块落地顺序</h2>
          <div className="mt-5 space-y-3">
            {["Define mock states", "Connect table/list layout", "Bind API client once backend exists"].map((step, index) => (
              <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] px-3 py-3" key={step}>
                <span className="grid size-7 place-items-center rounded bg-[var(--surface-raised)] font-lab-mono text-xs text-[var(--cyan)]">0{index + 1}</span>
                <span className="text-sm text-[var(--text)]">{step}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
