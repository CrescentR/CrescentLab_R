"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Boxes,
  CalendarClock,
  DatabaseZap,
  FileText,
  Flame,
  Gauge,
  HardDrive,
  Image,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { adminMetrics, articleSummaries, contentPipeline, labActivities } from "@/lib/mockData";
import { getAuthUser } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "新建文章", href: "/admin/postManagement", icon: FileText, tone: "cyan" },
  { label: "项目管理", href: "/admin/projects", icon: Flame, tone: "amber" },
  { label: "存储策略", href: "/admin/storage", icon: HardDrive, tone: "cyan" },
  { label: "媒体库", href: "/admin/media", icon: Image, tone: "amber" },
] as const;

const insightCards = [
  { title: "权限与审计", detail: "用户组、权限矩阵和操作记录集中在用户模块维护。", icon: ShieldCheck, tone: "rose" },
  { title: "任务与事件", detail: "定时发布、统计聚合和通知投递进入任务队列。", icon: DatabaseZap, tone: "amber" },
  { title: "插件与主题", detail: "插件状态、主题配置和搜索适配按模块独立管理。", icon: Boxes, tone: "cyan" },
] as const;

export function DashboardOverview() {
  const user = getAuthUser();
  const displayName = user?.nickname || user?.username || "管理员";

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Panel className="lab-card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <Badge tone="cyan">管理控制台</Badge>
                <h1 className="mt-4 font-lab-display text-3xl font-semibold leading-tight text-[var(--text-strong)] md:text-4xl">
                  晚上好，{displayName}。今天的 Lab 已准备好。
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  内容发布、存储状态、评论审核、用户权限、插件主题和任务队列从这里进入。设置模块已经接入后端接口，其他模块按同样边界推进。
                </p>
              </div>
              <ButtonLink href="/admin/postManagement/new" icon={<ArrowRight size={16} />} variant="primary">
                开始写作
              </ButtonLink>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    className="group rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-4 transition-colors hover:border-[var(--cyan)] hover:bg-[var(--surface-raised)]"
                    href={action.href}
                    key={action.label}
                  >
                    <Icon className="text-[var(--cyan)]" size={18} />
                    <span className="mt-3 block text-sm font-medium text-[var(--text-strong)]">{action.label}</span>
                    <span className="mt-1 block font-lab-mono text-[11px] text-[var(--muted-low)]">{action.href}</span>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <Panel className="lab-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">系统状态</span>
                <h2 className="mt-2 font-lab-display text-xl font-semibold text-[var(--text-strong)]">控制台健康度</h2>
              </div>
              <Gauge className="text-[var(--amber)]" size={24} />
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: "存储同步", value: "96%", tone: "cyan" },
                { label: "搜索新鲜度", value: "88%", tone: "green" },
                { label: "通知队列", value: "72%", tone: "amber" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between font-lab-mono text-xs text-[var(--muted)]">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--surface-field)]">
                    <div className={cn("h-full rounded-full", item.tone === "cyan" && "bg-[var(--cyan)]", item.tone === "green" && "bg-[var(--success)]", item.tone === "amber" && "bg-[var(--amber)]")} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminMetrics.map((metric) => (
            <Panel className="lab-card p-5" key={metric.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-lab-mono text-xs text-[var(--muted)]">{metric.label}</span>
                <Badge tone={metric.tone}>{metric.trend}</Badge>
              </div>
              <strong className="mt-5 block font-lab-display text-4xl font-semibold text-[var(--text-strong)]">{metric.value}</strong>
            </Panel>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="text-[var(--purple)]" size={18} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">发布管线</h2>
              </div>
              <Badge tone="purple">工作流</Badge>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {contentPipeline.map((item) => (
                <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-4" key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-strong)]">{item.label}</span>
                    <Badge tone={item.tone}>{item.value}</Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-[var(--surface)]">
                    <div className={cn("h-full rounded-full", item.tone === "cyan" && "bg-[var(--cyan)]", item.tone === "purple" && "bg-[var(--purple)]", item.tone === "amber" && "bg-[var(--amber)]", item.tone === "green" && "bg-[var(--success)]")} style={{ width: `${Math.min(item.value, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[var(--cyan)]" size={18} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">最近内容</h2>
              </div>
              <Link className="font-lab-mono text-xs text-[var(--cyan)]" href="/admin/postManagement/new">
                New Draft
              </Link>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {articleSummaries.map((article) => (
                <div className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_120px]" key={article.id}>
                  <div>
                    <h3 className="font-lab-display font-semibold text-[var(--text-strong)]">{article.title}</h3>
                    <p className="mt-1 font-lab-mono text-xs text-[var(--muted-low)]">
                      {article.category} / updated {article.updatedAt}
                    </p>
                  </div>
                  <div className="flex items-center justify-start md:justify-end">
                    <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "purple"}>
                      {article.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
          {insightCards.map((card) => {
            const Icon = card.icon;
            return (
              <Panel className="lab-card p-5" key={card.title}>
                <div className="flex items-center justify-between">
                  <Icon className="text-[var(--cyan)]" size={20} />
                  <Badge tone={card.tone}>{card.tone}</Badge>
                </div>
                <h2 className="mt-5 font-lab-display text-lg font-semibold text-[var(--text-strong)]">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.detail}</p>
              </Panel>
            );
          })}
        </section>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className="text-[var(--rose)]" size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">活动流</h2>
            </div>
            <Badge tone="rose">操作日志</Badge>
          </div>
          <div className="grid gap-0 divide-y divide-[var(--border-soft)] md:grid-cols-2 md:divide-x md:divide-y-0">
            {labActivities.slice(0, 4).map((activity) => (
              <div className="p-5" key={activity.id}>
                <span className="font-lab-mono text-xs text-[var(--muted-low)]">{activity.time}</span>
                <h3 className="mt-2 text-sm font-medium text-[var(--text-strong)]">{activity.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{activity.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
