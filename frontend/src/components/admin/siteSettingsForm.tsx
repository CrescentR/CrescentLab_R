"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, ImagePlus, Loader2, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/mediaPickerModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { listAdminSettings, saveAdminSettings } from "@/lib/api/settings";
import type { AdminSetting } from "@/lib/api/settings";
import { uploadStorageFile } from "@/lib/api/storage";
import {
  BRANDING_SETTINGS_GROUP_KEY,
  SITE_SETTINGS_SCOPE,
  brandingSettingKeys,
  brandingSettingRows,
} from "@/lib/site-settings";
import type { BrandingSettingKey, SiteSettingRow } from "@/lib/site-settings";

type FieldMeta = {
  label: string;
  hint: string;
  preview: "mark" | "avatar" | "hero";
};

const fieldMeta: Record<BrandingSettingKey, FieldMeta> = {
  siteLogoUrl: {
    label: "前台标志",
    hint: "站点导航与品牌位使用的图标。建议正方形透明背景。",
    preview: "mark",
  },
  adminLogoUrl: {
    label: "后台标志",
    hint: "后台侧栏与顶栏使用的图标。",
    preview: "mark",
  },
  defaultAvatarUrl: {
    label: "默认头像",
    hint: "用户未设置头像时的占位图。",
    preview: "avatar",
  },
  heroImageUrl: {
    label: "首页主图",
    hint: "首页或宣传位主视觉。建议横图，宽度 1400px 以上。",
    preview: "hero",
  },
  faviconUrl: {
    label: "浏览器图标",
    hint: "浏览器标签页 favicon，可用 SVG 或 32×32 PNG。",
    preview: "mark",
  },
};

function isValidAssetUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function SiteSettingsForm() {
  const { push } = useToast();
  const [rows, setRows] = useState<SiteSettingRow[]>(brandingSettingRows);
  const [savedRows, setSavedRows] = useState<SiteSettingRow[]>(brandingSettingRows);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<BrandingSettingKey | null>(null);
  const [pickerKey, setPickerKey] = useState<BrandingSettingKey | null>(null);
  const [brokenPreviews, setBrokenPreviews] = useState<Partial<Record<BrandingSettingKey, boolean>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<BrandingSettingKey | null>(null);

  const changed = useMemo(() => JSON.stringify(rows) !== JSON.stringify(savedRows), [rows, savedRows]);
  const invalidKeys = useMemo(
    () => rows.filter((row) => !isValidAssetUrl(row.value)).map((row) => row.key),
    [rows],
  );

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await listAdminSettings({
          scope: SITE_SETTINGS_SCOPE,
          group_key: BRANDING_SETTINGS_GROUP_KEY,
        });
        if (!mounted) return;

        const nextRows = mergeBrandingRows(response.settings);
        setRows(nextRows);
        setSavedRows(nextRows);
        setBrokenPreviews({});
        setStatus("ready");
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
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
    if (invalidKeys.length > 0) {
      setError("请先修正无效的资源地址后再保存。");
      push("存在无效 URL，请检查标红字段", "error");
      return;
    }

    setStatus("saving");
    setError(null);

    try {
      const response = await saveAdminSettings(
        rows.map((row) => ({
          ...row,
          value: row.value.trim(),
          is_encrypted: false,
          description: fieldMeta[row.key].hint,
        })),
      );
      const nextRows = mergeBrandingRows(response.settings);
      setRows(nextRows);
      setSavedRows(nextRows);
      setBrokenPreviews({});
      setStatus("saved");
      push("站点品牌设置已保存", "success");
    } catch (saveError) {
      setStatus("error");
      const message = saveError instanceof Error ? saveError.message : "保存设置失败";
      setError(message);
      push(message, "error");
    }
  }

  function updateRow(key: BrandingSettingKey, value: string) {
    setRows((currentRows) => currentRows.map((row) => (row.key === key ? { ...row, value } : row)));
    setBrokenPreviews((current) => ({ ...current, [key]: false }));
    if (status === "saved") setStatus("ready");
  }

  function resetRow(key: BrandingSettingKey) {
    const fallback = brandingSettingRows.find((row) => row.key === key)?.value ?? "";
    updateRow(key, fallback);
  }

  function clearRow(key: BrandingSettingKey) {
    updateRow(key, "");
  }

  function openUploader(key: BrandingSettingKey) {
    uploadTargetRef.current = key;
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const key = uploadTargetRef.current;
    event.target.value = "";
    uploadTargetRef.current = null;
    if (!file || !key) return;

    if (!file.type.startsWith("image/")) {
      push("请上传图片文件", "error");
      return;
    }

    setUploadingKey(key);
    try {
      const uploaded = await uploadStorageFile(file);
      updateRow(key, uploaded.url);
      push(`${fieldMeta[key].label}已上传`, "success");
    } catch (uploadError) {
      push(uploadError instanceof Error ? uploadError.message : "上传失败", "error");
    } finally {
      setUploadingKey(null);
    }
  }

  const busy = status === "loading" || status === "saving" || uploadingKey !== null;

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <form className="mx-auto flex max-w-5xl flex-col gap-6" onSubmit={handleSubmit}>
        <input
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          type="file"
          onChange={(event) => void handleFileChange(event)}
        />

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone={status === "error" ? "rose" : status === "saved" ? "green" : changed ? "amber" : "cyan"}>
              {statusLabel(status, changed)}
            </Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">站点设置</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              配置站点标志、后台标志、默认头像、首页主图和浏览器图标。可粘贴地址，也可直接上传到当前存储策略。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!changed || busy}
              icon={<RotateCcw size={15} />}
              type="button"
              variant="secondary"
              onClick={() => {
                setRows(savedRows);
                setBrokenPreviews({});
                setError(null);
                setStatus("ready");
              }}
            >
              撤销更改
            </Button>
            <Button disabled={!changed || busy || invalidKeys.length > 0} icon={<Save size={15} />} type="submit" variant="primary">
              {status === "saving" ? "保存中…" : "保存设置"}
            </Button>
          </div>
        </header>

        {error ? (
          <Panel className="border-[rgba(179,82,74,0.28)] bg-[rgba(179,82,74,0.06)] p-4 shadow-none">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </Panel>
        ) : null}

        <Panel className="lab-card overflow-hidden p-0">
          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">品牌资源</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              可粘贴地址、上传新图，或从已上传的媒体库中选择。
            </p>
          </div>

          <ul className="settings-branding-list">
            {rows.map((row) => {
              const meta = fieldMeta[row.key];
              const invalid = invalidKeys.includes(row.key);
              const previewBroken = Boolean(brokenPreviews[row.key]);
              const hasValue = row.value.trim().length > 0;
              const uploading = uploadingKey === row.key;

              return (
                <li className={`settings-branding-item${meta.preview === "hero" ? " is-hero" : ""}`} key={row.key}>
                  <div className={`settings-branding-preview is-${meta.preview}`}>
                    {hasValue && !previewBroken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={meta.label}
                        src={row.value}
                        onError={() => setBrokenPreviews((current) => ({ ...current, [row.key]: true }))}
                      />
                    ) : (
                      <span className="settings-branding-preview-empty">
                        <ImagePlus size={18} strokeWidth={1.75} />
                        <span>{previewBroken ? "预览失败" : "暂无预览"}</span>
                      </span>
                    )}
                  </div>

                  <div className="settings-branding-fields">
                    <div className="settings-branding-copy">
                      <strong>{meta.label}</strong>
                      <p>{meta.hint}</p>
                    </div>

                    <label className="settings-branding-input">
                      <span className="sr-only">{meta.label}地址</span>
                      <input
                        disabled={busy}
                        placeholder="https://… 或 /f/…"
                        value={row.value}
                        onChange={(event) => updateRow(row.key, event.target.value)}
                      />
                    </label>
                    {invalid ? <p className="settings-branding-error">请输入有效的 http(s) 地址或站内路径</p> : null}

                    <div className="settings-branding-actions">
                      <button
                        className="settings-branding-action"
                        disabled={busy}
                        type="button"
                        onClick={() => setPickerKey(row.key)}
                      >
                        <FolderOpen size={14} />
                        媒体库选择
                      </button>
                      <button
                        className="settings-branding-action"
                        disabled={busy}
                        type="button"
                        onClick={() => openUploader(row.key)}
                      >
                        {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        {uploading ? "上传中" : "上传图片"}
                      </button>
                      <button
                        className="settings-branding-action"
                        disabled={busy || !hasValue}
                        type="button"
                        onClick={() => clearRow(row.key)}
                      >
                        <Trash2 size={14} />
                        清空
                      </button>
                      <button
                        className="settings-branding-action"
                        disabled={busy}
                        type="button"
                        onClick={() => resetRow(row.key)}
                      >
                        <RotateCcw size={14} />
                        恢复默认
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <MediaPickerModal
          open={pickerKey !== null}
          title={pickerKey ? `选择${fieldMeta[pickerKey].label}` : "从媒体库选择"}
          onClose={() => setPickerKey(null)}
          onSelect={(file) => {
            if (!pickerKey) return;
            updateRow(pickerKey, file.url);
            push(`已选用媒体：${file.name}`, "success");
          }}
        />
      </form>
    </main>
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

function statusLabel(status: "loading" | "ready" | "saving" | "saved" | "error", changed: boolean) {
  switch (status) {
    case "loading":
      return "加载中";
    case "saving":
      return "保存中";
    case "saved":
      return "已保存";
    case "error":
      return "出错";
    default:
      return changed ? "有未保存更改" : "就绪";
  }
}
