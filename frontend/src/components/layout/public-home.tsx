"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Boxes,
  ChevronDown,
  Compass,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Lock,
  Moon,
  PenLine,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import {
  adminLabModules,
  articleSummaries,
  labActivities,
  memberLabModules,
  sharedLabModules,
} from "@/lib/mock-data";
import { personas } from "@/lib/personas";
import { PersonaRole, useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { backgroundImageStyle, imageUrlStyle, siteBranding } from "@/lib/site-settings";
import type { LabModule } from "@/types/content";

const roleOrder: PersonaRole[] = ["member", "admin"];

const signalCards = [
  { label: "Public Nodes", value: "42", detail: "articles, pages, albums", tone: "cyan" },
  { label: "Lab Signals", value: "17", detail: "comments, likes, follows", tone: "green" },
  { label: "Ops Queue", value: "06", detail: "jobs waiting for admin", tone: "amber" },
] as const;

export function PublicHome() {
  const rootRef = useRef<HTMLElement>(null);
  const activePersona = useUiStore((state) => state.activePersona);
  const setLoginPanelOpen = useUiStore((state) => state.setLoginPanelOpen);
  const persona = personas[activePersona];
  const roleModules = useMemo(() => {
    if (activePersona === "admin") {
      return [...sharedLabModules, ...adminLabModules];
    }

    if (activePersona === "member") {
      return [...sharedLabModules, ...memberLabModules];
    }

    return sharedLabModules;
  }, [activePersona]);

  useEffect(() => {
    if (!rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from("[data-lab-animate]", {
        autoAlpha: 0,
        duration: 0.72,
        ease: "power3.out",
        stagger: 0.055,
        y: 24,
      });
      gsap.to("[data-lab-float]", {
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        y: -8,
        yoyo: true,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [activePersona]);

  return (
    <main ref={rootRef} className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-5 md:px-8">
      <header
        className="sticky top-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-glass)] px-3 py-3 backdrop-blur-xl md:px-4"
        data-lab-animate
      >
        <Link className="flex items-center gap-3" href="/">
          <span
            aria-label="CrescentLab logo"
            className="block size-10 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[length:20px_20px] bg-center bg-no-repeat"
            role="img"
            style={backgroundImageStyle(siteBranding.siteLogoUrl)}
          />
          <span>
            <span className="block font-lab-display text-xl font-bold text-[var(--text-strong)]">CrescentLab</span>
            <span className="block font-lab-mono text-xs text-[var(--muted)]">Content lab / CMS prototype</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-1 lg:flex">
          {["Signals", "Modules", "Articles", "Studio"].map((item) => (
            <a className="rounded px-3 py-2 font-lab-mono text-xs text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]" href={`#${item.toLowerCase()}`} key={item}>
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AccountSwitcher />
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_420px]" id="signals">
        <div className="flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[var(--radius)] border border-[var(--border-soft)] p-5 md:p-8" data-lab-animate>
          <div className="max-w-3xl">
            <Badge tone="cyan">Prototype mode</Badge>
            <h1 className="mt-5 max-w-4xl font-lab-display text-4xl font-semibold leading-[1.05] text-[var(--text-strong)] md:text-6xl">
              一个内容、权限、插件与创作流汇聚的个人实验室。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
              CrescentLab 不只是博客列表。它把公开阅读、用户互动、后台运营、主题插件、媒体存储和通知订阅组织成同一个可演进的 Lab 原型。
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {signalCards.map((item) => (
              <Panel className="lab-card p-4" data-lab-animate key={item.label}>
                <span className="font-lab-mono text-xs text-[var(--muted)]">{item.label}</span>
                <strong className="mt-3 block font-lab-display text-4xl font-semibold text-[var(--text-strong)]">{item.value}</strong>
                <Badge className="mt-3" tone={item.tone}>
                  {item.detail}
                </Badge>
              </Panel>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <Panel className="lab-card overflow-hidden" data-lab-animate>
            <div className="lab-media min-h-52 border-b border-[var(--border-soft)]" style={imageUrlStyle(siteBranding.heroImageUrl)} />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge tone={persona.canEnterAdmin ? "purple" : activePersona === "member" ? "green" : "neutral"}>{persona.label}</Badge>
                  <h2 className="mt-3 font-lab-display text-2xl font-semibold text-[var(--text-strong)]">{persona.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{persona.description}</p>
                </div>
                <span
                  aria-label={`${persona.name} avatar`}
                  className="block size-12 shrink-0 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] bg-cover bg-center"
                  role="img"
                  style={backgroundImageStyle(siteBranding.defaultAvatarUrl)}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {persona.canEnterAdmin ? (
                  <ButtonLink href="/admin" icon={<LayoutDashboard size={15} />} variant="primary">
                    进入后台
                  </ButtonLink>
                ) : (
                  <Button disabled icon={<Lock size={15} />} variant="secondary">
                    后台需管理员
                  </Button>
                )}
                <Button icon={<UserRound size={15} />} onClick={() => setLoginPanelOpen(true)} variant="ghost">
                  切换身份
                </Button>
              </div>
            </div>
          </Panel>

          <Panel className="lab-card p-5" data-lab-animate data-lab-float>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-lab-mono text-xs uppercase text-[var(--muted-low)]">Lab heartbeat</span>
                <h2 className="mt-2 font-lab-display text-xl font-semibold text-[var(--text-strong)]">今日实验台</h2>
              </div>
              <RadioTower className="text-[var(--amber)]" size={22} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {["Draft", "Review", "Ship"].map((step, index) => (
                <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-3" key={step}>
                  <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">0{index + 1}</span>
                  <strong className="mt-2 block text-sm text-[var(--text-strong)]">{step}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]" id="modules">
        <div className="space-y-5">
          <Panel className="lab-card p-5" data-lab-animate>
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <ShieldCheck size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">角色权限模拟</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              登录只是前端原型状态。管理员和普通用户共享阅读、评论、订阅等能力，但后台入口只对管理员展示。
            </p>
            <div className="mt-5 grid gap-2">
              {roleOrder.map((role) => (
                <button
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-left transition-colors",
                    activePersona === role
                      ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
                      : "border-[var(--border-soft)] bg-[var(--surface-field)] hover:border-[var(--muted-low)]",
                  )}
                  key={role}
                  onClick={() => useUiStore.getState().setActivePersona(role)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-medium text-[var(--text-strong)]">{personas[role].name}</span>
                    <span className="block font-lab-mono text-xs text-[var(--muted)]">{personas[role].email}</span>
                  </span>
                  {personas[role].canEnterAdmin ? <LayoutDashboard size={16} /> : <BookOpen size={16} />}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="lab-card p-5" data-lab-animate>
            <div className="flex items-center gap-2 text-[var(--amber)]">
              <Zap size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">可交互原型</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              主题、登录、角色和后台访问都走前端状态，后续接 API 时只需要替换 store 的数据来源。
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleModules.map((module) => (
            <RoleModuleCard activeRole={activePersona} key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" id="articles">
        <Panel className="overflow-hidden" data-lab-animate>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2">
              <PenLine className="text-[var(--cyan)]" size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">内容工作流</h2>
            </div>
            <Badge tone="neutral">mock articles</Badge>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {articleSummaries.map((article) => (
              <article className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_120px]" key={article.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "cyan" : "purple"}>
                      {article.status}
                    </Badge>
                    <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.category}</span>
                  </div>
                  <h3 className="mt-3 font-lab-display text-xl font-semibold text-[var(--text-strong)]">{article.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p>
                </div>
                <div className="flex items-end justify-between gap-3 md:flex-col md:items-end">
                  <span className="font-lab-mono text-xs text-[var(--muted-low)]">{article.updatedAt}</span>
                  <span className="font-lab-mono text-xs text-[var(--text)]">{article.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden" data-lab-animate>
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className="text-[var(--rose)]" size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Lab Activity</h2>
            </div>
            <Badge tone="rose">live-ish</Badge>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {labActivities.map((activity) => (
              <div className="grid grid-cols-[16px_1fr] gap-4 px-5 py-4" key={activity.id}>
                <span className={cn("mt-1 size-2 rounded-full", activity.tone === "cyan" && "bg-[var(--cyan)]", activity.tone === "green" && "bg-[var(--success)]", activity.tone === "purple" && "bg-[var(--purple)]", activity.tone === "amber" && "bg-[var(--amber)]", activity.tone === "rose" && "bg-[var(--rose)]")} />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-[var(--text-strong)]">{activity.title}</h3>
                    <span className="font-lab-mono text-[11px] text-[var(--muted-low)]">{activity.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 md:grid-cols-3" id="studio">
        {[
          { title: "主题实验室", icon: Sparkles, detail: "黑白主题切换、主题配置 Schema、用户覆盖值。" },
          { title: "插件车间", icon: Boxes, detail: "搜索、通知、存储和内容增强都可在插件层扩展。" },
          { title: "探索入口", icon: Compass, detail: "相册、友链、音乐和专题共同组成公开 Lab 导航。" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Panel className="lab-card p-5" data-lab-animate key={item.title}>
              <Icon className="text-[var(--cyan)]" size={20} />
              <h2 className="mt-4 font-lab-display text-lg font-semibold text-[var(--text-strong)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
            </Panel>
          );
        })}
      </section>
    </main>
  );
}

function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <Button aria-label="切换黑白主题" className="w-10 px-0" icon={<Icon size={16} />} onClick={toggleTheme} variant="secondary">
      <span className="sr-only">切换黑白主题</span>
    </Button>
  );
}

function AccountSwitcher() {
  const activePersona = useUiStore((state) => state.activePersona);
  const loginPanelOpen = useUiStore((state) => state.loginPanelOpen);
  const setActivePersona = useUiStore((state) => state.setActivePersona);
  const setLoginPanelOpen = useUiStore((state) => state.setLoginPanelOpen);
  const persona = personas[activePersona];

  return (
    <div className="relative">
      <Button icon={activePersona === "guest" ? <UserRound size={15} /> : <ChevronDown size={15} />} onClick={() => setLoginPanelOpen(!loginPanelOpen)} variant={activePersona === "guest" ? "primary" : "secondary"}>
        {activePersona === "guest" ? "登录" : persona.name}
      </Button>

      {loginPanelOpen && (
        <div className="absolute right-0 top-12 z-40 w-[min(340px,calc(100vw-2rem))] rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-glass)] p-3 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="px-2 pb-3">
            <span className="font-lab-mono text-xs uppercase text-[var(--muted-low)]">prototype login</span>
            <h2 className="mt-1 font-lab-display text-lg font-semibold text-[var(--text-strong)]">选择一个模拟身份</h2>
          </div>
          <div className="grid gap-2">
            {(["member", "admin"] as PersonaRole[]).map((role) => (
              <button
                className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-3 text-left transition-colors hover:border-[var(--cyan)]"
                key={role}
                onClick={() => setActivePersona(role)}
                type="button"
              >
                <span
                  aria-label={`${personas[role].name} avatar`}
                  className="block size-9 shrink-0 rounded-[var(--radius)] bg-[var(--surface-raised)] bg-cover bg-center"
                  role="img"
                  style={backgroundImageStyle(siteBranding.defaultAvatarUrl)}
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--text-strong)]">{personas[role].name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{personas[role].description}</span>
                </span>
              </button>
            ))}
          </div>
          <Button className="mt-3 w-full" onClick={() => setActivePersona("guest")} variant="ghost">
            退出到访客
          </Button>
        </div>
      )}
    </div>
  );
}

function RoleModuleCard({ activeRole, module }: { activeRole: PersonaRole; module: LabModule }) {
  const locked = module.adminOnly && activeRole !== "admin";
  const Icon = locked ? Lock : module.id === "admin-console" ? LayoutDashboard : module.id === "album-wall" ? GalleryHorizontalEnd : BookOpen;

  return (
    <Panel className={cn("lab-card flex min-h-48 flex-col justify-between p-5", locked && "opacity-72")} data-lab-animate>
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--cyan)]">
            <Icon size={18} />
          </span>
          <Badge tone={locked ? "neutral" : module.tone}>{locked ? "locked" : module.status}</Badge>
        </div>
        <h3 className="mt-5 font-lab-display text-lg font-semibold text-[var(--text-strong)]">{module.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{module.description}</p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--border-soft)] pt-4">
        <span className="font-lab-mono text-xs text-[var(--muted-low)]">{locked ? "需要管理员" : "可用模块"}</span>
        {module.id === "admin-console" && !locked ? (
          <Link className="inline-flex items-center gap-1 font-lab-mono text-xs text-[var(--cyan)]" href="/admin">
            打开 <ArrowRight size={13} />
          </Link>
        ) : (
          <span className="font-lab-mono text-xs text-[var(--text)]">prototype</span>
        )}
      </div>
    </Panel>
  );
}
