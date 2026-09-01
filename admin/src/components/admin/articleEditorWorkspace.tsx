"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { CoverImageField } from "@/components/admin/coverImageField";
import { TipTapEditor } from "@/components/admin/tiptapEditor";
import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticle,
  updateAdminArticle,
  publishAdminArticle,
  previewArticle,
  type ArticleInput,
} from "@/lib/api/articles";
import { highlightCodeBlocks } from "@/lib/codeHighlight";

type ArticleFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  cover_url: string;
};

type SaveStatus = "idle" | "saving" | "saved";

const ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";

const NEW_ARTICLE_TEMPLATE: ArticleFormState = {
  title: "",
  slug: generateRandomSlug(),
  excerpt: "",
  content_html: "<p></p>",
  cover_url: "",
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}

function generateRandomSlug(): string {
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return result;
}

type ArticleEditorWorkspaceProps = {
  initialArticleId?: number | null;
  onBack?: () => void;
};

export function ArticleEditorWorkspace({
  initialArticleId = null,
  onBack,
}: ArticleEditorWorkspaceProps) {
  const { push } = useToast();
  const [form, setForm] = useState<ArticleFormState>(NEW_ARTICLE_TEMPLATE);
  const [articleId, setArticleId] = useState<number | null>(initialArticleId);
  const [status, setStatus] = useState<"draft" | "published" | "archived" | "scheduled">("draft");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(initialArticleId));
  const [isDeleting, setIsDeleting] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialArticleId) return;
    if (loadedIdRef.current === initialArticleId) return;
    let active = true;
    void (async () => {
      setIsLoading(true);
      try {
        const detail = await getAdminArticle(initialArticleId);
        if (!active) return;
        loadedIdRef.current = detail.id;
        setArticleId(detail.id);
        setStatus(detail.status);
        setForm({
          title: detail.title,
          slug: detail.slug,
          excerpt: detail.excerpt || "",
          content_html: detail.content_html || "<p></p>",
          cover_url: detail.cover_url || "",
        });
      } catch (err) {
        if (!active) return;
        push(extractErrorMessage(err, "加载文章失败"), "error");
        onBack?.();
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialArticleId, onBack, push]);

  const updateField = useCallback(<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildApiInput = useCallback((): ArticleInput => {
    return {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content_html: form.content_html,
      cover_url: form.cover_url,
      source_format: "tiptap",
      status,
    };
  }, [form, status]);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      push("标题为必填项", "error");
      return;
    }

    setSaveStatus("saving");
    try {
      if (articleId) {
        const result = await updateAdminArticle(articleId, buildApiInput());
        setStatus(result.status);
        push("草稿已保存", "success");
      } else {
        const result = await createAdminArticle(buildApiInput());
        setArticleId(result.id);
        setStatus(result.status);
        push("文章已创建", "success");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      push(extractErrorMessage(err, "保存失败"), "error");
      setSaveStatus("idle");
    }
  }, [articleId, buildApiInput, form.title, push]);

  const handlePublish = useCallback(async () => {
    if (!form.title.trim()) {
      push("标题为必填项", "error");
      return;
    }

    setIsPublishing(true);
    try {
      let targetId = articleId;
      if (!targetId) {
        const created = await createAdminArticle(buildApiInput());
        targetId = created.id;
        setArticleId(created.id);
      }
      const result = await publishAdminArticle(targetId, {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content_html: form.content_html,
        cover_url: form.cover_url,
        source_format: "tiptap",
      });
      setStatus(result.status);
      push("文章已发布", "success");
    } catch (err) {
      push(extractErrorMessage(err, "发布失败"), "error");
    } finally {
      setIsPublishing(false);
    }
  }, [articleId, buildApiInput, form, push]);

  const handleDelete = useCallback(async () => {
    if (!articleId) return;
    if (!confirm("确定要删除这篇文章吗？删除后可在回收逻辑完善前视为不可恢复。")) return;
    setIsDeleting(true);
    try {
      await deleteAdminArticle(articleId);
      push("文章已删除", "success");
      onBack?.();
    } catch (err) {
      push(extractErrorMessage(err, "删除失败"), "error");
    } finally {
      setIsDeleting(false);
    }
  }, [articleId, onBack, push]);

  const handlePreview = useCallback(async () => {
    setIsPreviewing(true);
    try {
      const result = await previewArticle(form.content_html);
      const previewWindow = window.open("", "_blank");
      if (previewWindow) {
        previewWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${form.title || "文章预览"} — Crescent Index</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 24px;
      color: #1a1a1a;
      line-height: 1.8;
      background: #fff;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.8em; margin-bottom: 0.6em; line-height: 1.3; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    p { margin: 1em 0; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: transparent; color: inherit; padding: 0; }
    .article-codeblock { overflow: hidden; margin: 1.5em 0; border: 1px solid #d8ddd9; border-radius: 12px; background: #1e293b; }
    .article-codeblock-header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; min-height: 44px; border-bottom: 1px solid #d8ddd9; background: #f1f2ed; padding: 7px 11px; }
    .article-codeblock-dots { display: inline-flex; gap: 5px; }
    .article-codeblock-dot { display: block; width: 9px; height: 9px; border-radius: 50%; background: #ff5f57; }
    .article-codeblock-dot:nth-child(2) { background: #febc2e; }
    .article-codeblock-dot:nth-child(3) { background: #28c840; }
    .article-codeblock-language { color: #526159; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .article-codeblock-copy { border: 1px solid #d8ddd9; border-radius: 7px; background: #fff; color: #526159; cursor: pointer; padding: 5px 9px; }
    .article-codeblock pre { margin: 0; border-radius: 0; }
    .hljs-comment, .hljs-quote { color: #94a3b8; font-style: italic; }
    .hljs-keyword, .hljs-selector-tag, .hljs-doctag { color: #d8b4fe; font-weight: 600; }
    .hljs-string, .hljs-regexp, .hljs-addition { color: #86efac; }
    .hljs-number, .hljs-literal, .hljs-symbol { color: #fdba74; }
    .hljs-title, .hljs-title.class_, .hljs-title.function_, .hljs-section { color: #7dd3fc; font-weight: 600; }
    .hljs-built_in, .hljs-type, .hljs-variable.language_ { color: #67e8f9; }
    .hljs-attr, .hljs-property, .hljs-selector-class, .hljs-selector-id { color: #fcd34d; }
    .hljs-tag, .hljs-name, .hljs-meta { color: #fda4af; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding: 0.5em 1em; background: #f0f7ff; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    a { color: #3b82f6; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; }
    .preview-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #3b82f6;
      color: white;
      text-align: center;
      padding: 8px;
      font-size: 14px;
      z-index: 100;
    }
    .preview-banner + body { padding-top: 80px; }
  </style>
</head>
<body>
  <div class="preview-banner">预览模式 - ${form.title || "无标题"}</div>
  <article>
    <h1>${form.title || "无标题"}</h1>
    ${result.content_html}
  </article>
</body>
</html>`);
        previewWindow.document.close();
        highlightCodeBlocks(previewWindow.document);
      }
      push(`预览已生成（${result.word_count} 字，约 ${result.reading_time_minutes} 分钟阅读）`, "info");
    } catch (err) {
      push(extractErrorMessage(err, "预览失败"), "error");
    } finally {
      setIsPreviewing(false);
    }
  }, [form.content_html, form.title, push]);

  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    if (articleId && form.title) {
      autoSaveTimer.current = setTimeout(() => {
        handleSave();
      }, 30000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, articleId, handleSave]);

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-[var(--background-soft)] text-[var(--muted)]">
        <Loader2 className="animate-spin" size={22} />
        <span className="ml-3 font-lab-mono text-sm">正在加载文章…</span>
      </main>
    );
  }

  return (
    <main className="article-editor flex min-h-[calc(100dvh-4rem)] flex-col bg-[var(--background-soft)] lg:h-[calc(100dvh-4rem)] lg:min-h-[700px] lg:overflow-hidden">
      <header className="article-editor-header flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <Button className="hidden md:inline-flex" icon={<ArrowLeft size={15} />} variant="ghost" onClick={onBack}>
              返回列表
            </Button>
          ) : (
            <ButtonLink className="hidden md:inline-flex" href="/admin/postManagement" icon={<ArrowLeft size={15} />} variant="ghost">
              返回列表
            </ButtonLink>
          )}
          <span className="hidden h-6 w-px bg-[var(--border-soft)] md:block" />
          <div className="min-w-0">
            <span className="block text-xs font-medium text-[var(--muted)]">{statusLabel(status)}</span>
            <strong className="block truncate text-sm text-[var(--text-strong)]">
              {form.title || "未命名文章"}
            </strong>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs text-[var(--muted)] md:flex">
          {saveStatus === "saving" ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              保存中…
            </>
          ) : saveStatus === "saved" ? (
            <>
              <CheckCircle2 size={12} className="text-[var(--success)]" />
              已保存
            </>
          ) : (
            <>
              <Clock size={12} />
              {articleId ? "等待自动保存" : "尚未保存"}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {articleId && (
            <Button
              className="hidden sm:inline-flex"
              disabled={isDeleting}
              icon={isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              variant="secondary"
              onClick={handleDelete}
            >
              删除
            </Button>
          )}
          <Button
            className="hidden sm:inline-flex"
            disabled={isPreviewing}
            icon={isPreviewing ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
            variant="secondary"
            onClick={handlePreview}
          >
            预览
          </Button>
          <Button
            disabled={saveStatus === "saving"}
            icon={saveStatus === "saving" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            variant="secondary"
            onClick={handleSave}
          >
            保存草稿
          </Button>
          <Button
            disabled={isPublishing}
            icon={isPublishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            variant="primary"
            onClick={handlePublish}
          >
            发布
          </Button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 bg-[var(--background-soft)] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="article-editor-aside hidden overflow-y-auto lg:block">
          <div className="article-meta-head">
            <h2>元数据</h2>
            <p>完善标题、封面与摘要，帮助读者更快理解这篇笔记。</p>
          </div>
          <div className="article-meta-stack">
            <Field
              className="article-meta-field"
              inputClassName="article-meta-input"
              label="标题"
              placeholder="给文章起一个清晰的标题"
              value={form.title}
              onChange={(v) => updateField("title", v)}
            />
            <div className="article-meta-field">
              <span className="article-meta-label-row">
                <span>链接别名</span>
                <button
                  className="article-meta-link-btn"
                  onClick={() => updateField("slug", generateRandomSlug())}
                  type="button"
                >
                  重新生成
                </button>
              </span>
              <span className="article-meta-slug">{form.slug}</span>
            </div>
            <CoverImageField value={form.cover_url} onChange={(v) => updateField("cover_url", v)} />
            <Field
              className="article-meta-field"
              inputClassName="article-meta-input article-meta-textarea"
              label="摘要"
              meta={<span className="article-meta-counter">{form.excerpt.length}/500</span>}
              multiline
              placeholder="一两句话概括文章要点，用于列表与分享预览"
              value={form.excerpt}
              onChange={(v) => updateField("excerpt", v.slice(0, 500))}
            />
            <div className="article-meta-field">
              <span className="article-meta-label-row">
                <span>状态</span>
              </span>
              <div className="article-meta-status">
                <Badge tone={status === "draft" ? "amber" : status === "published" ? "green" : "neutral"}>
                  {statusLabel(status)}
                </Badge>
                {form.excerpt && <Badge tone="cyan">{form.excerpt.length} 字</Badge>}
              </div>
            </div>
          </div>
        </aside>

        <div className="article-editor-main min-h-0 overflow-hidden p-3 md:p-5">
          <TipTapEditor
            content={form.content_html}
            onChange={(html) => updateField("content_html", html)}
            onSave={handleSave}
          />
        </div>
      </section>
    </main>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "published":
      return "已发布";
    case "archived":
      return "已归档";
    case "scheduled":
      return "定时发布";
    default:
      return "草稿";
  }
}
