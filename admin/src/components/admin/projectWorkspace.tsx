"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppWindow,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Footprints,
  GitFork,
  Globe,
  History,
  LayoutDashboard,
  Link2,
  Loader2,
  MonitorUp,
  PackageOpen,
  Pencil,
  Plus,
  Rocket,
  Save,
  Send,
  Settings2,
  Target,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { TipTapEditor } from "@/components/admin/tiptapEditor";
import { MoonGlyph, projectPhases } from "@/components/admin/projectPhase";
import { ProjectProcessPanel } from "@/components/admin/projectProcessPanel";
import { UnassignedProgress } from "@/components/admin/unassignedProgress";
import {
  createAdminProject,
  deleteAdminProject,
  getAdminProject,
  listAdminProjects,
  listProjectArtifacts,
  publishAdminProject,
  publishProjectArtifact,
  updateAdminProject,
  uploadProjectArtifact,
  type ProjectArtifact,
  type ProjectInput,
  type ProjectListItem,
  type ProjectStatus,
} from "@/lib/api/projects";

type ProjectFormState = {
  phase: "" | "research" | "building" | "live" | "waning";
  goal: string;
  boundary: string;
  current_work: string;
  progress_percent: string;
  closure_kind: "" | "archived" | "abandoned";
  closure_reason: string;

  name: string;
  slug: string;
  tagline: string;
  description: string;
  content_html: string;
  content_md: string;
  source_format: "markdown" | "mdx" | "tiptap" | "html";
  cover_url: string;
  repo_url: string;
  demo_url: string;
  tech_stack: string;
};

type SaveStatus = "idle" | "saving" | "saved";

const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateSlug(): string {
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return result;
}

