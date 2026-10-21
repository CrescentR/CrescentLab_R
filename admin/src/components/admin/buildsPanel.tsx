"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import {
  createAdminBuild,
  deleteAdminBuild,
  getAdminBuild,
  listAdminBuilds,
  updateAdminBuild,
  type BuildInput,
  type BuildStage,
  type BuildStatus,
} from "@/lib/api/builds";
import { ProjectAssociationField } from "@/components/admin/projectAssociationField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BuildFormData = {
  project_id: number | null;
  name: string;
  slug: string;
  one_liner: string;
  stage: BuildStage;
  round_goal: string;
  latest_progress: string;
  next_step: string;
  detail_url: string;
  demo_url: string;
  repo_url: string;
  status: BuildStatus;
  sort_order: string;
};

const emptyForm: BuildFormData = {
  project_id: null,
  name: "",
  slug: "",
  one_liner: "",
  stage: "prototype",
  round_goal: "",
  latest_progress: "",
  next_step: "",
  detail_url: "",
  demo_url: "",
  repo_url: "",
  status: "draft",
  sort_order: "0",
};

const stageConfig: Record<BuildStage, { label: string; tone: "cyan" | "green" | "amber" | "purple" | "neutral" }> = {
  prototype: { label: "原型", tone: "amber" },
  development: { label: "开发", tone: "cyan" },
  validating: { label: "验证", tone: "purple" },
  beta: { label: "内测", tone: "green" },
  paused: { label: "暂停", tone: "neutral" },
};

const statusConfig: Record<BuildStatus, { label: string; tone: "neutral" | "green" | "amber" }> = {
  draft: { label: "草稿", tone: "neutral" },
  published: { label: "已发布", tone: "green" },
  archived: { label: "已归档", tone: "amber" },
};

