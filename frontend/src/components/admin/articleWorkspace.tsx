"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  FileText,
  PenLine,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ArticleEditorWorkspace } from "@/components/admin/articleEditorWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import {
  deleteAdminArticle,
  listAdminArticles,
  type ArticleListItem,
  type ArticleStatus,
} from "@/lib/api/articles";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusTone(status: ArticleStatus): "amber" | "green" | "neutral" | "cyan" {
  if (status === "published") return "green";
  if (status === "draft") return "amber";
  if (status === "scheduled") return "cyan";
  return "neutral";
}

function statusLabel(status: ArticleStatus): string {
  if (status === "published") return "已发布";
  if (status === "draft") return "草稿";
  if (status === "scheduled") return "定时";
  return "归档";
}

export function ArticleWorkspace() {
  const { push } = useToast();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminArticles({
        page_size: 50,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setArticles(result.items);
    } catch (err) {
      push(extractErrorMessage(err, "加载文章列表失败"), "error");
    } finally {
      setLoading(false);
    }
  }, [push, searchQuery, statusFilter]);

  useEffect(() => {
    if (activeView !== "list") return;
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const result = await listAdminArticles({
          page_size: 50,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        });
        if (active) setArticles(result.items);
      } catch (err) {
        if (active) push(extractErrorMessage(err, "加载文章列表失败"), "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeView, push, searchQuery, statusFilter]);

  function handleNew() {
    setEditingId(null);
    setActiveView("editor");
  }

  function handleEdit(article: ArticleListItem) {
    setEditingId(article.id);
    setActiveView("editor");
  }

  async function handleDelete(article: ArticleListItem) {
    if (!confirm(`确定删除「${article.title || "未命名文章"}」吗？`)) return;
    try {
      await deleteAdminArticle(article.id);
      push("文章已删除", "success");
      await fetchArticles();
    } catch (err) {
      push(extractErrorMessage(err, "删除失败"), "error");
    }
  }

  if (activeView === "editor") {
    return (
      <ArticleEditorWorkspace
        initialArticleId={editingId}
        key={editingId ?? "new"}
        onBack={() => {
          setActiveView("list");
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Panel className="lab-card p-6">
            <Badge tone="purple">内容</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">
              文章管理
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              管理笔记草稿与已发布内容。可从列表进入编辑、保存草稿、发布或删除。
            </p>
            <Button className="mt-4" icon={<Plus size={15} />} variant="primary" onClick={handleNew}>
              新建文章
            </Button>
          </Panel>

          <Panel className="lab-card p-5">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">筛选</h2>
            <div className="mt-4 flex items-center gap-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                className="field-surface h-10 flex-1 rounded-[var(--radius)] px-4 text-sm text-[var(--text)] outline-none"
                placeholder="搜索标题…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["", "draft", "published", "archived"] as const).map((value) => (
                <button
                  className={`rounded-full border px-3 py-1.5 font-lab-mono text-xs transition-colors ${
                    statusFilter === value
                      ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                      : "border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted)]"
                  }`}
                  key={value || "all"}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                >
                  {value === "" ? "全部" : statusLabel(value)}
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-3">
                <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">合计</span>
                <strong className="mt-1 block text-2xl text-[var(--text-strong)]">{articles.length}</strong>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-3">
                <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">已发布</span>
                <strong className="mt-1 block text-2xl text-[var(--text-strong)]">
                  {articles.filter((item) => item.status === "published").length}
                </strong>
              </div>
            </div>
          </Panel>
        </header>

        <Panel className="lab-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2 text-[var(--text-strong)]">
              <FileText size={16} />
              <h2 className="font-lab-display text-lg font-semibold">文章列表</h2>
            </div>
            <span className="font-lab-mono text-xs text-[var(--muted)]">
              {loading ? "加载中…" : `${articles.length} 条`}
            </span>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center font-lab-mono text-sm text-[var(--muted)]">正在读取文章…</div>
          ) : articles.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="font-lab-mono text-sm text-[var(--muted)]">还没有文章，先写一篇吧。</p>
              <Button className="mt-4" icon={<PenLine size={15} />} variant="secondary" onClick={handleNew}>
                开始写作
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-soft)]">
              {articles.map((article) => (
                <li key={article.id}>
                  <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-field)] md:flex-row md:items-center md:justify-between">
                    <button
                      className="min-w-0 flex-1 text-left"
                      type="button"
                      onClick={() => handleEdit(article)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone(article.status)}>{statusLabel(article.status)}</Badge>
                        {article.is_pinned && (
                          <Badge tone="cyan">
                            <Pin className="mr-1 inline" size={11} />
                            置顶
                          </Badge>
                        )}
                        <span className="font-lab-mono text-xs text-[var(--muted-low)]">/{article.slug}</span>
                      </div>
                      <h3 className="mt-2 truncate font-lab-display text-xl font-semibold text-[var(--text-strong)]">
                        {article.title || "未命名文章"}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
                        {article.excerpt || "暂无摘要"}
                      </p>
                      <p className="mt-2 font-lab-mono text-xs text-[var(--muted-low)]">
                        更新 {formatDate(article.updated_at)}
                        {article.published_at ? ` · 发布 ${formatDate(article.published_at)}` : ""}
                        {` · ${article.reading_time_minutes || 1} 分钟 · ${article.view_count} 次阅读`}
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        icon={<Trash2 size={14} />}
                        variant="secondary"
                        onClick={() => handleDelete(article)}
                      >
                        删除
                      </Button>
                      <Button
                        icon={<ChevronRight size={14} />}
                        variant="primary"
                        onClick={() => handleEdit(article)}
                      >
                        编辑
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </main>
  );
}
