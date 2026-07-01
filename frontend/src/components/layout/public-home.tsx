import Link from "next/link";
import { ArrowRight, BookOpen, Clock, PenLine, Tags } from "lucide-react";
import { articleSummaries } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export function PublicHome() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid size-10 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface)] text-[var(--cyan)]">
            <PenLine size={18} />
          </span>
          <span>
            <span className="block font-lab-display text-xl font-bold text-[var(--text-strong)]">CrescentLab</span>
            <span className="block font-lab-mono text-xs text-[var(--muted)]">Moonlit publishing workspace</span>
          </span>
        </Link>
        <ButtonLink href="/admin" icon={<ArrowRight size={16} />} variant="secondary">
          Open Console
        </ButtonLink>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="max-w-3xl">
            <Badge tone="cyan">CMS Shell</Badge>
            <h1 className="mt-5 font-lab-display text-4xl font-semibold leading-tight text-[var(--text-strong)] md:text-5xl">
              A focused blog and content system for creators who live in their tools.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              The first framework pass includes the public reading surface, admin shell, editor workspace, settings
              foundation, and frontend state/query boundaries. API contracts are intentionally deferred.
            </p>
          </div>

          <div className="grid gap-4">
            {articleSummaries.map((article) => (
              <Panel className="p-5 transition-colors hover:border-[rgba(76,215,246,0.35)]" key={article.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "purple"}>
                        {article.status}
                      </Badge>
                      <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.category}</span>
                    </div>
                    <h2 className="mt-3 font-lab-display text-2xl font-semibold text-[var(--text-strong)]">{article.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p>
                  </div>
                  <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.readTime}</span>
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <BookOpen size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Architecture Focus</h2>
            </div>
            <div className="mt-4 space-y-3 font-lab-mono text-sm text-[var(--muted)]">
              <p>Next.js App Router</p>
              <p>Go backend shell</p>
              <p>Static mock data first</p>
              <p>API client boundary reserved</p>
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <Tags size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Prototype Tokens</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="cyan">glass panels</Badge>
              <Badge tone="purple">moonlight action</Badge>
              <Badge>mono labels</Badge>
              <Badge>dense tables</Badge>
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <Clock size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Current Stage</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Frontend framework, layouts, and toolchain are in place. Data models and HTTP interfaces are the next
              architecture layer.
            </p>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
