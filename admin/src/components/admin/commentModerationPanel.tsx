"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MessageSquare, RefreshCw, X } from "lucide-react";
import { listPendingComments, reviewComment, type CommentItem } from "@/lib/api/comments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function commentPlainText(html: string): string {
  return html.replaceAll("<br>", "\n").replace(/<[^>]+>/g, "").trim();
}

export function CommentModerationPanel() {
  const { push } = useToast();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadComments(mode: "initial" | "refresh" = "initial") {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const result = await listPendingComments();
      setItems(result.items);
    } catch (err) {
      const message =
        typeof err === "object" && err && "message" in err ? String(err.message) : "评论加载失败";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadComments("initial");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function review(id: number, status: "approved" | "rejected") {
    setBusyId(id);
    setError("");
    try {
      await reviewComment(id, status);
      setItems((current) => current.filter((item) => item.id !== id));
      push(status === "approved" ? "评论已通过" : "评论已拒绝", "success");
    } catch (err) {
      const message =
        typeof err === "object" && err && "message" in err ? String(err.message) : "审核失败";
      setError(message);
      push(message, "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <Panel className="lab-card p-6">
            <Badge tone="amber">内容治理</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">
              评论审核
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              审核访客留言后再对外展示。通过后会出现在对应文章详情，拒绝后不会公开。
            </p>
            <Button
              className="mt-4"
              disabled={loading || refreshing}
              icon={refreshing ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
              variant="secondary"
              onClick={() => void loadComments("refresh")}
            >
              刷新队列
            </Button>
          </Panel>

          <Panel className="lab-card flex flex-col justify-between p-5">
            <div>
              <span className="text-xs text-[var(--muted-low)]">待审核</span>
              <strong className="mt-2 block text-4xl font-semibold tracking-tight text-[var(--text-strong)]">
                {loading ? "—" : items.length}
              </strong>
            </div>
            <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
              {loading ? "正在读取队列…" : items.length === 0 ? "队列已清空" : "按到达顺序处理即可"}
            </p>
          </Panel>
        </header>

        {error ? (
          <Panel className="border-[rgba(179,82,74,0.28)] bg-[rgba(179,82,74,0.06)] p-4">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </Panel>
        ) : null}

        <Panel className="lab-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2 text-[var(--text-strong)]">
              <MessageSquare size={16} />
              <h2 className="font-lab-display text-lg font-semibold">审核队列</h2>
            </div>
            <span className="text-xs text-[var(--muted)]">
              {loading ? "加载中…" : `${items.length} 条`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-[var(--muted)]">
              <Loader2 className="animate-spin" size={16} />
              正在读取待审核评论…
            </div>
          ) : items.length === 0 ? (
            <div className="comment-admin-empty">
              <span className="comment-admin-empty-icon" aria-hidden="true">
                <MessageSquare size={22} strokeWidth={1.75} />
              </span>
              <h3>暂无待审核评论</h3>
              <p>新评论到达后会出现在这里，可直接通过或拒绝。</p>
            </div>
          ) : (
            <ul className="comment-admin-list">
              {items.map((item) => {
                const busy = busyId === item.id;
                return (
                  <li className="comment-admin-item" key={item.id}>
                    <div className="comment-admin-item-main">
                      <div className="comment-admin-item-head">
                        <strong>{item.nickname}</strong>
                        <Badge tone="amber">待审核</Badge>
                        <span className="comment-admin-item-meta">文章 #{item.article_id}</span>
                        <span className="comment-admin-item-meta">{formatDate(item.created_at)}</span>
                      </div>
                      <p className="comment-admin-item-body">{commentPlainText(item.content_html)}</p>
                    </div>
                    <div className="comment-admin-item-actions">
                      <button
                        className="comment-admin-action comment-admin-action-reject"
                        disabled={busy}
                        type="button"
                        onClick={() => void review(item.id, "rejected")}
                      >
                        {busy ? <Loader2 className="animate-spin" size={14} /> : <X size={14} strokeWidth={2} />}
                        拒绝
                      </button>
                      <button
                        className="comment-admin-action comment-admin-action-approve"
                        disabled={busy}
                        type="button"
                        onClick={() => void review(item.id, "approved")}
                      >
                        {busy ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} strokeWidth={2} />}
                        通过
                      </button>
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
