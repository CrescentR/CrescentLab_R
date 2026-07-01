import { ChevronDown, Code2, Eye, Heading1, Image, Link, ListTree, Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const toolbar = [
  { label: "Heading", icon: Heading1 },
  { label: "Link", icon: Link },
  { label: "Image", icon: Image },
  { label: "Code", icon: Code2 },
  { label: "Structure", icon: ListTree },
];

export function EditorWorkspace() {
  return (
    <main className="flex h-screen min-h-[760px] flex-col overflow-hidden bg-[var(--background)]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-soft)] bg-[rgba(25,28,30,0.78)] px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Button className="hidden md:inline-flex" icon={<ChevronDown size={15} />} variant="ghost">
            Back
          </Button>
          <span className="h-6 w-px bg-[var(--border-soft)]" />
          <div className="min-w-0">
            <span className="block font-lab-mono text-xs font-medium uppercase text-[var(--muted)]">Draft</span>
            <strong className="block truncate font-lab-mono text-sm text-[var(--text-strong)]">Architecting the Moonlit Lab</strong>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/5 px-3 py-1.5 font-lab-mono text-xs text-[var(--muted)] md:flex">
          <span className="size-2 rounded-full bg-[var(--cyan)]" />
          Saved to cloud just now
        </div>
        <div className="flex items-center gap-2">
          <Button className="hidden sm:inline-flex" icon={<Eye size={15} />} variant="secondary">
            Preview
          </Button>
          <Button icon={<Save size={15} />} variant="primary">
            Publish
          </Button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--border-soft)] bg-[rgba(25,28,30,0.72)] lg:block">
          <div className="border-b border-[var(--border-soft)] px-4 py-4">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <Sparkles size={16} />
              <h2 className="font-lab-mono text-sm font-medium uppercase text-[var(--text)]">Metadata</h2>
            </div>
          </div>
          <div className="space-y-5 p-4">
            <Field label="URL Slug" value="architecting-the-moonlit-lab" />
            <Field label="Category" value="Design Systems" />
            <div>
              <span className="font-lab-mono text-xs text-[var(--muted)]">Tags</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="cyan">UI/UX</Badge>
                <Badge>Tailwind</Badge>
                <Badge tone="purple">Add Tag</Badge>
              </div>
            </div>
            <Field
              label="Meta Description"
              meta={<span className="text-[var(--muted-low)]">124/160</span>}
              multiline
              value="An in-depth look at building the Moonlit Lab design system, focusing on glassmorphism, developer experience, and high-fidelity typography."
            />
          </div>
        </aside>

        <div className="min-w-0 overflow-auto bg-[rgba(16,20,21,0.58)]">
          <div className="sticky top-0 z-10 flex justify-center border-b border-[var(--border-soft)] bg-[rgba(16,20,21,0.72)] py-3 backdrop-blur">
            <div className="glass-panel flex items-center gap-1 rounded-[var(--radius)] px-2 py-2">
              {toolbar.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    aria-label={item.label}
                    className="grid size-8 place-items-center rounded text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
                    key={item.label}
                    type="button"
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <article className="mx-auto max-w-3xl px-5 py-10 font-lab-mono text-sm leading-7 text-[rgba(224,227,229,0.9)] md:py-14">
            <p className="text-[var(--text-strong)]"># Architecting the Moonlit Lab</p>
            <p className="mt-6">
              The design system embodies a &quot;Moonlit Lab&quot; aesthetic, a fusion of a high-performance developer
              environment and a sophisticated personal operating system.
            </p>
            <p className="mt-6">
              It is designed for creators who treat their CMS as a digital sanctuary. The visual narrative is one of
              deep focus, quiet power, and high fidelity.
            </p>
            <p className="mt-6 text-[var(--text-strong)]">## The Glassmorphic Approach</p>
            <p className="mt-6">
              The style leans into glass surfaces, restrained contrast, precise metadata, and operational controls that
              stay quiet until the editor needs them.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
