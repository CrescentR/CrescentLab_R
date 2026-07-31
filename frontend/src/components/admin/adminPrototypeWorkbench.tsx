"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Beaker,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type PrototypeItem = {
  id: string;
  title: string;
  summary: string;
  status: string;
  updatedAt: string;
};

type StatusOption = {
  value: string;
  label: string;
  tone?: "cyan" | "green" | "amber" | "rose" | "purple" | "neutral";
};

type AdminPrototypeWorkbenchProps = {
  moduleKey: string;
  title: string;
  description: string;
  badge: string;
  badgeTone?: StatusOption["tone"];
  createLabel: string;
  statuses: StatusOption[];
  seedItems: PrototypeItem[];
  emptyHint: string;
};

function storageKey(moduleKey: string) {
  return `crescentlab-prototype:${moduleKey}`;
}

function createId() {
  return `proto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadItems(moduleKey: string, seedItems: PrototypeItem[]): PrototypeItem[] {
  if (typeof window === "undefined") return seedItems;
  try {
    const raw = localStorage.getItem(storageKey(moduleKey));
    if (!raw) return seedItems;
    const parsed = JSON.parse(raw) as PrototypeItem[];
    return Array.isArray(parsed) ? parsed : seedItems;
  } catch {
    return seedItems;
  }
}

export function AdminPrototypeWorkbench({
  moduleKey,
  title,
  description,
  badge,
  badgeTone = "cyan",
  createLabel,
  statuses,
  seedItems,
  emptyHint,
}: AdminPrototypeWorkbenchProps) {
  const { push } = useToast();
  const [items, setItems] = useState<PrototypeItem[]>(seedItems);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<PrototypeItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setItems(loadItems(moduleKey, seedItems));
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [moduleKey, seedItems]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey(moduleKey), JSON.stringify(items));
  }, [hydrated, items, moduleKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  function handleNew() {
    setIsNew(true);
    setEditing({
      id: createId(),
      title: "",
      summary: "",
      status: statuses[0]?.value ?? "draft",
      updatedAt: new Date().toISOString(),
    });
  }

  function handleEdit(item: PrototypeItem) {
    setIsNew(false);
    setEditing({ ...item });
  }

  function handleSave() {
    if (!editing) return;
    if (!editing.title.trim()) {
      push("标题为必填项", "error");
      return;
    }
    const next = {
      ...editing,
      title: editing.title.trim(),
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => {
      const exists = prev.some((item) => item.id === next.id);
      if (exists) return prev.map((item) => (item.id === next.id ? next : item));
      return [next, ...prev];
    });
    setEditing(null);
    setIsNew(false);
    push(isNew ? "雏形记录已创建（本地）" : "雏形记录已更新（本地）", "success");
  }

  function handleDelete(id: string) {
    if (!confirm("确定删除这条雏形记录吗？")) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editing?.id === id) {
      setEditing(null);
      setIsNew(false);
    }
    push("已删除本地雏形记录", "success");
  }

  function handleReset() {
    if (!confirm("重置为初始示例数据？当前本地修改会丢失。")) return;
    setItems(seedItems);
    setEditing(null);
    push("已恢复示例数据", "info");
  }

  function statusMeta(value: string) {
    return statuses.find((item) => item.value === value) ?? {
      value,
      label: value,
      tone: "neutral" as const,
    };
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Panel className="lab-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={badgeTone}>{badge}</Badge>
              <Badge tone="amber">雏形</Badge>
            </div>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-3 py-1 font-lab-mono text-[11px] text-[var(--amber)]">
              <Beaker size={12} />
              数据保存在浏览器本地，尚未接入后端 API
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={<Plus size={15} />} variant="primary" onClick={handleNew}>
                {createLabel}
              </Button>
              <Button icon={<RefreshCw size={15} />} variant="secondary" onClick={handleReset}>
                重置示例
              </Button>
            </div>
          </Panel>

          <Panel className="lab-card p-5">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">筛选</h2>
            <div className="mt-4 flex items-center gap-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                className="field-surface h-10 flex-1 rounded-[var(--radius)] px-4 text-sm outline-none"
                placeholder="搜索标题或摘要…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip active={statusFilter === ""} onClick={() => setStatusFilter("")}>
                全部
              </FilterChip>
              {statuses.map((status) => (
                <FilterChip
                  active={statusFilter === status.value}
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                >
                  {status.label}
                </FilterChip>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-3">
                <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">记录</span>
                <strong className="mt-1 block text-2xl text-[var(--text-strong)]">{items.length}</strong>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-3">
                <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">筛选结果</span>
                <strong className="mt-1 block text-2xl text-[var(--text-strong)]">{filtered.length}</strong>
              </div>
            </div>
          </Panel>
        </header>

        {editing && (
          <Panel className="lab-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">
                {isNew ? "新建雏形记录" : "编辑雏形记录"}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
              >
                取消
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
              <div className="space-y-4">
                <input
                  className="field-surface block w-full rounded-[var(--radius)] px-4 py-3 text-sm outline-none"
                  placeholder="标题"
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                />
                <textarea
                  className="field-surface block w-full rounded-[var(--radius)] px-4 py-3 text-sm outline-none"
                  placeholder="摘要 / 说明"
                  rows={5}
                  value={editing.summary}
                  onChange={(event) => setEditing({ ...editing, summary: event.target.value })}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <span className="font-lab-mono text-xs text-[var(--muted)]">状态</span>
                  <select
                    className="field-surface mt-2 block w-full rounded-[var(--radius)] px-4 py-3 text-sm outline-none"
                    value={editing.status}
                    onChange={(event) => setEditing({ ...editing, status: event.target.value })}
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="primary" onClick={handleSave}>
                  保存到本地
                </Button>
              </div>
            </div>
          </Panel>
        )}

        <Panel className="lab-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">记录列表</h2>
            <span className="font-lab-mono text-xs text-[var(--muted)]">
              {hydrated ? `${filtered.length} 条` : "加载中…"}
            </span>
          </div>
          {!hydrated ? (
            <div className="px-5 py-14 text-center font-lab-mono text-sm text-[var(--muted)]">正在读取本地数据…</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center font-lab-mono text-sm text-[var(--muted)]">{emptyHint}</div>
          ) : (
            <ul className="divide-y divide-[var(--border-soft)]">
              {filtered.map((item) => {
                const meta = statusMeta(item.status);
                return (
                  <li
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-field)] md:flex-row md:items-center md:justify-between"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone ?? "neutral"}>{meta.label}</Badge>
                        <span className="font-lab-mono text-xs text-[var(--muted-low)]">
                          {new Date(item.updatedAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate font-lab-display text-xl font-semibold text-[var(--text-strong)]">
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.summary || "暂无说明"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button icon={<Trash2 size={14} />} variant="secondary" onClick={() => handleDelete(item.id)}>
                        删除
                      </Button>
                      <Button icon={<Pencil size={14} />} variant="primary" onClick={() => handleEdit(item)}>
                        编辑
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </main>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-full border px-3 py-1.5 font-lab-mono text-xs transition-colors",
        active
          ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
          : "border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted)]",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
