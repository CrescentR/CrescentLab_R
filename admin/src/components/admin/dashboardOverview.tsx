"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  Flame,
  HardDrive,
  Image,
  MessageSquare,
  PenLine,
  Settings,
  Users,
} from "lucide-react";
import { listAdminArticles, type ArticleListItem } from "@/lib/api/articles";
import { listPendingComments } from "@/lib/api/comments";
import { getAuthUser } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

const quickActions = [
  { label: "文章", href: "/admin/postManagement", icon: FileText },
  { label: "项目", href: "/admin/projects", icon: Flame },
  { label: "观测台", href: "/admin/observatory", icon: Eye },
  { label: "评论", href: "/admin/comments", icon: MessageSquare },
  { label: "媒体", href: "/admin/media", icon: Image },
  { label: "存储", href: "/admin/storage", icon: HardDrive },
  { label: "用户", href: "/admin/users", icon: Users },
  { label: "设置", href: "/admin/settings", icon: Settings },
] as const;

function greetingLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: ArticleListItem["status"]): string {
  if (status === "published") return "已发布";
  if (status === "draft") return "草稿";
  if (status === "scheduled") return "定时";
  return "归档";
}

function statusTone(status: ArticleListItem["status"]): "green" | "amber" | "cyan" | "neutral" {
  if (status === "published") return "green";
  if (status === "draft") return "amber";
  if (status === "scheduled") return "cyan";
  return "neutral";
}

export function DashboardOverview() {
  const user = getAuthUser();
  const displayName = user?.nickname || user?.username || "管理员";
  const [articleTotal, setArticleTotal] = useState<number | null>(null);
  const [publishedTotal, setPublishedTotal] = useState<number | null>(null);
  const [pendingComments, setPendingComments] = useState<number | null>(null);
  const [recentArticles, setRecentArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [articles, published, comments] = await Promise.all([
          listAdminArticles({ page_size: 5 }),
          listAdminArticles({ page_size: 1, status: "published" }),
          listPendingComments(),
        ]);
        if (!active) return;
        setArticleTotal(articles.total);
        setPublishedTotal(published.total);
        setPendingComments(comments.items.length);
        setRecentArticles(articles.items);
      } catch {
        if (!active) return;
        setArticleTotal(0);
        setPublishedTotal(0);
        setPendingComments(0);
        setRecentArticles([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <Panel className="lab-card p-6 md:p-7">
            <Badge tone="cyan">管理控制台</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold leading-tight text-[var(--text-strong)]">
              {greetingLabel()}，{displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              从这里进入内容、项目、评论和系统配置。只保留当前真正用得到的入口。
            </p>
            <ButtonLink className="mt-5" href="/admin/postManagement" icon={<PenLine size={15} />} variant="primary">
              开始写作
            </ButtonLink>
          </Panel>

          <Panel className="lab-card grid min-w-[240px] grid-cols-3 gap-4 p-5 sm:min-w-[320px]">
            <div>
              <span className="block text-xs text-[var(--muted-low)]">文章</span>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-strong)]">
                {loading ? "—" : articleTotal}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted-low)]">已发布</span>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-strong)]">
                {loading ? "—" : publishedTotal}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted-low)]">待审评论</span>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-strong)]">
                {loading ? "—" : pendingComments}
              </strong>
            </div>
          </Panel>
        </header>

        <Panel className="lab-card overflow-hidden p-0">
          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">常用入口</h2>
          </div>
          <div className="grid gap-px bg-[var(--border-soft)] sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  className="flex items-center gap-3 bg-[var(--surface)] px-5 py-4 transition-colors hover:bg-[var(--surface-field)]"
                  href={action.href}
                  key={action.href}
                >
                  <span className="grid size-9 place-items-center rounded-[8px] border border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted)]">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="text-sm font-medium text-[var(--text-strong)]">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel className="lab-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">最近文章</h2>
            <Link className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--teal)]" href="/admin/postManagement">
              查看全部
            </Link>
          </div>

          {loading ? (
            <div className="px-5 py-14 text-center text-sm text-[var(--muted)]">正在读取最近内容…</div>
          ) : recentArticles.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-[var(--muted)]">还没有文章</p>
              <ButtonLink className="mt-4" href="/admin/postManagement" icon={<PenLine size={15} />} variant="secondary">
                去写第一篇
              </ButtonLink>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-soft)]">
              {recentArticles.map((article) => (
                <li key={article.id}>
                  <Link
                    className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[var(--surface-field)] sm:flex-row sm:items-center sm:justify-between"
                    href="/admin/postManagement"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-[var(--text-strong)]">
                        {article.title || "未命名文章"}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--muted-low)]">
                        更新 {formatDate(article.updated_at)}
                        {article.published_at ? ` · 发布 ${formatDate(article.published_at)}` : ""}
                      </p>
                    </div>
                    <Badge tone={statusTone(article.status)}>{statusLabel(article.status)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </main>
  );
}
