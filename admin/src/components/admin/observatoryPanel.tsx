"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Code2,
  Lightbulb,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  createObservatoryNote,
  deleteObservatoryNote,
  getObservatoryNote,
  listObservatoryNotes,
  updateObservatoryNote,
  type NoteStatus,
  type NoteType,
  type NoteVisibility,
  type ObservatoryListParams,
} from "@/lib/api/observatory";
import { ProjectAssociationField } from "@/components/admin/projectAssociationField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type NoteFormData = {
  project_id: number | null;
  title: string;
  question: string;
  observation: string;
  conclusion: string;
  next_step: string;
  content_md: string;
  tags: string;
  note_type: NoteType;
  status: NoteStatus;
  visibility: NoteVisibility;
  is_featured: boolean;
};

const emptyForm: NoteFormData = {
  project_id: null,
  title: "",
  question: "",
  observation: "",
  conclusion: "",
  next_step: "",
  content_md: "",
  tags: "",
  note_type: "fragment",
  status: "active",
  visibility: "private",
  is_featured: false,
};

const noteTypeConfig: Record<NoteType, { label: string; icon: typeof BookOpen; tone: "amber" | "rose" | "cyan" | "purple" | "green" }> = {
  fragment: { label: "碎碎念", icon: BookOpen, tone: "cyan" },
  failure: { label: "失败实验", icon: AlertTriangle, tone: "rose" },
  idea: { label: "想法", icon: Lightbulb, tone: "amber" },
  tool_idea: { label: "工具构想", icon: Wrench, tone: "purple" },
  tech_debt: { label: "技术债", icon: Code2, tone: "green" },
};

const statusConfig: Record<NoteStatus, { label: string; tone: "cyan" | "green" | "neutral" }> = {
  active: { label: "进行中", tone: "cyan" },
  resolved: { label: "已解决", tone: "green" },
  abandoned: { label: "已放弃", tone: "neutral" },
};