const emptyForm: ProjectFormState = {
  phase: "research",
  goal: "", boundary: "", current_work: "", progress_percent: "", closure_kind: "", closure_reason: "",

  name: "",
  slug: generateSlug(),
  tagline: "",
  description: "",
  content_html: "<p></p>",
  content_md: "# 项目概览\n\n在这里介绍项目的目标、能力和使用方式。\n\n<Callout>这是一个 MDX 提示框。</Callout>",
  source_format: "mdx",
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
  const [status, setStatus] = useState<ProjectStatus>("draft");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<"overview" | "content" | "process" | "releases">("overview");
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>([]);
  const [artifactFile, setArtifactFile] = useState<File | null>(null);
  const [artifactLabel, setArtifactLabel] = useState("");
  const [uploadingArtifact, setUploadingArtifact] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<ProjectArtifact | null>(null);

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
    let active = true;
    listAdminProjects({ page_size: 50 })
      .then((result) => {
        if (active) setProjects(result.items);
      })
      .catch((err) => {
        if (active) push(extractErrorMessage(err, "加载项目列表失败"), "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [push]);

  function handleNew() {
    setForm({ ...emptyForm, slug: generateSlug() });
    setProjectId(null);
    setStatus("draft");
    setEditorTab("overview");
    setArtifacts([]);
    setPreviewArtifact(null);
    setActiveView("editor");
  }

  async function handleEdit(project: ProjectListItem) {
    try {
      const detail = await getAdminProject(project.id);
      setForm({
        phase: detail.phase, goal: detail.goal, boundary: detail.boundary, current_work: detail.current_work,
        progress_percent: detail.progress_percent === null ? "" : String(detail.progress_percent), closure_kind: detail.closure_kind, closure_reason: detail.closure_reason,
        name: detail.name,
        slug: detail.slug,
        tagline: detail.tagline,
        description: detail.description,
        content_html: detail.content_html || "<p></p>",
        content_md: detail.content_md || "",
        source_format: detail.source_format || "tiptap",
        cover_url: detail.cover_url,
        repo_url: detail.repo_url,
        demo_url: detail.demo_url,
        tech_stack: detail.tech_stack.join(", "),
      });
      setProjectId(detail.id);
      setStatus(detail.status);
      setEditorTab("overview");
      setActiveView("editor");
      const releases = await listProjectArtifacts(detail.id);
      setArtifacts(releases.items);
      setPreviewArtifact(releases.items.find((artifact) => artifact.is_published) ?? releases.items[0] ?? null);
    } catch (err) {
      push(extractErrorMessage(err, "加载项目详情失败"), "error");
    }
  }

  const currentPhase = projectPhases.find((phase) => phase.value === form.phase);

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildApiInput(): ProjectInput {
    return {
      phase: form.phase, goal: form.goal, boundary: form.boundary, current_work: form.current_work,
      progress_percent: form.progress_percent === "" ? null : Number(form.progress_percent), closure_kind: form.closure_kind, closure_reason: form.closure_reason,
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      description: form.description,
      content_html: form.content_html,
      content_md: form.content_md,
      source_format: form.source_format,
      cover_url: form.cover_url,
      repo_url: form.repo_url,
      demo_url: form.demo_url,
      status,
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
        setStatus(result.status);
        push("项目已保存", "success");
      } else {
        const result = await createAdminProject(buildApiInput());
        setProjectId(result.id);
        setStatus(result.status);
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
        phase: form.phase, goal: form.goal, boundary: form.boundary, current_work: form.current_work,
        progress_percent: form.progress_percent === "" ? null : Number(form.progress_percent), closure_kind: form.closure_kind, closure_reason: form.closure_reason,
        name: form.name,
        slug: form.slug,
        tagline: form.tagline,
        description: form.description,
        content_html: form.content_html,
        content_md: form.content_md,
        source_format: form.source_format,
        cover_url: form.cover_url,
        repo_url: form.repo_url,
        demo_url: form.demo_url,
        tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setStatus(result.status);
      push("项目已发布", "success");
    } catch (err) {
      push(extractErrorMessage(err, "发布失败"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleArtifactUpload() {
    if (!projectId) {
      push("请先保存项目，再上传发布产物", "error");
      return;
    }
    if (!artifactFile) {
      push("请选择 HTML 或 ZIP 文件", "error");
      return;
    }
    setUploadingArtifact(true);
    try {
      const artifact = await uploadProjectArtifact(projectId, artifactFile, artifactLabel);
      setArtifacts((items) => [artifact, ...items]);
      setArtifactFile(null);
      setArtifactLabel("");
      setPreviewArtifact(artifact);
      push(`版本 v${artifact.version} 已上传`, "success");
    } catch (err) {
      push(extractErrorMessage(err, "上传发布产物失败"), "error");
    } finally {
      setUploadingArtifact(false);
    }
  }

  async function handleArtifactPublish(artifact: ProjectArtifact) {
    if (!projectId) return;
    try {
      const published = await publishProjectArtifact(projectId, artifact.id);
      setArtifacts((items) => items.map((item) => ({ ...item, is_published: item.id === published.id, published_at: item.id === published.id ? published.published_at : null })));
      setPreviewArtifact(published);
      push(`已发布项目产物 v${published.version}`, "success");
    } catch (err) {
      push(extractErrorMessage(err, "发布产物失败"), "error");
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
      <main className="project-cms-shell">
        <header className="project-cms-header">
          <div className="project-cms-title-group">
            <button aria-label="返回项目列表" className="project-cms-back" onClick={() => setActiveView("list")} type="button">
              <ArrowLeft size={18} />
            </button>
            <span className="project-cms-mark"><AppWindow size={20} /></span>
            <div className="project-cms-title">
              <span>CRESCENT CMS / PROJECTS</span>
              <strong>{form.name || "未命名项目"}</strong>
            </div>
          </div>

          <div className="project-cms-save-state">
            {saveStatus === "saving" ? (
              <><Loader2 className="animate-spin" size={13} />正在保存</>
            ) : saveStatus === "saved" ? (
              <><CheckCircle2 size={13} />更改已保存</>
            ) : (
              <><Clock size={13} />{projectId ? "等待保存" : "尚未创建"}</>
            )}
          </div>

          <div className="project-cms-actions">
            <Button disabled={saving} icon={saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} onClick={handleSave} variant="secondary">
              保存项目
            </Button>
            <Button disabled={saving} icon={saving ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />} onClick={handlePublish} variant="primary">
              发布项目
            </Button>
          </div>
        </header>

        <section className="project-cms-workspace">
          <aside className="project-cms-sidebar">
            <div className="project-cms-sidebar-intro">
              <span>PROJECT THREAD</span>
              <strong>项目线索</strong>
              <p>月相标记阶段，进展、长文与札记记录它怎么走到这里。</p>
            </div>

            <nav aria-label="项目编辑模块" className="project-cms-nav">
              <button className={editorTab === "overview" ? "is-active" : ""} onClick={() => setEditorTab("overview")} type="button">
                <span><LayoutDashboard size={17} /></span>
                <span><strong>档案</strong><small>阶段、目标与边界</small></span>
              </button>
              <button className={editorTab === "content" ? "is-active" : ""} onClick={() => setEditorTab("content")} type="button">
                <span><FileText size={17} /></span>
                <span><strong>README</strong><small>项目介绍正文</small></span>
              </button>
              <button className={editorTab === "process" ? "is-active" : ""} onClick={() => setEditorTab("process")} type="button">
                <span><Footprints size={17} /></span>
                <span><strong>过程</strong><small>进展与关联记录</small></span>
              </button>
              <button className={editorTab === "releases" ? "is-active" : ""} onClick={() => setEditorTab("releases")} type="button">
                <span><Rocket size={17} /></span>
                <span><strong>部署版本</strong><small>上传、预览与发布</small></span>
              </button>
            </nav>

            <div className="project-cms-sidebar-status">
              <div className="project-cms-status-line">
                <span className={`project-cms-status-dot is-${status}`} />
                <strong>{projectStatusLabel(status)}</strong>
              </div>
              <dl>
                <div><dt>月相</dt><dd>{currentPhase ? `${currentPhase.name} · ${currentPhase.label}` : "待补充"}</dd></div>
                <div><dt>站点标识</dt><dd>/{form.slug}</dd></div>
                <div><dt>部署版本</dt><dd>{artifacts.length}</dd></div>
              </dl>
              {artifacts.some((artifact) => artifact.is_published) && (
                <a href={`/api/p/${form.slug}/index.html`} rel="noopener noreferrer" target="_blank">
                  打开线上站点 <ExternalLink size={14} />
                </a>
              )}
            </div>
          </aside>

          <div className="project-cms-canvas">
            {editorTab === "overview" && (
              <>
                <header className="project-cms-page-heading">
                  <div><span>01 / PROFILE</span><h1>档案</h1><p>项目是什么、处在哪个阶段、做与不做的边界。</p></div>
                  <Badge tone={status === "published" ? "green" : "amber"}>{projectStatusLabel(status)}</Badge>
                </header>

                <div className="project-cms-overview-grid">
                  <div className="project-cms-stack">
                    <section className="project-cms-panel">
                      <div className="project-cms-panel-heading"><span><Settings2 size={17} /></span><div><h2>项目身份</h2><p>名称与标语会作为项目的第一层识别信息。</p></div></div>
                      <div className="project-cms-form-grid">
                        <Field label="项目名称" placeholder="例如：Crescent Console" value={form.name} onChange={(value) => updateField("name", value)} />
                        <Field label="一句话标语" placeholder="说明项目解决什么问题" value={form.tagline} onChange={(value) => updateField("tagline", value)} />
                        <div className="project-cms-slug-field">
                          <span><span>站点标识</span><button onClick={() => updateField("slug", generateSlug())} type="button">重新生成</button></span>
                          <code>/{form.slug}</code>
                        </div>
                        <Field label="技术栈" meta={<span>英文逗号分隔</span>} placeholder="Next.js, Go, PostgreSQL" value={form.tech_stack} onChange={(value) => updateField("tech_stack", value)} />
                      </div>
                    </section>

                    <section className="project-cms-panel">
                      <div className="project-cms-panel-heading"><span><MoonGlyph phase={currentPhase?.moon ?? 0} size={18} /></span><div><h2>月相阶段</h2><p>阶段决定项目出现在前台的哪个分组；公开项目必须选择阶段。</p></div></div>
                      <div aria-label="项目月相" className="project-cms-phase-picker" role="radiogroup">
                        {projectPhases.map((phase) => (
                          <button aria-checked={form.phase === phase.value} key={phase.value} onClick={() => setForm({ ...form, phase: phase.value, closure_kind: phase.value === "waning" ? form.closure_kind : "", closure_reason: phase.value === "waning" ? form.closure_reason : "" })} role="radio" type="button">
                            <MoonGlyph phase={phase.moon} size={22} />
                            <strong>{phase.name} · {phase.label}</strong>
                            <small>{phase.hint}</small>
                          </button>
                        ))}
                      </div>
                      {form.phase === "waning" && (
                        <div className="project-cms-closure">
                          <div aria-label="退出类型" className="project-cms-segment" role="radiogroup">
                            {(["archived", "abandoned"] as const).map((kind) => <button aria-checked={form.closure_kind === kind} key={kind} onClick={() => updateField("closure_kind", kind)} role="radio" type="button">{kind === "archived" ? "归档 · 完成使命" : "放弃 · 不再投入"}</button>)}
                          </div>
                          <Field label="归档／放弃原因" multiline placeholder="写清楚为什么结束，前台会原样展示" value={form.closure_reason} onChange={(value) => updateField("closure_reason", value)} />
                        </div>
                      )}
                    </section>

                    <section className="project-cms-panel">
                      <div className="project-cms-panel-heading"><span><Target size={17} /></span><div><h2>目标与边界</h2><p>前台项目页的三栏事实：为什么做、不做什么、现在在做什么。</p></div></div>
                      <div className="project-cms-form-grid">
                        <Field label="目标" multiline value={form.goal} onChange={(value) => updateField("goal", value)} />
                        <Field label="边界 · 不做" multiline value={form.boundary} onChange={(value) => updateField("boundary", value)} />
                        <Field className="project-cms-span-2" label="现在" multiline placeholder="当前这一轮在推进什么" value={form.current_work} onChange={(value) => updateField("current_work", value)} />
                      </div>
                    </section>

                    <section className="project-cms-panel">
                      <div className="project-cms-panel-heading"><span><FileText size={17} /></span><div><h2>项目摘要</h2><p>用于项目列表与快速了解，不替代完整介绍正文。</p></div></div>
                      <Field label="简短描述" meta={<span>{form.description.length}/500</span>} multiline placeholder="概括目标、适用场景与核心价值" value={form.description} onChange={(value) => updateField("description", value.slice(0, 500))} />
                    </section>

                    <section className="project-cms-panel">
                      <div className="project-cms-panel-heading"><span><Link2 size={17} /></span><div><h2>资源与入口</h2><p>连接代码仓库、产品演示与项目封面。</p></div></div>
                      <div className="project-cms-form-grid">
                        <Field label="封面地址" placeholder="https://..." value={form.cover_url} onChange={(value) => updateField("cover_url", value)} />
                        <Field label="代码仓库" placeholder="https://github.com/..." value={form.repo_url} onChange={(value) => updateField("repo_url", value)} />
                        <Field label="演示地址" placeholder="https://..." value={form.demo_url} onChange={(value) => updateField("demo_url", value)} />
                      </div>
                    </section>
                  </div>

                  <aside className="project-cms-preview-card">
                    <div className={`project-cms-cover${form.cover_url ? " has-cover" : ""}`}>
                      {form.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="项目封面预览" src={form.cover_url} />
                      ) : (
                        <AppWindow size={32} />
                      )}
                      <span>{currentPhase ? `${currentPhase.name} · ${currentPhase.label}` : "阶段待补充"}</span>
                    </div>
                    <div className="project-cms-preview-copy">
                      <div><Badge tone={status === "published" ? "green" : "amber"}>{projectStatusLabel(status)}</Badge><span>/{form.slug}</span></div>
                      <h2>{form.name || "未命名项目"}</h2>
                      <p>{form.tagline || "为项目补充一句清晰的价值说明。"}</p>
                      <div className="project-cms-tech-list">
                        {form.tech_stack.split(",").map((item) => item.trim()).filter(Boolean).map((item) => <span key={item}>{item}</span>)}
                      </div>
                    </div>
                    <div className="project-cms-preview-links">
                      <span><GitFork size={14} />{form.repo_url ? "已连接仓库" : "未连接仓库"}</span>
                      <span><Globe size={14} />{form.demo_url ? "已设置演示" : "未设置演示"}</span>
                    </div>
                  </aside>
                </div>
              </>
            )}

            {editorTab === "content" && (
              <>
                <header className="project-cms-page-heading">
                  <div><span>02 / README</span><h1>README</h1><p>编排项目背景、能力说明与使用方式，形成完整的项目介绍。</p></div>
                </header>
                <div className="project-cms-content-note"><FileText size={16} /><span>此处内容用于项目介绍；进展请记在“过程”，静态站点文件请前往“部署版本”。</span></div>
                <div className="project-cms-format-picker"><label>内容格式<select value={form.source_format} onChange={(event) => updateField("source_format", event.target.value as ProjectFormState["source_format"])}><option value="mdx">MDX（支持 React 组件）</option><option value="markdown">Markdown</option><option value="tiptap">TipTap</option></select></label></div>
                <div className="project-cms-editor-frame">
                  {form.source_format === "mdx" || form.source_format === "markdown" ? <textarea className="project-cms-mdx-editor" value={form.content_md} onChange={(event) => updateField("content_md", event.target.value)} placeholder="# 项目概览\n\n支持 Markdown 和白名单 MDX 组件" /> : <TipTapEditor content={form.content_html} onChange={(html) => updateField("content_html", html)} onSave={handleSave} />}
                </div>
              </>
            )}

            {editorTab === "process" && (
              <>
                <header className="project-cms-page-heading">
                  <div><span>03 / PROCESS</span><h1>过程</h1><p>项目怎么走到这里：带日期的进展，以及关联到它的长文和札记。</p></div>
                </header>
                {projectId ? <ProjectProcessPanel projectId={projectId} /> : <div className="project-cms-inline-notice">请先保存项目，再记录进展。</div>}
              </>
            )}

            {editorTab === "releases" && (
              <>
                <header className="project-cms-page-heading">
                  <div><span>04 / DEPLOYMENTS</span><h1>部署版本</h1><p>上传静态站点产物，隔离预览后选择一个版本发布到线上。</p></div>
                  {artifacts.some((artifact) => artifact.is_published) && <Badge tone="green">线上运行中</Badge>}
                </header>

                <div className="project-cms-release-summary">
                  <div><span><MonitorUp size={17} /></span><small>线上状态</small><strong>{artifacts.some((artifact) => artifact.is_published) ? "已部署" : "未部署"}</strong></div>
                  <div><span><PackageOpen size={17} /></span><small>版本总数</small><strong>{artifacts.length}</strong></div>
                  <div><span><History size={17} /></span><small>预览版本</small><strong>{previewArtifact ? `v${previewArtifact.version}` : "—"}</strong></div>
                </div>

                <div className="project-cms-release-grid">
                  <div className="project-cms-stack">
                    <section className="project-cms-panel project-cms-upload-panel">
                      <div className="project-cms-panel-heading"><span><Upload size={17} /></span><div><h2>创建新版本</h2><p>支持单文件 HTML，或根目录包含 index.html 的 ZIP。</p></div></div>
                      {!projectId && <div className="project-cms-inline-notice">请先保存项目，再上传静态站点产物。</div>}
                      <Field label="版本说明" placeholder="例如：重构登录流程与首页布局" value={artifactLabel} onChange={setArtifactLabel} />
                      <label className="project-cms-file-input">
                        <Upload size={20} />
                        <span><strong>{artifactFile?.name || "选择 HTML 或 ZIP 文件"}</strong><small>每次上传都会生成不可变版本</small></span>
                        <input accept=".html,.htm,.zip" onChange={(event) => setArtifactFile(event.target.files?.[0] || null)} type="file" />
                      </label>
                      <Button disabled={uploadingArtifact || !projectId} icon={uploadingArtifact ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />} onClick={handleArtifactUpload} variant="primary">
                        上传并打开预览
                      </Button>
                    </section>

                    <section className="project-cms-panel project-cms-history-panel">
                      <div className="project-cms-panel-heading"><span><History size={17} /></span><div><h2>版本历史</h2><p>选择任一版本预览、发布或回滚。</p></div></div>
                      {artifacts.length === 0 ? (
                        <div className="project-cms-empty-release"><PackageOpen size={24} /><span>尚未上传项目产物</span></div>
                      ) : artifacts.map((artifact) => (
                        <div className={`project-cms-release-row${previewArtifact?.id === artifact.id ? " is-previewing" : ""}`} key={artifact.id}>
                          <span className="project-cms-version">v{artifact.version}</span>
                          <div><div><strong>{artifact.label || `${artifact.source_type.toUpperCase()} 版本`}</strong>{artifact.is_published && <Badge tone="green">当前线上</Badge>}</div><p>{(artifact.size_bytes / 1024).toFixed(1)} KB · {new Date(artifact.created_at).toLocaleDateString("zh-CN")}</p></div>
                          <div className="project-cms-release-actions">
                            <Button onClick={() => setPreviewArtifact(artifact)} variant="ghost">预览</Button>
                            <Button icon={<Rocket size={14} />} onClick={() => handleArtifactPublish(artifact)} variant={artifact.is_published ? "secondary" : "primary"}>{artifact.is_published ? "重新发布" : "发布/回滚"}</Button>
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>

                  <section className="project-cms-browser-panel">
                    <div className="project-cms-browser-bar">
                      <div><i /><i /><i /></div>
                      <span>{previewArtifact ? `/preview/v${previewArtifact.version}` : "/preview"}</span>
                      {previewArtifact?.is_published && <a href={`/api/p/${form.slug}/index.html`} rel="noopener noreferrer" target="_blank"><ExternalLink size={14} />线上站点</a>}
                    </div>
                    {previewArtifact ? (
                      <iframe sandbox="allow-scripts allow-forms allow-modals allow-popups" src={`/api/project-artifacts/${previewArtifact.public_id}/index.html`} title={`项目产物 v${previewArtifact.version} 预览`} />
                    ) : (
                      <div className="project-cms-browser-empty"><MonitorUp size={30} /><strong>隔离预览</strong><p>上传或选择一个版本后，在这里检查实际站点效果。</p></div>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    );
  }

  const groups = [...projectPhases, { value: "" as const, moon: 0, name: "阶段待补充", label: "", hint: "" }]
    .map((phase) => ({ phase, items: projects.filter((project) => project.phase === phase.value) }))
    .filter((group) => group.items.length > 0);

  return (
    <main className="project-cms-list">
      <header className="project-cms-list-header">
        <div>
          <span>PROJECTS</span>
          <h1>项目</h1>
          <p>每个项目是一条长期线索：月相标记阶段，进展、长文与札记记录它怎么走到这里。</p>
        </div>
        <Button icon={<Plus size={15} />} variant="primary" onClick={handleNew}>新建项目</Button>
      </header>

      {!loading && <UnassignedProgress projects={projects} />}

      {loading ? (
        <p className="project-cms-empty-line">加载中…</p>
      ) : projects.length === 0 ? (
        <div className="project-cms-panel project-cms-list-empty"><strong>还没有项目</strong><p>先写下它想解决的问题和边界，从「新月 · 研究中」开始。</p></div>
      ) : groups.map(({ phase, items }) => (
        <section className="project-cms-phase-group" key={phase.value || "unset"}>
          <h2>{phase.value && <MoonGlyph phase={phase.moon} size={18} />}{phase.name}{phase.label && <small>{phase.label}</small>}<span>{items.length}</span></h2>
          <ul>
            {items.map((project) => (
              <li className="project-cms-row" key={project.id}>
                <button className="project-cms-row-main" onClick={() => handleEdit(project)} type="button">
                  <span className="project-cms-row-title"><strong>{project.name}</strong>{project.status !== "published" && <Badge tone="amber">草稿</Badge>}{project.phase === "waning" && project.closure_kind && <Badge tone={project.closure_kind === "abandoned" ? "rose" : "neutral"}>{project.closure_kind === "abandoned" ? "放弃" : "归档"}</Badge>}</span>
                  <span className="project-cms-row-now">{project.phase === "waning" ? project.closure_reason || "退出原因待补充" : project.current_work || project.tagline || "还没有写「现在」在做什么"}</span>
                </button>
                <time dateTime={project.updated_at}>{new Date(project.updated_at).toLocaleDateString("zh-CN")} 更新</time>
                <div className="project-cms-row-actions">
                  {project.status === "published" && <a aria-label={`在前台查看 ${project.name}`} href={`${publicSiteUrl}/projects/${project.slug}`} rel="noopener noreferrer" target="_blank"><ExternalLink size={14} /></a>}
                  <button aria-label={`编辑 ${project.name}`} onClick={() => handleEdit(project)} type="button"><Pencil size={14} /></button>
                  <button aria-label={`删除 ${project.name}`} className="is-danger" onClick={() => handleDelete(project.id)} type="button"><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function projectStatusLabel(status: ProjectStatus): string {
  return status === "published" ? "公开" : "草稿";
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}