export function BuildsPanel() {
  const { push } = useToast();
  const [items, setItems] = useState<Awaited<ReturnType<typeof listAdminBuilds>>["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BuildFormData | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<BuildStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params: { page_size: number; status?: BuildStatus; search?: string } = { page_size: 50 };
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      const result = await listAdminBuilds(params);
      setItems(result.items);
    } catch (err) {
      push(extractErrorMessage(err, "加载构建项失败"), "error");
    }
  }, [filterStatus, searchQuery, push]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const params: { page_size: number; status?: BuildStatus; search?: string } = { page_size: 50 };
        if (filterStatus) params.status = filterStatus;
        if (searchQuery) params.search = searchQuery;
        const result = await listAdminBuilds(params);
        if (active) setItems(result.items);
      } catch (err) {
        if (active) push(extractErrorMessage(err, "加载构建项失败"), "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filterStatus, searchQuery, push]);

  function handleNew() {
    setEditing({ ...emptyForm, slug: randomSlug() });
    setEditingId(null);
  }

  async function handleEdit(id: number) {
    setEditingId(id);
    try {
      const detail = await getAdminBuild(id);
      setEditing({
        project_id: detail.project_id,
        name: detail.name,
        slug: detail.slug,
        one_liner: detail.one_liner,
        stage: detail.stage,
        round_goal: detail.round_goal,
        latest_progress: detail.latest_progress,
        next_step: detail.next_step,
        detail_url: detail.detail_url,
        demo_url: detail.demo_url,
        repo_url: detail.repo_url,
        status: detail.status,
        sort_order: String(detail.sort_order),
      });
    } catch (err) {
      push(extractErrorMessage(err, "加载构建项失败"), "error");
      setEditing(null);
      setEditingId(null);
    }
  }

  async function handleSave() {
    if (!editing || !editing.name.trim()) {
      push("名称为必填项", "error");
      return;
    }
    setSaving(true);
    try {
      const input: BuildInput = {
        project_id: editing.project_id,
        name: editing.name,
        slug: editing.slug,
        one_liner: editing.one_liner,
        stage: editing.stage,
        round_goal: editing.round_goal,
        latest_progress: editing.latest_progress,
        next_step: editing.next_step,
        detail_url: editing.detail_url,
        demo_url: editing.demo_url,
        repo_url: editing.repo_url,
        status: editing.status,
        sort_order: Number(editing.sort_order) || 0,
      };
      if (editingId) {
        await updateAdminBuild(editingId, input);
        push("构建项已更新", "success");
      } else {
        await createAdminBuild(input);
        push("构建项已创建", "success");
      }
      setEditing(null);
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      push(extractErrorMessage(err, "保存失败"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定要删除这个构建项吗？")) return;
    try {
      await deleteAdminBuild(id);
      push("构建项已删除", "success");
      await fetchItems();
    } catch (err) {
      push(extractErrorMessage(err, "删除失败"), "error");
    }
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel className="lab-card p-6">
            <Badge tone="cyan">构建中</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">正在构建</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              记录当前真实投入的工作：它是什么、做到哪一步、最近完成了什么、下一步要验证什么。已完成且不再持续构建的对象请归档，不要留在这里。
            </p>
            <Button className="mt-4" icon={<Plus size={15} />} variant="primary" onClick={handleNew}>
              新增构建项
            </Button>
          </Panel>
          <Panel className="lab-card p-5">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">过滤器</h2>
            <div className="mt-4 flex items-center gap-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                className="field-surface h-10 flex-1 rounded-[var(--radius)] px-4 text-sm text-[var(--text)] outline-none"
                placeholder="搜索名称或进展..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="mt-4">
              <span className="font-lab-mono text-xs text-[var(--muted)]">发布状态</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <FilterPill active={filterStatus === ""} onClick={() => setFilterStatus("")}>全部</FilterPill>
                {(Object.keys(statusConfig) as BuildStatus[]).map((status) => (
                  <FilterPill key={status} active={filterStatus === status} onClick={() => setFilterStatus(status)}>
                    {statusConfig[status].label}
                  </FilterPill>
                ))}
              </div>
            </div>
          </Panel>
        </header>

        {editing && (
          <Panel className="lab-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">
                {editingId ? "编辑构建项" : "新建构建项"}
              </h2>
              <Button variant="ghost" onClick={() => setEditing(null)}>取消</Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <ProjectAssociationField value={editing.project_id} onChange={(value) => setEditing({ ...editing, project_id: value })} />
                <Field label="名称" placeholder="真实产品或项目名" value={editing.name} onChange={(value) => setEditing({ ...editing, name: value })} />
                <Field label="一句话定义" placeholder="20–40 字，先写使用对象和用途" value={editing.one_liner} onChange={(value) => setEditing({ ...editing, one_liner: value })} />
                <Field label="本轮目标" multiline placeholder="当前为什么投入，只写一个近期目标" value={editing.round_goal} onChange={(value) => setEditing({ ...editing, round_goal: value })} />
                <Field label="最新进展" multiline placeholder="已经完成或已经观察到的内容" value={editing.latest_progress} onChange={(value) => setEditing({ ...editing, latest_progress: value })} />
                <Field label="下一步" multiline placeholder="一个可检查的动作" value={editing.next_step} onChange={(value) => setEditing({ ...editing, next_step: value })} />
              </div>
              <div className="space-y-4">
                <Field label="Slug" value={editing.slug} onChange={(value) => setEditing({ ...editing, slug: value })} />
                <div>
                  <span className="font-lab-mono text-xs text-[var(--muted)]">当前阶段</span>
                  <select
                    className="field-surface mt-2 block w-full rounded-[var(--radius)] px-4 py-3 text-sm outline-none"
                    value={editing.stage}
                    onChange={(event) => setEditing({ ...editing, stage: event.target.value as BuildStage })}
                  >
                    {(Object.keys(stageConfig) as BuildStage[]).map((stage) => (
                      <option key={stage} value={stage}>{stageConfig[stage].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="font-lab-mono text-xs text-[var(--muted)]">发布状态</span>
                  <select
                    className="field-surface mt-2 block w-full rounded-[var(--radius)] px-4 py-3 text-sm outline-none"
                    value={editing.status}
                    onChange={(event) => setEditing({ ...editing, status: event.target.value as BuildStatus })}
                  >
                    {(Object.keys(statusConfig) as BuildStatus[]).map((status) => (
                      <option key={status} value={status}>{statusConfig[status].label}</option>
                    ))}
                  </select>
                </div>
                <Field label="排序" value={editing.sort_order} onChange={(value) => setEditing({ ...editing, sort_order: value })} />
                <Field label="详情入口" placeholder="https:// 或 /path" value={editing.detail_url} onChange={(value) => setEditing({ ...editing, detail_url: value })} />
                <Field label="演示入口" value={editing.demo_url} onChange={(value) => setEditing({ ...editing, demo_url: value })} />
                <Field label="仓库入口" value={editing.repo_url} onChange={(value) => setEditing({ ...editing, repo_url: value })} />
                <Button disabled={saving} variant="primary" onClick={handleSave}>
                  {saving ? "保存中..." : editingId ? "更新" : "创建"}
                </Button>
              </div>
            </div>
          </Panel>
        )}

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">记录列表</h2>
            <Badge tone="cyan">{items.length} 条</Badge>
          </div>
          {loading ? (
            <div className="p-8 text-center font-lab-mono text-sm text-[var(--muted)]">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center font-lab-mono text-sm text-[var(--muted)]">还没有构建项。</div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {items.map((item) => {
                const stale = isStale(item.progressed_at);
                return (
                  <div className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-field)]" key={item.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-[var(--text-strong)]">{item.name}</h3>
                        <Badge tone={stageConfig[item.stage].tone}>{stageConfig[item.stage].label}</Badge>
                        <Badge tone={statusConfig[item.status].tone}>{statusConfig[item.status].label}</Badge>
                        {stale && <Badge tone="rose">超过 30 天无进展</Badge>}
                      </div>
                      {item.one_liner && <p className="mt-1 truncate text-xs text-[var(--muted)]">{item.one_liner}</p>}
                      {(item.latest_progress || item.next_step) && (
                        <p className="mt-1 truncate font-lab-mono text-[10px] text-[var(--muted-low)]">
                          {item.latest_progress || item.next_step}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-lab-mono text-xs text-[var(--muted-low)]">
                      {formatShortDate(item.progressed_at || item.updated_at)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button className="w-8 px-0" variant="ghost" onClick={() => handleEdit(item.id)}>
                        <ChevronRight size={14} />
                      </Button>
                      <Button className="w-8 px-0" variant="ghost" onClick={() => handleDelete(item.id)}>
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

function randomSlug() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

function isStale(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > 30 * 24 * 60 * 60 * 1000;
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}
