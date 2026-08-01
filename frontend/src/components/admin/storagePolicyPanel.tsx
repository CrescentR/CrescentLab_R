"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Cloud, KeyRound, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import {
  authorizeOneDrive,
  createStoragePolicy,
  listStoragePolicies,
  setDefaultStoragePolicy,
  setStoragePolicyStatus,
  testStoragePolicy,
  updateStoragePolicy,
  type StoragePolicy,
  type StoragePolicyInput,
  type StorageType,
} from "@/lib/api/storage";

const storageTypes: { value: StorageType; label: string }[] = [
  { value: "aws_s3", label: "AWS S3" },
  { value: "cloudflare_r2", label: "Cloudflare R2" },
  { value: "s3_compatible", label: "S3 兼容存储 / MinIO" },
  { value: "aliyun_oss", label: "阿里云 OSS" },
  { value: "tencent_cos", label: "腾讯云 COS" },
  { value: "qiniu", label: "七牛云 Kodo" },
  { value: "onedrive", label: "OneDrive" },
];

function blankPolicy(): StoragePolicyInput {
  return {
    name: "",
    type: "aws_s3",
    bucket: "",
    endpoint: "",
    region: "us-east-1",
    base_url: "",
    root_prefix: "uploads",
    public_read: false,
    force_path_style: false,
    auth_mode: "delegated",
    tenant_id: "",
    client_id: "",
    drive_id: "",
    is_default: true,
    access_key_id: "",
    secret_access_key: "",
    client_secret: "",
  };
}

