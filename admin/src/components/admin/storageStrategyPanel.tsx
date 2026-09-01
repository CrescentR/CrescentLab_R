"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";

export type StorageProvider = "local" | "s3" | "oss" | "cos" | "r2";

export type StorageStrategy = {
  id: string;
  name: string;
  description: string;
  provider: StorageProvider;
  path: string;
  configured: boolean;
  isDefault: boolean;
  builtin: boolean;
  endpoint?: string;
  bucket?: string;
  updatedAt: string;
};

const STORAGE_KEY = "crescentlab-storage-strategies";

const providerLabel: Record<StorageProvider, string> = {
  local: "本机存储",
  s3: "Amazon S3",
  oss: "阿里云 OSS",
  cos: "腾讯云 COS",
  r2: "Cloudflare R2",
};

const seedStrategies: StorageStrategy[] = [
  {
    id: "local_user_avatar",
    name: "内置-用户头像",
    description: "用户头像默认",
    provider: "local",
    path: "/user_avatar",
    configured: true,
    isDefault: true,
    builtin: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "local_article_image",
    name: "内置-文章图片",
    description: "文章图片默认",
    provider: "local",
    path: "/article_image",
    configured: true,
    isDefault: true,
    builtin: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "local_article_attachment",
    name: "内置-文章附件",
    description: "文章附件默认",
    provider: "local",
    path: "/article_attachment",
    configured: true,
    isDefault: true,
    builtin: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "local_root",
    name: "内置",
    description: "默认",
    provider: "local",
    path: "/",
    configured: true,
    isDefault: false,
    builtin: true,
    updatedAt: new Date().toISOString(),
  },
];

type FormState = {
  id?: string;
  name: string;
  description: string;
  provider: StorageProvider;
  path: string;
  endpoint: string;
  bucket: string;
  configured: boolean;
  isDefault: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  provider: "local",
  path: "/",
  endpoint: "",
  bucket: "",
  configured: true,
  isDefault: false,
};

function loadStrategies(): StorageStrategy[] {
  if (typeof window === "undefined") return seedStrategies;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedStrategies;
    const parsed = JSON.parse(raw) as StorageStrategy[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedStrategies;
  } catch {
    return seedStrategies;
  }
}

