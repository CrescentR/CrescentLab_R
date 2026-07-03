"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Database, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { listAdminSettings, saveAdminSettings } from "@/lib/api/settings";
import type { AdminSetting } from "@/lib/api/settings";
import {
  BRANDING_SETTINGS_GROUP_KEY,
  SITE_SETTINGS_SCOPE,
  brandingSettingKeys,
  brandingSettingRows,
} from "@/lib/site-settings";
import type { BrandingSettingKey, SiteSettingRow } from "@/lib/site-settings";

const settingLabels: Record<BrandingSettingKey, string> = {
  siteLogoUrl: "前台标志 URL",
  adminLogoUrl: "后台标志 URL",
  defaultAvatarUrl: "默认头像 URL",
  heroImageUrl: "首页主图 URL",
  faviconUrl: "浏览器图标 URL",
};

export function SiteSettingsForm() {
  const [rows, setRows] = useState<SiteSettingRow[]>(brandingSettingRows);
  const [savedRows, setSavedRows] = useState<SiteSettingRow[]>(brandingSettingRows);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const changed = useMemo(() => JSON.stringify(rows) !== JSON.stringify(savedRows), [rows, savedRows]);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await listAdminSettings({
          scope: SITE_SETTINGS_SCOPE,
          group_key: BRANDING_SETTINGS_GROUP_KEY,
        });
        if (!mounted) {
          return;
        }

        const nextRows = mergeBrandingRows(response.settings);
        setRows(nextRows);
        setSavedRows(nextRows);
        setStatus("ready");
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setStatus("error");
        setError(loadError instanceof Error ? loadError.message : "读取设置失败");
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    try {
      const response = await saveAdminSettings(
        rows.map((row) => ({
          ...row,
          is_encrypted: false,
          description: null,
        })),
      );
      const nextRows = mergeBrandingRows(response.settings);
      setRows(nextRows);
      setSavedRows(nextRows);
      setStatus("saved");
    } catch (saveError) {
      setStatus("error");
      setError(saveError instanceof Error ? saveError.message : "保存设置失败");
    }
  }

  function updateRow(key: BrandingSettingKey, value: string) {
    setRows((currentRows) => currentRows.map((row) => (row.key === key ? { ...row, value } : row)));
  }

  return (
    <main className="flex-1 overflow-auto px-5 py-8 md:px-8">
      <form className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
        <section className="space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
            <div>
              <Badge tone={status === "error" ? "rose" : status === "saved" ? "green" : "cyan"}>{statusLabel(status)}</Badge>
              <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">Site Settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                管理站点标志、后台标志、默认头像、首页主图和 favicon。这些字段会写入后台设置表。
              </p>
            </div>
            <div className="flex gap-3">
              <Button disabled={!changed || status === "saving"} icon={<RotateCcw size={15} />} onClick={() => setRows(savedRows)} variant="secondary">
                撤销
              </Button>
              <Button disabled={!changed || status === "saving"} icon={<Save size={15} />} type="submit" variant="primary">
                {status === "saving" ? "保存中" : "保存"}
              </Button>
            </div>
          </header>

          {error && (
            <Panel className="border-[var(--danger)] bg-[var(--rose-soft)] p-4 shadow-none">
              <p className="text-sm leading-6 text-[var(--text-strong)]">{error}</p>
            </Panel>
          )}

          <Panel className="p-6 md:p-8">
            <div className="flex items-center gap-3 border-b border-[var(--border-soft)] pb-5">
              <SlidersHorizontal className="text-[var(--cyan)]" size={20} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Branding Assets</h2>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {rows.map((row) => (
                <Field
                  className={row.key === "heroImageUrl" ? "md:col-span-2" : undefined}
                  disabled={status === "loading" || status === "saving"}
                  key={row.key}
                  label={settingLabels[row.key]}
                  meta={
                    <span>
                      {row.scope}/{row.group_key}/{row.key}
                    </span>
                  }
                  onChange={(value) => updateRow(row.key, value)}
                  value={row.value}
                />
              ))}
            </div>
          </Panel>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Database className="text-[var(--cyan)]" size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">存储位置</h2>
            </div>
            <div className="mt-5 space-y-3">
              <SettingMeta label="scope" value={SITE_SETTINGS_SCOPE} />
              <SettingMeta label="group_key" value={BRANDING_SETTINGS_GROUP_KEY} />
              <SettingMeta label="fields" value={String(rows.length)} />
              <SettingMeta label="state" value={changed ? "modified" : "clean"} />
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">保存检查</h2>
            <div className="mt-5 space-y-3">
              <SettingMeta label="value_type" value="string" />
              <SettingMeta label="is_public" value="true" />
              <SettingMeta label="is_encrypted" value="false" />
            </div>
          </Panel>
        </aside>
      </form>
    </main>
  );
}

function SettingMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] px-3 py-2">
      <span className="font-lab-mono text-xs text-[var(--muted)]">{label}</span>
      <span className="truncate text-sm text-[var(--text-strong)]">{value}</span>
    </div>
  );
}

function mergeBrandingRows(settings: AdminSetting[]): SiteSettingRow[] {
  return brandingSettingRows.map((row) => {
    const saved = settings.find(
      (item) =>
        item.scope === SITE_SETTINGS_SCOPE &&
        item.group_key === BRANDING_SETTINGS_GROUP_KEY &&
        isBrandingSettingKey(item.key) &&
        item.key === row.key,
    );

    if (!saved || saved.value_type !== "string" || typeof saved.value !== "string") {
      return row;
    }

    return {
      scope: SITE_SETTINGS_SCOPE,
      group_key: BRANDING_SETTINGS_GROUP_KEY,
      key: row.key,
      value: saved.value,
      value_type: "string",
      is_public: true,
    };
  });
}

function isBrandingSettingKey(value: string): value is BrandingSettingKey {
  return brandingSettingKeys.includes(value as BrandingSettingKey);
}

function statusLabel(status: "loading" | "ready" | "saving" | "saved" | "error") {
  switch (status) {
    case "loading":
      return "Loading";
    case "ready":
      return "Ready";
    case "saving":
      return "Saving";
    case "saved":
      return "Saved";
    case "error":
      return "Needs database";
  }
}
