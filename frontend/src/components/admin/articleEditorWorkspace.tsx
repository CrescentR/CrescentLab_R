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

export function ArticleEditorWorkspace() {
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col bg-[var(--background-soft)] lg:h-[calc(100dvh-4rem)] lg:min-h-[700px] lg:overflow-hidden">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 shadow-[0_1px_0_var(--border-soft)] md:px-6">
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
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-1.5 font-lab-mono text-xs text-[var(--muted)] md:flex">
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

      <section className="grid min-h-0 flex-1 bg-[var(--background-soft)] lg:grid-cols-[304px_minmax(0,1fr)]">
        <aside className="hidden overflow-y-auto border-r border-[var(--border-soft)] bg-[var(--surface)] lg:block">
          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <Sparkles size={16} />
              <h2 className="font-lab-mono text-sm font-medium uppercase text-[var(--text)]">Metadata</h2>
            </div>
          </div>
          <div className="space-y-5 p-5">
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

        <div className="min-w-0 overflow-auto bg-[var(--background-soft)]">
          <div className="sticky top-0 z-10 flex justify-center border-b border-[var(--border-soft)] bg-[var(--surface-glass)] px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface)] px-2 py-2 shadow-[var(--shadow-tight)]">
              {toolbar.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    aria-label={item.label}
                    className="grid size-8 place-items-center rounded text-[var(--muted)] transition-colors hover:bg-[var(--surface-field)] hover:text-[var(--text-strong)]"
                    key={item.label}
                    type="button"
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <article className="mx-auto my-4 min-h-[calc(100%-6rem)] w-[calc(100%-2rem)] max-w-4xl rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface)] px-6 py-10 font-lab-mono text-sm leading-7 text-[var(--text)] shadow-[var(--shadow-tight)] md:my-6 md:px-12 md:py-14">
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