export function StoragePolicyPanel() {
  const [policies, setPolicies] = useState<StoragePolicy[]>([]);
  const [form, setForm] = useState(blankPolicy);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    try {
      setPolicies((await listStoragePolicies()).policies);
      setError("");
    } catch (cause) {
      setError(message(cause, "读取存储策略失败"));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        await updateStoragePolicy(editingId, form);
      } else {
        await createStoragePolicy(form);
      }
      setForm(blankPolicy());
      setEditingId(null);
      setShowForm(false);
      await reload();
    } catch (cause) {
      setError(message(cause, "创建存储策略失败"));
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await reload();
    } catch (cause) {
      setError(message(cause, "操作失败"));
    } finally {
      setBusy(false);
    }
  }

  const set = (key: keyof StoragePolicyInput, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const oneDrive = form.type === "onedrive";

  function edit(policy: StoragePolicy) {
    setForm({
      ...policy,
      access_key_id: "",
      secret_access_key: "",
      client_secret: "",
    });
    setEditingId(policy.id);
    setShowForm(true);
  }

  return (
    <main className="flex-1 overflow-auto px-5 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
          <div>
            <h1 className="font-lab-display text-3xl font-semibold text-[var(--text-strong)]">存储策略</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">默认策略用于内容编辑器中的图片和附件上传。</p>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setShowForm((value) => !value)} variant="primary">添加策略</Button>
        </header>

        {error && <Panel className="border-[var(--danger)] p-4 text-sm text-[var(--danger)]">{error}</Panel>}

        {showForm && (
          <Panel className="p-6 md:p-8">
            <form className="space-y-6" onSubmit={submit}>
              <div className="flex items-center gap-3 border-b border-[var(--border-soft)] pb-5">
                <Cloud className="text-[var(--cyan)]" size={20} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">{editingId ? "编辑存储策略" : "添加存储策略"}</h2>
              </div>
              <label className="flex flex-col gap-2">
                <span className="font-lab-mono text-xs text-[var(--muted)]">存储类型</span>
                <select className="field-surface rounded-[var(--radius)] px-4 py-3 text-sm" value={form.type} onChange={(event) => set("type", event.target.value)}>
                  {storageTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="名称 *" value={form.name} onChange={(value) => set("name", value)} />
                <Field label="存储根目录" value={form.root_prefix} onChange={(value) => set("root_prefix", value)} />
                {oneDrive ? (
                  <>
                    <label className="flex flex-col gap-2">
                      <span className="font-lab-mono text-xs text-[var(--muted)]">授权方式</span>
                      <select className="field-surface rounded-[var(--radius)] px-4 py-3 text-sm" value={form.auth_mode} onChange={(event) => set("auth_mode", event.target.value)}>
                        <option value="delegated">管理员 OAuth 委托授权</option>
                        <option value="application">应用凭据</option>
                      </select>
                    </label>
                    <Field label="Tenant ID *" value={form.tenant_id || ""} onChange={(value) => set("tenant_id", value)} />
                    <Field label="Client ID *" value={form.client_id || ""} onChange={(value) => set("client_id", value)} />
                    <SecretField label="Client Secret *" value={form.client_secret} onChange={(value) => set("client_secret", value)} />
                    <Field label="Drive ID *" value={form.drive_id || ""} onChange={(value) => set("drive_id", value)} />
                  </>
                ) : (
                  <>
                    <Field label="Bucket *" value={form.bucket} onChange={(value) => set("bucket", value)} />
                    <Field label="Endpoint *" value={form.endpoint} onChange={(value) => set("endpoint", value)} />
                    <Field label="Region" value={form.region} onChange={(value) => set("region", value)} />
                    <Field label="CDN 域名（可选）" value={form.base_url} onChange={(value) => set("base_url", value)} />
                    <Field label="Access Key ID *" value={form.access_key_id} onChange={(value) => set("access_key_id", value)} />
                    <SecretField label="Secret Access Key *" value={form.secret_access_key} onChange={(value) => set("secret_access_key", value)} />
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-5">
                {!oneDrive && <Toggle checked={form.force_path_style} label="强制 Path Style" onChange={(value) => set("force_path_style", value)} />}
                <Toggle checked={form.is_default} label="设为默认策略" onChange={(value) => set("is_default", value)} />
              </div>
              <div className="flex justify-end gap-3">
                <Button onClick={() => { setShowForm(false); setEditingId(null); setForm(blankPolicy()); }}>取消</Button>
                <Button disabled={busy} type="submit" variant="primary">{busy ? "保存中" : "保存"}</Button>
              </div>
            </form>
          </Panel>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          {policies.map((policy) => (
            <Panel className="p-5" key={policy.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-[var(--text-strong)]">{policy.name}</strong>
                    {policy.is_default && <span className="rounded-full bg-[var(--cyan-soft)] px-2 py-1 text-[10px] text-[var(--cyan)]">默认</span>}
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">{storageTypes.find((type) => type.value === policy.type)?.label}</p>
                  <p className="mt-1 truncate font-lab-mono text-xs text-[var(--muted-low)]">{policy.type === "onedrive" ? policy.drive_id : policy.endpoint}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button disabled={busy} onClick={() => run(() => testStoragePolicy(policy.id))}>测试</Button>
                  <Button disabled={busy} onClick={() => edit(policy)}>编辑</Button>
                  {policy.type === "onedrive" && policy.auth_mode === "delegated" && (
                    <Button disabled={busy} icon={<KeyRound size={14} />} onClick={() => run(() => authorizeOneDrive(policy.id))}>授权</Button>
                  )}
                  {!policy.is_default && <Button disabled={busy} icon={<Star size={14} />} onClick={() => run(() => setDefaultStoragePolicy(policy.id))}>设为默认</Button>}
                  <Button disabled={busy} onClick={() => run(() => setStoragePolicyStatus(policy.id, policy.status === "active" ? "disabled" : "active"))}>
                    {policy.status === "active" ? "停用" : "启用"}
                  </Button>
                  <Button disabled={busy} onClick={() => {
                    if (window.confirm(`确定删除存储策略“${policy.name}”吗？已上传文件不会被删除。`)) {
                      void run(() => setStoragePolicyStatus(policy.id, "deleted"));
                    }
                  }}>删除</Button>
                </div>
              </div>
            </Panel>
          ))}
          {!policies.length && !showForm && <Panel className="p-8 text-center text-sm text-[var(--muted)]">尚未配置存储策略。</Panel>}
        </section>
      </div>
    </main>
  );
}

function SecretField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-lab-mono text-xs text-[var(--muted)]">{label}</span>
      <input className="field-surface rounded-[var(--radius)] px-4 py-3 text-sm" onChange={(event) => onChange(event.target.value)} type="password" value={value} />
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button className="flex items-center gap-2 text-sm text-[var(--text)]" onClick={() => onChange(!checked)} type="button">
      <span className="grid size-5 place-items-center rounded border border-[var(--border)] bg-[var(--surface-field)] text-[var(--cyan)]">{checked && <Check size={13} />}</span>
      {label}
    </button>
  );
}

function message(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
