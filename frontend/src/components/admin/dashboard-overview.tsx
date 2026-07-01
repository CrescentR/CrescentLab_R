import Link from "next/link";
import { ArrowRight, FileText, Image, MessageSquare, Settings, Users } from "lucide-react";
import { articleSummaries } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

const metrics = [
  { label: "Drafts", value: "12", icon: FileText },
  { label: "Users", value: "3", icon: Users },
  { label: "Media Items", value: "248", icon: Image },
  { label: "Comments", value: "31", icon: MessageSquare },
];

export function DashboardOverview() {
  return (
    <main className="flex-1 overflow-auto px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
          <div>
            <Badge tone="cyan">Admin Console</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">Workspace Overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              A static first-pass dashboard that mirrors the Figma direction without binding to backend contracts yet.
            </p>
          </div>
          <ButtonLink href="/admin/post-management/new" icon={<ArrowRight size={16} />} variant="primary">
            Start Draft
          </ButtonLink>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Panel className="p-5" key={metric.label}>
                <div className="flex items-center justify-between">
                  <span className="font-lab-mono text-xs text-[var(--muted)]">{metric.label}</span>
                  <Icon className="text-[var(--cyan)]" size={18} />
                </div>
                <strong className="mt-5 block font-lab-display text-4xl font-semibold text-[var(--text-strong)]">
                  {metric.value}
                </strong>
              </Panel>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Panel>
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Recent Articles</h2>
              <Link className="font-lab-mono text-xs text-[var(--cyan)]" href="/admin/post-management/new">
                New Draft
              </Link>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {articleSummaries.map((article) => (
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4" key={article.id}>
                  <div>
                    <h3 className="font-lab-display font-semibold text-[var(--text)]">{article.title}</h3>
                    <p className="mt-1 font-lab-mono text-xs text-[var(--muted-low)]">
                      {article.category} / updated {article.updatedAt}
                    </p>
                  </div>
                  <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "purple"}>
                    {article.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <Settings size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Foundation Map</h2>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--muted)]">
              <p>App Router route groups will separate public pages, auth flows, music, albums, and admin modules.</p>
              <p>Zustand holds local UI state; TanStack Query and Axios are reserved for backend integration.</p>
              <p>Design tokens live in global CSS so HeroUI or shadcn/ui can be introduced later without repainting the app.</p>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
