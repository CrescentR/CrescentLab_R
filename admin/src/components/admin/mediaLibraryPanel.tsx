"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  Copy,
  ExternalLink,
  FileIcon,
  Film,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { listStorageFiles, uploadStorageFile, type UploadedStorageFile } from "@/lib/api/storage";

const MAX_BYTES = 20 * 1024 * 1024;

type MediaKind = "all" | "image" | "video" | "other";

function fileKind(mime: string): Exclude<MediaKind, "all"> {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function isAllowedMedia(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function MediaLibraryPanel() {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedStorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MediaKind>("all");
  const [preview, setPreview] = useState<UploadedStorageFile | null>(null);
  const [error, setError] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listStorageFiles({ limit: 100 });
      setFiles(result.files ?? []);
    } catch (cause) {
      setError(extractErrorMessage(cause, "加载媒体库失败"));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFiles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return files.filter((file) => {
      const type = fileKind(file.mime_type);
      if (kind !== "all" && type !== kind) return false;
      if (!needle) return true;
      return file.name.toLowerCase().includes(needle) || file.mime_type.toLowerCase().includes(needle);
    });
  }, [files, kind, query]);

  const stats = useMemo(() => {
    let images = 0;
    let videos = 0;
    for (const file of files) {
      const type = fileKind(file.mime_type);
      if (type === "image") images += 1;
      if (type === "video") videos += 1;
    }
    return { total: files.length, images, videos };
  }, [files]);

  async function uploadFiles(selected: FileList | File[]) {
    const list = Array.from(selected);
    if (list.length === 0) return;

    const rejected: string[] = [];
    const accepted: File[] = [];
    for (const file of list) {
      if (!isAllowedMedia(file)) {
        rejected.push(`${file.name}（仅支持图片/视频）`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name}（超过 20MB）`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      push(rejected.slice(0, 2).join("；"), "error");
    }
    if (accepted.length === 0) return;

    setUploading(true);
    let success = 0;
    try {
      for (const file of accepted) {
        await uploadStorageFile(file);
        success += 1;
      }
      push(success === 1 ? "上传成功" : `已上传 ${success} 个文件`, "success");
      await loadFiles();
    } catch (cause) {
      push(cause instanceof Error ? cause.message : "上传失败", "error");
      if (success > 0) await loadFiles();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function copyLink(file: UploadedStorageFile) {
    const url = absoluteUrl(file.url);
    try {
      await navigator.clipboard.writeText(url);
      push("链接已复制", "success");
    } catch {
      push("复制失败，请手动选择地址", "error");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (uploading) return;
    void uploadFiles(event.dataTransfer.files);
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <Panel className="lab-card p-6">
            <Badge tone="amber">媒体库</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">媒体库</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              上传并管理图片、视频等媒体资源。文件写入当前默认云存储策略，不落本地磁盘，可通过稳定站内地址引用。单文件不超过 20MB。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                disabled={uploading}
                icon={uploading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                variant="primary"
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? "上传中…" : "上传媒体"}
              </Button>
              <Button
                disabled={loading || uploading}
                icon={<RefreshCw size={15} />}
                variant="secondary"
                onClick={() => void loadFiles()}
              >
                刷新
              </Button>
            </div>
            <input
              accept="image/*,video/*"
              className="hidden"
              multiple
              ref={inputRef}
              type="file"
              onChange={(event) => {
                if (event.target.files) void uploadFiles(event.target.files);
              }}
            />
          </Panel>

          <Panel className="lab-card grid grid-cols-3 gap-3 p-5">
            <div>
              <span className="block text-xs text-[var(--muted-low)]">全部</span>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-strong)]">
                {loading ? "—" : stats.total}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted-low)]">图片</span>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-strong)]">
                {loading ? "—" : stats.images}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted-low)]">视频</span>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-strong)]">
                {loading ? "—" : stats.videos}
              </strong>
            </div>
          </Panel>
        </header>

        <div
          className={`media-library-dropzone${dragOver ? " is-active" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragOver(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <Upload size={18} strokeWidth={1.75} />
          <div>
            <strong>拖拽图片或视频到此处上传</strong>
            <p>支持常见图片与视频格式，单文件 ≤ 20MB；也可点击上方按钮选择文件。</p>
          </div>
        </div>

        <Panel className="lab-card overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-[var(--border-soft)] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Search className="shrink-0 text-[var(--muted)]" size={16} />
              <input
                className="field-surface h-10 w-full rounded-[var(--radius)] px-3 text-sm outline-none"
                placeholder="搜索文件名或 MIME…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "全部"],
                  ["image", "图片"],
                  ["video", "视频"],
                  ["other", "其他"],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    kind === value
                      ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                      : "border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted)]"
                  }`}
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--danger)]">{error}</div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-[var(--muted)]">
              <Loader2 className="animate-spin" size={16} />
              正在读取媒体库…
            </div>
          ) : filtered.length === 0 ? (
            <div className="media-library-empty">
              <ImageIcon size={22} strokeWidth={1.75} />
              <h3>{files.length === 0 ? "还没有媒体文件" : "没有匹配的结果"}</h3>
              <p>
                {files.length === 0
                  ? "上传第一张图片或一段短视频后，可在站点设置与文章中引用。"
                  : "试试调整筛选或搜索关键词。"}
              </p>
            </div>
          ) : (
            <ul className="media-library-grid">
              {filtered.map((file) => {
                const type = fileKind(file.mime_type);
                return (
                  <li className="media-library-card" key={file.id}>
                    <button className="media-library-thumb" type="button" onClick={() => setPreview(file)}>
                      {type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={file.name} src={file.url} />
                      ) : type === "video" ? (
                        <span className="media-library-thumb-fallback">
                          <Film size={22} strokeWidth={1.75} />
                          <span>视频</span>
                        </span>
                      ) : (
                        <span className="media-library-thumb-fallback">
                          <FileIcon size={22} strokeWidth={1.75} />
                          <span>文件</span>
                        </span>
                      )}
                    </button>
                    <div className="media-library-card-body">
                      <strong title={file.name}>{file.name}</strong>
                      <p>
                        {file.mime_type || "unknown"} · {formatSize(file.size_bytes)}
                      </p>
                      <p>{formatDate(file.created_at)}</p>
                      <div className="media-library-card-actions">
                        <button type="button" onClick={() => void copyLink(file)}>
                          <Copy size={13} />
                          复制链接
                        </button>
                        <a href={file.url} rel="noreferrer" target="_blank">
                          <ExternalLink size={13} />
                          打开
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {preview ? (
        <div className="media-preview-backdrop" role="presentation" onClick={() => setPreview(null)}>
          <div
            aria-modal="true"
            className="media-preview-dialog"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="media-preview-header">
              <div>
                <h2 title={preview.name}>{preview.name}</h2>
                <p>
                  {preview.mime_type} · {formatSize(preview.size_bytes)} · {formatDate(preview.created_at)}
                </p>
              </div>
              <button aria-label="关闭预览" type="button" onClick={() => setPreview(null)}>
                <X size={16} />
              </button>
            </header>
            <div className="media-preview-body">
              {fileKind(preview.mime_type) === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={preview.name} src={preview.url} />
              ) : fileKind(preview.mime_type) === "video" ? (
                <video controls preload="metadata" src={preview.url} />
              ) : (
                <p className="text-sm text-[var(--muted)]">该类型暂不支持内嵌预览，请打开原文件查看。</p>
              )}
            </div>
            <footer className="media-preview-footer">
              <code>{absoluteUrl(preview.url)}</code>
              <div className="flex gap-2">
                <Button icon={<Copy size={14} />} variant="secondary" onClick={() => void copyLink(preview)}>
                  复制链接
                </Button>
                <ButtonLinkLike href={preview.url} />
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ButtonLinkLike({ href }: { href: string }) {
  return (
    <a className="media-preview-open" href={href} rel="noreferrer" target="_blank">
      <ExternalLink size={14} />
      新窗口打开
    </a>
  );
}