export function ObservatoryPanel() {
  const { push } = useToast();
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof listObservatoryNotes>>["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NoteFormData | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<NoteType | "">("");
  const [filterStatus, setFilterStatus] = useState<NoteStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const params: ObservatoryListParams = { page_size: 50 };
      if (filterType) params.note_type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      const result = await listObservatoryNotes(params);
      setNotes(result.items);
    } catch (err) {
      push(extractErrorMessage(err, "加载观测台笔记失败"), "error");
    }
  }, [filterType, filterStatus, searchQuery, push]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const params: ObservatoryListParams = { page_size: 50 };
        if (filterType) params.note_type = filterType;
        if (filterStatus) params.status = filterStatus;
        if (searchQuery) params.search = searchQuery;
        const result = await listObservatoryNotes(params);
        if (active) setNotes(result.items);
      } catch (err) {
        if (active) push(extractErrorMessage(err, "加载观测台笔记失败"), "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filterType, filterStatus, searchQuery, push]);

  function handleNewNote() {
    setEditing({ ...emptyForm });
    setEditingId(null);
  }

  async function handleEditNote(note: (typeof notes)[number]) {
    setLoadingDetail(true);
    setEditingId(note.id);
    try {
      const detail = await getObservatoryNote(note.id);
      setEditing({
        project_id: detail.project_id,
        title: detail.title,
        question: detail.question || "",
        observation: detail.observation || "",
        conclusion: detail.conclusion || "",
        next_step: detail.next_step || "",
        content_md: detail.content_md || "",
        tags: detail.tags.join(", "),
        note_type: detail.note_type,
        status: detail.status,
        visibility: detail.visibility || "private",
        is_featured: detail.is_featured,
      });
    } catch (err) {
      push(extractErrorMessage(err, "加载笔记详情失败"), "error");
      setEditingId(null);
      setEditing(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSave() {
    if (!editing || !editing.title.trim()) {
      push("标题为必填项", "error");
      return;
    }
    setSaving(true);
    try {
      const input = {
        project_id: editing.project_id,
        title: editing.title,
        question: editing.question,
        observation: editing.observation,
        conclusion: editing.conclusion,
        next_step: editing.next_step,
        content_md: editing.content_md,
        tags: editing.tags.split(",").map((t) => t.trim()).filter(Boolean),
        note_type: editing.note_type,
        status: editing.status,
        visibility: editing.is_featured ? "public" as const : editing.visibility,
        is_featured: editing.is_featured,
      };
      if (editingId) {
        await updateObservatoryNote(editingId, input);
        push("笔记已更新", "success");
      } else {
        await createObservatoryNote(input);
        push("笔记已创建", "success");
      }
      setEditing(null);
      setEditingId(null);
      await fetchNotes();
    } catch (err) {
      push(extractErrorMessage(err, "保存失败"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定要删除这条笔记吗？")) return;
    try {
      await deleteObservatoryNote(id);
      push("笔记已删除", "success");
      await fetchNotes();
    } catch (err) {
      push(extractErrorMessage(err, "删除失败"), "error");
    }
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel className="lab-card p-6">
            <Badge tone="amber">观测台</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">
              实验观测台
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              记录失败实验、半成品工具、技术问题和一闪而过的想法。这里不追求完整性，只追求诚实。
            </p>
            <Button className="mt-4" icon={<Plus size={15} />} variant="primary" onClick={handleNewNote}>
              记录一条
            </Button>
          </Panel>

          <Panel className="lab-card p-5">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">过滤器</h2>
            <div className="mt-4 flex items-center gap-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                className="field-surface h-10 flex-1 rounded-[var(--radius)] px-4 text-sm text-[var(--text)] outline-none"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <span className="font-lab-mono text-xs text-[var(--muted)]">类型</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <FilterPill active={filterType === ""} onClick={() => setFilterType("")}>全部</FilterPill>
                {(Object.keys(noteTypeConfig) as NoteType[]).map((type) => {
                  const config = noteTypeConfig[type];
                  return (
                    <FilterPill key={type} active={filterType === type} onClick={() => setFilterType(type)}>
                      {config.label}
                    </FilterPill>
                  );
                })}
              </div>
            </div>
            <div className="mt-4">
              <span className="font-lab-mono text-xs text-[var(--muted)]">状态</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <FilterPill active={filterStatus === ""} onClick={() => setFilterStatus("")}>全部</FilterPill>
                {(Object.keys(statusConfig) as NoteStatus[]).map((status) => (
                  <FilterPill key={status} active={filterStatus === status} onClick={() => setFilterStatus(status)}>
                    {statusConfig[status].label}
                  </FilterPill>
                ))}
              </div>
            </div>
          </Panel>
        </header>

        {loadingDetail && (
          <Panel className="lab-card p-6 font-lab-mono text-sm text-[var(--muted)]">
            正在加载笔记详情…
          </Panel>
        )}

        {editing && (
          <Panel className="lab-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">
                {editingId ? "编辑笔记" : "新建笔记"}
              </h2>
              <Button variant="ghost" onClick={() => setEditing(null)}>取消</Button>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              想验证什么 → 看到了什么 → 这个结果改变了什么判断。公开给访客时，问题和观察为必填。
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <ProjectAssociationField value={editing.project_id} onChange={(value) => setEditing({ ...editing, project_id: value })} />
                <Field label="标题" placeholder="直接写问题或观察" value={editing.title} onChange={(value) => setEditing({ ...editing, title: value })} />
                <Field label="问题 / 背景" multiline placeholder="为什么会出现这个问题？" value={editing.question} onChange={(value) => setEditing({ ...editing, question: value })} />
                <Field label="关键观察" multiline placeholder="实际发生了什么，有什么证据？" value={editing.observation} onChange={(value) => setEditing({ ...editing, observation: value })} />
                <Field label="当前结论" multiline placeholder="目前可以确认什么，仍不能确认什么？" value={editing.conclusion} onChange={(value) => setEditing({ ...editing, conclusion: value })} />
                <Field label="下一步" placeholder="仅进行中需要一个可检查的动作" value={editing.next_step} onChange={(value) => setEditing({ ...editing, next_step: value })} />
                <Field label="补充笔记" multiline placeholder="可选，支持 Markdown" value={editing.content_md} onChange={(value) => setEditing({ ...editing, content_md: value })} />
              </div>
              <div className="space-y-4">
                <div>
                  <span className="font-lab-mono text-xs text-[var(--muted)]">类型</span>
                  <select
                    className="field-surface mt-2 block w-full rounded-[var(--radius)] px-4 py-3 text-sm text-[var(--text)] outline-none"
                    value={editing.note_type}
                    onChange={(e) => setEditing({ ...editing, note_type: e.target.value as NoteType })}
                  >
                    {(Object.keys(noteTypeConfig) as NoteType[]).map((type) => (
                      <option key={type} value={type}>{noteTypeConfig[type].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="font-lab-mono text-xs text-[var(--muted)]">状态</span>
                  <select
                    className="field-surface mt-2 block w-full rounded-[var(--radius)] px-4 py-3 text-sm text-[var(--text)] outline-none"
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as NoteStatus })}
                  >
                    {(Object.keys(statusConfig) as NoteStatus[]).map((status) => (
                      <option key={status} value={status}>{statusConfig[status].label}</option>
                    ))}
                  </select>
                </div>
                <Field label="标签（逗号分隔）" placeholder="如: 前端,性能,待验证" value={editing.tags} onChange={(value) => setEditing({ ...editing, tags: value })} />
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    checked={editing.visibility === "public" || editing.is_featured}
                    type="checkbox"
                    onChange={(event) => setEditing({ ...editing, visibility: event.target.checked ? "public" : "private" })}
                  />
                  公开给访客
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    checked={editing.is_featured}
                    type="checkbox"
                    onChange={(event) => setEditing({
                      ...editing,
                      is_featured: event.target.checked,
                      visibility: event.target.checked ? "public" : editing.visibility,
                    })}
                  />
                  观测台精选
                </label>
                <Button disabled={saving} variant="primary" onClick={handleSave}>
                  {saving ? "保存中..." : editingId ? "更新" : "创建"}
                </Button>
              </div>
            </div>
          </Panel>
        )}

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">笔记列表</h2>
            <Badge tone="cyan">{notes.length} 条</Badge>
          </div>
          {loading ? (
            <div className="p-8 text-center font-lab-mono text-sm text-[var(--muted)]">加载中...</div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center font-lab-mono text-sm text-[var(--muted)]">
              还没有笔记，点击上方按钮记录第一条。
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {notes.map((note) => {
                const typeCfg = noteTypeConfig[note.note_type];
                const statusCfg = statusConfig[note.status];
                const Icon = typeCfg.icon;
                return (
                  <div className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-field)]" key={note.id}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted)]">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-[var(--text-strong)]">{note.title}</h3>
                        <Badge tone={typeCfg.tone}>{typeCfg.label}</Badge>
                        <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                        {note.visibility === "public" ? <Badge tone="green">公开</Badge> : <Badge>私有</Badge>}
                        {note.is_featured && <Badge tone="amber">精选</Badge>}
                      </div>
                      {note.observation && (
                        <p className="mt-1 truncate text-xs text-[var(--muted)]">{note.observation}</p>
                      )}
                      {note.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {note.tags.map((tag) => (
                            <span className="font-lab-mono text-[10px] text-[var(--muted-low)]" key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 font-lab-mono text-xs text-[var(--muted-low)]">
                      {formatShortDate(note.updated_at)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button className="w-8 px-0" variant="ghost" onClick={() => handleEditNote(note)}>
                        <ChevronRight size={14} />
                      </Button>
                      <Button className="w-8 px-0" variant="ghost" onClick={() => handleDelete(note.id)}>
                        <Trash2 size={14} className="text-[var(--rose)]" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}

function FilterPill({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      className={cn(
        "rounded-full px-3 py-1 font-lab-mono text-xs transition-colors",
        active
          ? "border border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan)]"
          : "border border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted)] hover:border-[var(--cyan)]",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}
