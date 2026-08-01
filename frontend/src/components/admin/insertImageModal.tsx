"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import {
  ImageIcon,
  ImagePlus,
  Link2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { uploadStorageFile } from "@/lib/api/storage";

export type InsertImageResult = {
  src: string;
  alt: string;
};

type InsertImageModalProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (result: InsertImageResult) => void;
  title?: string;
  confirmLabel?: string;
};

type TabKey = "link" | "upload";

export function InsertImageModal({
  open,
  onClose,
  onInsert,
  title = "插入图片",
  confirmLabel = "插入图片",
}: InsertImageModalProps) {
  if (!open) return null;
  return (
    <InsertImageModalContent
      confirmLabel={confirmLabel}
      title={title}
      onClose={onClose}
      onInsert={onInsert}
    />
  );
}

function InsertImageModalContent({
  onClose,
  onInsert,
  title,
  confirmLabel,
}: {
  onClose: () => void;
  onInsert: (result: InsertImageResult) => void;
  title: string;
  confirmLabel: string;
}) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabKey>("link");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleInsert() {
    setError("");
    if (tab === "link") {
      const src = url.trim();
      if (!src) {
        setError("请填写图片地址");
        return;
      }
      onInsert({ src, alt: alt.trim() });
      onClose();
      return;
    }
    if (!selectedFile) {
      setError("请先选择要上传的图片");
      return;
    }
    setReading(true);
    try {
      const uploaded = await uploadStorageFile(selectedFile);
      onInsert({ src: uploaded.url, alt: alt.trim() || fileName });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片上传失败");
    } finally {
      setReading(false);
    }
  }

  async function readFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("仅支持图片文件");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("图片请控制在 20 MB 以内");
      return;
    }
    setReading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      setFileName(file.name);
      setSelectedFile(file);
    } catch {
      setError("读取图片失败，请重试");
    } finally {
      setReading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    void readFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="insert-image-backdrop" onMouseDown={onClose} role="presentation">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="insert-image-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="insert-image-header">
          <div className="insert-image-title">
            <span className="insert-image-title-icon" aria-hidden="true">
              <ImagePlus size={16} />
            </span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button aria-label="关闭" className="insert-image-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="insert-image-tabs" role="tablist">
          <button
            aria-selected={tab === "link"}
            className={`insert-image-tab${tab === "link" ? " is-active" : ""}`}
            onClick={() => setTab("link")}
            role="tab"
            type="button"
          >
            <Link2 size={15} />
            图片链接
          </button>
          <button
            aria-selected={tab === "upload"}
            className={`insert-image-tab${tab === "upload" ? " is-active" : ""}`}
            onClick={() => setTab("upload")}
            role="tab"
            type="button"
          >
            <Upload size={15} />
            上传图片
          </button>
        </div>

        <div className="insert-image-body">
          {tab === "link" ? (
            <>
              <label className="insert-image-field">
                <span>图片地址</span>
                <span className="insert-image-input-wrap">
                  <ImageIcon aria-hidden="true" size={16} />
                  <input
                    autoFocus
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com/image.png"
                    type="url"
                    value={url}
                  />
                </span>
              </label>
              <label className="insert-image-field">
                <span>替代文本（可选）</span>
                <input
                  onChange={(event) => setAlt(event.target.value)}
                  placeholder="图片描述，用于无障碍访问"
                  type="text"
                  value={alt}
                />
              </label>
            </>
          ) : (
            <>
              <div
                className={`insert-image-dropzone${dragOver ? " is-over" : ""}${preview ? " has-preview" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
              >
                {preview ? (
                  <div className="insert-image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={alt || fileName || "预览"} src={preview} />
                    <div className="insert-image-preview-meta">
                      <strong>{fileName || "已选择图片"}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setPreview("");
                          setFileName("");
                          setSelectedFile(null);
                          fileInputRef.current?.click();
                        }}
                      >
                        重新选择
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="insert-image-dropzone-btn"
                    disabled={reading}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    {reading ? <Loader2 className="insert-image-spin" size={22} /> : <Upload size={22} />}
                    <strong>{reading ? "正在读取…" : "点击或拖拽上传图片"}</strong>
                    <span>支持 PNG / JPG / WEBP / GIF，最大 20 MB</span>
                  </button>
                )}
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void readFile(event.target.files?.[0])}
                  ref={fileInputRef}
                  type="file"
                />
              </div>
              <label className="insert-image-field">
                <span>替代文本（可选）</span>
                <input
                  onChange={(event) => setAlt(event.target.value)}
                  placeholder="图片描述，用于无障碍访问"
                  type="text"
                  value={alt}
                />
              </label>
            </>
          )}
          {error && <p className="insert-image-error">{error}</p>}
        </div>

        <footer className="insert-image-footer">
          <button className="insert-image-btn insert-image-btn-ghost" onClick={onClose} type="button">
            取消
          </button>
          <button className="insert-image-btn insert-image-btn-primary" disabled={reading} onClick={() => void handleInsert()} type="button">
            {reading ? "上传中…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
