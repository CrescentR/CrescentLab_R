"use client";

import { useEffect, useId, useState } from "react";
import { FolderOpen, Loader2, RefreshCw, X } from "lucide-react";
import { listStorageFiles, type UploadedStorageFile } from "@/lib/api/storage";

type MediaPickerModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (file: UploadedStorageFile) => void;
};

export function MediaPickerModal({
  open,
  title = "从媒体库选择",
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  if (!open) return null;
  return <MediaPickerModalContent title={title} onClose={onClose} onSelect={onSelect} />;
}

function MediaPickerModalContent({
  title,
  onClose,
  onSelect,
}: {
  title: string;
  onClose: () => void;
  onSelect: (file: UploadedStorageFile) => void;
}) {
  const titleId = useId();
  const [files, setFiles] = useState<UploadedStorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const result = await listStorageFiles({ mime_prefix: "image/", limit: 60 });
      setFiles(result.files);
      setSelectedId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载媒体库失败");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFiles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const selected = files.find((file) => file.id === selectedId) ?? null;

  return (
    <div className="media-picker-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="media-picker-dialog"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="media-picker-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>选择已上传到存储的图片，用于站点品牌资源。</p>
          </div>
          <div className="media-picker-header-actions">
            <button className="media-picker-icon-btn" disabled={loading} type="button" onClick={() => void loadFiles()}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              刷新
            </button>
            <button aria-label="关闭" className="media-picker-icon-btn" type="button" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="media-picker-body">
          {loading ? (
            <div className="media-picker-empty">
              <Loader2 className="animate-spin" size={18} />
              正在读取媒体库…
            </div>
          ) : error ? (
            <div className="media-picker-empty is-error">{error}</div>
          ) : files.length === 0 ? (
            <div className="media-picker-empty">
              <FolderOpen size={22} strokeWidth={1.75} />
              <strong>媒体库暂无图片</strong>
              <span>可先在本页上传，或到文章编辑器上传后再回来选择。</span>
            </div>
          ) : (
            <ul className="media-picker-grid">
              {files.map((file) => {
                const active = file.id === selectedId;
                return (
                  <li key={file.id}>
                    <button
                      className={`media-picker-card${active ? " is-active" : ""}`}
                      type="button"
                      onClick={() => setSelectedId(file.id)}
                      onDoubleClick={() => {
                        onSelect(file);
                        onClose();
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={file.name} src={file.url} />
                      <span title={file.name}>{file.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="media-picker-footer">
          <span className="media-picker-footer-meta">
            {loading ? "加载中" : `${files.length} 张图片`}
            {selected ? ` · 已选 ${selected.name}` : ""}
          </span>
          <div className="media-picker-footer-actions">
            <button className="media-picker-secondary" type="button" onClick={onClose}>
              取消
            </button>
            <button
              className="media-picker-primary"
              disabled={!selected}
              type="button"
              onClick={() => {
                if (!selected) return;
                onSelect(selected);
                onClose();
              }}
            >
              使用所选图片
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
