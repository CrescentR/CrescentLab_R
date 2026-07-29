"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitFork,
  Globe,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { TipTapEditor } from "@/components/admin/tiptapEditor";
import {
  createAdminProject,
  deleteAdminProject,
  listAdminProjects,
  publishAdminProject,
  updateAdminProject,
  type ProjectInput,
  type ProjectListItem,
} from "@/lib/api/projects";

type ProjectFormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  content_html: string;
  cover_url: string;
  repo_url: string;
  demo_url: string;
  tech_stack: string;
};

type SaveStatus = "idle" | "saving" | "saved";

const ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateSlug(): string {
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return result;
}

function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, "```\n$1\n```\n");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<ul[^>]*>/gi, "\n");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

const emptyForm: ProjectFormState = {
  name: "",
  slug: generateSlug(),
  tagline: "",
  description: "",
  content_html: "<p></p>",
  cover_url: "",
  repo_url: "",
  demo_url: "",
  tech_stack: "",
};

export function ProjectWorkspace() {
  const { push } = useToast();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"list" | "editor">("list");
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminProjects({ page_size: 50 });
      setProjects(result.items);
    } catch (err) {
      push(extractErrorMessage(err, "加载项目列表失败"), "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function handleNew() {
    setForm({ ...emptyForm, slug: generateSlug() });
    setProjectId(null);
    setStatus("draft");
    setActiveView("editor");
  }

  function handleEdit(project: ProjectListItem) {
    setForm({
      name: project.name,
      slug: project.slug,
      tagline: project.tagline,
      description: "",
      content_html: "",
      cover_url: project.cover_url,
      repo_url: project.repo_url,
      demo_url: project.demo_url,
      tech_stack: project.tech_stack.join(", "),
    });
    setProjectId(project.id);
    setStatus(project.status as "draft" | "published");
    setActiveView("editor");
  }

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildApiInput(): ProjectInput {
    return {
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      description: form.description,
      content_md: htmlToMarkdown(form.content_html),
      cover_url: form.cover_url,
      repo_url: form.repo_url,
      demo_url: form.demo_url,
      status: "draft",
      tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
    };
  }

  async function handleSave() {
    if (!form.name.trim()) {
      push("项目名称为必填项", "error");
      return;
    }
    setSaving(true);
    setSaveStatus("saving");
    try {
      if (projectId) {
        const result = await updateAdminProject(projectId, buildApiInput());
        setStatus(result.status as "draft" | "published");
        push("项目已保存", "success");
      } else {
        const result = await createAdminProject(buildApiInput());
        setProjectId(result.id);
        setStatus(result.status as "draft" | "published");
        push("项目已创建", "success");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      push(extractErrorMessage(err, "保存失败"), "error");
      setSaveStatus("idle");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!form.name.trim()) {
      push("项目名称为必填项", "error");
      return;
    }
    setSaving(true);
    try {
      let targetId = projectId;
      if (!targetId) {
        const created = await createAdminProject(buildApiInput());
        targetId = created.id;
        setProjectId(created.id);
      }
      const result = await publishAdminProject(targetId, {
        name: form.name,
        slug: form.slug,
        tagline: form.tagline,
        description: form.description,
        content_md: htmlToMarkdown(form.content_html),
        cover_url: form.cover_url,
        repo_url: form.repo_url,
        demo_url: form.demo_url,
        tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setStatus(result.status as "draft" | "published");
      push("项目已发布", "success");
    } catch (err) {
      push(extractErrorMessage(err, "发布失败"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定要删除这个项目吗？")) return;
    try {
      await deleteAdminProject(id);
      push("项目已删除", "success");
      await fetchProjects();
    } catch (err) {
      push(extractErrorMessage(err, "删除失败"), "error");
    }
  }

  if (activeView === "editor") {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] flex-col bg-[var(--background-soft)] lg:h-[calc(100dvh-4rem)] lg:min-h-[700px] lg:overflow-hidden">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Button icon={<ArrowLeft size={15} />} variant="ghost" onClick={() => setActiveView("list")}>
              Back
            </Button>
            <span className="h-6 w-px bg-[var(--border-soft)]" />
            <div className="min-w-0">
              <span className="block font-lab-mono text-xs font-medium uppercase text-[var(--muted)]">
                {status === "published" ? "Published" : "Draft"}
              </span>
              <strong className="block truncate font-lab-mono text-sm text-[var(--text-strong)]">
                {form.name || "Untitled Project"}
              </strong>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-1.5 font-lab-mono text-xs text-[var(--muted)] md:flex">
            {saveStatus === "saving" ? (
              <><Loader2 size={12} className="animate-spin" />保存中...</>
            ) : saveStatus === "saved" ? (
              <><CheckCircle2 size={12} className="text-[var(--success)]" />已保存</>
            ) : (
              <><Clock size={12} />{projectId ? "等待保存" : "尚未保存"}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={saving} icon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} variant="secondary" onClick={handleSave}>
              Save
            </Button>
            <Button disabled={saving} icon={saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} variant="primary" onClick={handlePublish}>
              Publish
            </Button>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 bg-[var(--background-soft)] lg:grid-cols-[304px_minmax(0,1fr)]">
          <aside className="hidden overflow-y-auto border-r border-[var(--border-soft)] bg-[var(--surface)] lg:block">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <h2 className="font-lab-mono text-sm font-medium uppercase text-[var(--text)]">Project Info</h2>
            </div>
            <div className="space-y-5 p-5">
              <Field label="Name" value={form.name} onChange={(v) => updateField("name", v)} />
              <Field label="Tagline" value={form.tagline} onChange={(v) => updateField("tagline", v)} />
              <div>
                <span className="flex items-center justify-between font-lab-mono text-xs font-medium text-[var(--muted)]">
                  <span>URL Slug</span>
                  <button className="text-[var(--blue)] hover:underline" type="button" onClick={() => updateField("slug", generateSlug())}>重新生成</button>
                </span>
                <span className="field-surface mt-2 block w-full rounded-[var(--radius)] px-4 py-3 font-lab-mono text-sm text-[var(--text-strong)]">
                  {form.slug}
                </span>
              </div>
              <Field label="Cover URL" value={form.cover_url} onChange={(v) => updateField("cover_url", v)} />
              <Field label="Repository URL" value={form.repo_url} onChange={(v) => updateField("repo_url", v)} />
              <Field label="Demo URL" value={form.demo_url} onChange={(v) => updateField("demo_url", v)} />
              <Field label="Tech Stack" meta={<span className="font-lab-mono text-[10px] text-[var(--muted-low)]">comma separated</span>} value={form.tech_stack} onChange={(v) => updateField("tech_stack", v)} />
              <Field label="Short Description" multiline value={form.description} onChange={(v) => updateField("description", v.slice(0, 500))} />
            </div>
          </aside>

          <div className="min-h-0 overflow-auto bg-[var(--background-soft)] p-4 md:p-6">
            <TipTapEditor content={form.content_html} onChange={(html) => updateField("content_html", html)} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel className="lab-card p-6">
            <Badge tone="purple">Projects</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">
              项目发布
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              每一个项目就是一份精心排版的 README，介绍它是什么、解决什么问题、用了什么技术。
            </p>
            <Button className="mt-4" icon={<Plus size={15} />} variant="primary" onClick={handleNew}>
              新建项目
            </Button>
          </Panel>

          <Panel className="lab-card p-5">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">概览</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-4">
                <span className="font-lab-mono text-xs text-[var(--muted)]">总计</span>
                <strong className="mt-2 block font-lab-display text-2xl font-semibold text-[var(--text-strong)]">{projects.length}</strong>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-4">
                <span className="font-lab-mono text-xs text-[var(--muted)]">已发布</span>
                <strong className="mt-2 block font-lab-display text-2xl font-semibold text-[var(--success)]">
                  {projects.filter((p) => p.status === "published").length}
                </strong>
              </div>
            </div>
          </Panel>
        </header>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">项目列表</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center font-lab-mono text-sm text-[var(--muted)]">加载中...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center font-lab-mono text-sm text-[var(--muted)]">
              还没有项目，点击上方按钮创建第一个。
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {projects.map((project) => (
                <div className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-field)]" key={project.id}>
                  {project.cover_url ? (
                    <img alt={project.name} className="size-12 shrink-0 rounded-[var(--radius)] border border-[var(--border-soft)] object-cover" src={project.cover_url} />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] font-lab-mono text-sm font-bold text-[var(--muted)]">
                      {project.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium text-[var(--text-strong)]">{project.name}</h3>
                      <Badge tone={project.status === "published" ? "green" : project.status === "draft" ? "amber" : "neutral"}>
                        {project.status === "published" ? "Published" : project.status === "draft" ? "Draft" : "Archived"}
                      </Badge>
                    </div>
                    {project.tagline && (
                      <p className="mt-1 truncate font-lab-mono text-xs text-[var(--muted-low)]">{project.tagline}</p>
                    )}
                    {project.tech_stack.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {project.tech_stack.slice(0, 4).map((tech) => (
                          <span className="rounded bg-[var(--surface-field)] px-1.5 py-0.5 font-lab-mono text-[10px] text-[var(--muted)]" key={tech}>{tech}</span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="font-lab-mono text-[10px] text-[var(--muted-low)]">+{project.tech_stack.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {project.repo_url && (
                      <a className="text-[var(--muted)] hover:text-[var(--text)]" href={project.repo_url} rel="noopener noreferrer" target="_blank">
                        <GitFork size={16} />
                      </a>
                    )}
                    {project.demo_url && (
                      <a className="text-[var(--muted)] hover:text-[var(--text)]" href={project.demo_url} rel="noopener noreferrer" target="_blank">
                        <Globe size={16} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button className="w-8 px-0" variant="ghost" onClick={() => handleEdit(project)}>
                      <ExternalLink size={14} />
                    </Button>
                    <Button className="w-8 px-0" variant="ghost" onClick={() => handleDelete(project.id)}>
                      <Trash2 size={14} className="text-[var(--rose)]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}