export function StorageStrategyPanel() {
  const { push } = useToast();
  const [strategies, setStrategies] = useState<StorageStrategy[]>(seedStrategies);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setStrategies(loadStrategies());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
  }, [hydrated, strategies]);

  const stats = useMemo(() => {
    const configured = strategies.filter((item) => item.configured).length;
    return {
      total: strategies.length,
      configured,
      defaults: strategies.filter((item) => item.isDefault).length,
      unconfigured: strategies.length - configured,
    };
  }, [strategies]);

  const openCreate = useCallback(() => {
    setEditing({ ...emptyForm });
  }, []);

  const openEdit = useCallback((strategy: StorageStrategy) => {
    setEditing({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      provider: strategy.provider,
      path: strategy.path,
      endpoint: strategy.endpoint || "",
      bucket: strategy.bucket || "",
      configured: strategy.configured,
      isDefault: strategy.isDefault,
    });
  }, []);

  function handleRefresh() {
    setStrategies(loadStrategies());
    push("已刷新本地策略配置", "info");
  }

  function handleSave() {
    if (!editing) return;
    if (!editing.name.trim()) {
      push("策略名称为必填项", "error");
      return;
    }
    if (!editing.path.trim()) {
      push("存储路径为必填项", "error");
      return;
    }

    const next: StorageStrategy = {
      id: editing.id || `strategy_${Date.now().toString(36)}`,
      name: editing.name.trim(),
      description: editing.description.trim() || "自定义策略",
      provider: editing.provider,
      path: editing.path.trim().startsWith("/") ? editing.path.trim() : `/${editing.path.trim()}`,
      configured: editing.configured,
      isDefault: editing.isDefault,
      builtin: Boolean(editing.id && strategies.find((item) => item.id === editing.id)?.builtin),
      endpoint: editing.endpoint.trim() || undefined,
      bucket: editing.bucket.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    setStrategies((prev) => {
      const exists = prev.some((item) => item.id === next.id);
      if (exists) return prev.map((item) => (item.id === next.id ? next : item));
      return [next, ...prev];
    });
    setEditing(null);
    push(editing.id ? "存储策略已更新（本地雏形）" : "存储策略已添加（本地雏形）", "success");
  }

  function handleDelete(id: string) {
    const target = strategies.find((item) => item.id === id);
    if (!target) return;
    if (target.builtin) {
      push("内置策略不可删除，可改为编辑路径或说明", "error");
      return;
    }
    if (!confirm(`确定删除策略「${target.name}」吗？`)) return;
    setStrategies((prev) => prev.filter((item) => item.id !== id));
    if (editing?.id === id) setEditing(null);
    push("策略已删除", "success");
  }

  return (
    <main className="storage-page flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="storage-shell mx-auto flex max-w-7xl flex-col gap-6">
        <header className="storage-header">
          <div>
            <h1>存储策略</h1>
            <p>配置文件存储服务，支持本地存储和多种云存储</p>
            <Badge className="mt-3" tone="amber">雏形 · 配置保存在本地</Badge>
          </div>
          <div className="storage-header-actions">
            <Button icon={<Plus size={15} />} variant="primary" onClick={openCreate}>
              添加策略
            </Button>
            <Button icon={<RefreshCw size={15} />} variant="secondary" onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </header>

        <section className="storage-stats">
          <StatCard icon={<Layers size={18} />} label="全部策略" tone="teal" value={stats.total} />
          <StatCard icon={<CheckCircle2 size={18} />} label="已配置" tone="green" value={stats.configured} />
          <StatCard icon={<Star size={18} />} label="默认策略" tone="amber" value={stats.defaults} />
          <StatCard icon={<AlertCircle size={18} />} label="未配置" tone="rose" value={stats.unconfigured} />
        </section>

        {editing && (
          <Panel className="lab-card storage-editor p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">
                {editing.id ? "编辑存储策略" : "添加存储策略"}
              </h2>
              <button aria-label="关闭" className="storage-icon-btn" onClick={() => setEditing(null)} type="button">
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                label="策略名称"
                value={editing.name}
                onChange={(value) => setEditing({ ...editing, name: value })}
                placeholder="例如：文章图片 OSS"
              />
              <Field
                label="说明"
                value={editing.description}
                onChange={(value) => setEditing({ ...editing, description: value })}
                placeholder="用途说明"
              />
              <label className="storage-field">
                <span>存储类型</span>
                <select
                  value={editing.provider}
                  onChange={(event) =>
                    setEditing({ ...editing, provider: event.target.value as StorageProvider })
                  }
                >
                  {(Object.keys(providerLabel) as StorageProvider[]).map((key) => (
                    <option key={key} value={key}>
                      {providerLabel[key]}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="路径前缀"
                value={editing.path}
                onChange={(value) => setEditing({ ...editing, path: value })}
                placeholder="/article_image"
              />
              {editing.provider !== "local" && (
                <>
                  <Field
                    label="Endpoint"
                    value={editing.endpoint}
                    onChange={(value) => setEditing({ ...editing, endpoint: value })}
                    placeholder="https://s3.amazonaws.com"
                  />
                  <Field
                    label="Bucket"
                    value={editing.bucket}
                    onChange={(value) => setEditing({ ...editing, bucket: value })}
                    placeholder="crescentlab-media"
                  />
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="storage-check">
                <input
                  checked={editing.configured}
                  onChange={(event) => setEditing({ ...editing, configured: event.target.checked })}
                  type="checkbox"
                />
                已完成配置
              </label>
              <label className="storage-check">
                <input
                  checked={editing.isDefault}
                  onChange={(event) => setEditing({ ...editing, isDefault: event.target.checked })}
                  type="checkbox"
                />
                设为默认策略
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleSave}>
                保存策略
              </Button>
              {editing.id && !strategies.find((item) => item.id === editing.id)?.builtin && (
                <Button variant="secondary" onClick={() => handleDelete(editing.id!)}>
                  删除
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditing(null)}>
                取消
              </Button>
            </div>
          </Panel>
        )}

        <section className="storage-grid">
          <button className="storage-add-card" onClick={openCreate} type="button">
            <span className="storage-add-icon">
              <Plus size={22} />
            </span>
            <strong>添加存储策略</strong>
            <span>支持本地、云存储等多种类型</span>
          </button>

          {strategies.map((strategy) => (
            <article className="storage-card" key={strategy.id}>
              <div className="storage-card-top">
                <span className="storage-card-icon" aria-hidden="true">
                  {strategy.provider === "local" ? <HardDrive size={20} /> : <Server size={20} />}
                </span>
                <button
                  aria-label={`编辑 ${strategy.name}`}
                  className="storage-icon-btn"
                  onClick={() => openEdit(strategy)}
                  type="button"
                >
                  <Pencil size={15} />
                </button>
              </div>
              <div className="storage-card-title">
                <h3>{strategy.name}</h3>
                <span>{strategy.description}</span>
              </div>
              <div className="storage-card-meta">
                <span>{providerLabel[strategy.provider]}</span>
                {strategy.isDefault && <Badge tone="amber">默认</Badge>}
                {!strategy.configured && <Badge tone="rose">未配置</Badge>}
              </div>
              <code className="storage-card-path">{strategy.path}</code>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "teal" | "green" | "amber" | "rose";
}) {
  return (
    <div className={`storage-stat storage-stat-${tone}`}>
      <span className="storage-stat-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="storage-field">
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}
